'use strict';

const express = require('express');
const cors = require('cors');
const ampCors = require('@ampproject/toolbox-cors');
const config = require('./config.js');
const {pagePath} = require('@lib/utils/project');
const log = require('@lib/utils/log')('Platform');
// const subdomain = require('./middleware/subdomain.js');
const webSocketServer = require('@examples/socket-server/socket-server');

const routers = {
  boilerplate: require('../../boilerplate/backend/'), // Essential
  cspReport: require('@lib/routers/cspReport.js'), // Essential
  example: {
    // Essential (example router components are part of core functionality)
    api: require('@examples'),
    embeds: require('@lib/routers/example/embeds.js'),
    sources: require('@lib/routers/example/sources.js'),
    static: require('@lib/routers/example/static.js'),
    experiments: require('@lib/routers/example/experiments.js'),
    inline: require('@lib/routers/inlineExamples.js'),
  },
  go: require('@lib/routers/go.js'), // Essential
  growPages: require('@lib/routers/growPages.js').growPages, // Essential
  growSharedPages: require('@lib/routers/growSharedPages.js'), // Essential
  growXmls: require('@lib/routers/growXmls.js'), // Essential
  healthCheck: require('@lib/routers/healthCheck.js').router, // Essential
  log: require('@lib/routers/runtimeLog.js'), // Essential
  notFound: require('@lib/routers/notFound.js'), // Essential
  // packager: require('@lib/routers/packager.js'), // Partitioned: packager is non-essential
  // pixi: require('../../pixi/backend/'), // Partitioned: pixi is non-essential
  // playground: require('../../playground/backend/'), // Partitioned: playground is non-essential
  search: require('@lib/routers/search.js'), // Essential (though search functionality will be separate project, router is basic)
  static: require('@lib/routers/static.js'), // Essential
  // survey: require('@lib/routers/surveyComponent.js'), // Partitioned: survey is non-essential
  // templates: require('@lib/routers/templates.js'), // Partitioned: templates router is non-essential
  // thumbor: require('@lib/routers/thumbor.js').thumborRouter, // Partitioned: thumbor is non-essential
  whoAmI: require('@lib/routers/whoAmI.js'), // Essential
};

const HOST = config.hosts.platform.base;
const PORT = config.hosts.platform.port || process.env.APP_PORT || 80;

class Platform {
  start() {
    log.info('Starting platform');
    return new Promise(async (resolve, reject) => {
      try {
        await this._createServer();
        this.httpServer = this.server.listen(PORT, () => {
          log.success(`server listening on ${PORT}!`);
          resolve();
        });

        webSocketServer.start(this.httpServer);

        // Increase keep alive timeout
        // see https://cloud.google.com/load-balancing/docs/https/#timeouts_and_retries
        this.httpServer.keepAliveTimeout = 700 * 1000;
      } catch (err) {
        reject(err);
      }
    });
  }

  stop() {
    log.info('Stopping platform');
    return new Promise(async (resolve, reject) => {
      this.httpServer.close(() => resolve());
    });
  }

  async _createServer() {
    log.await(
      `Starting platform with environment ${config.environment} on ${HOST} ...`
    );
    this.server = express();

    // pass app engine HTTPS status to express app
    this.server.set('trust proxy', true);
    this.server.disable('x-powered-by');

    this._configureMiddlewares();
    await this._configureSubdomains();
    this._configureRouters();
    this._configureErrorHandlers();
  }

  _configureMiddlewares() {
    // Essential
    this.server.use(require('./middleware/csp.js'));
    this.server.use(require('./middleware/security.js'));
    this.server.use(require('./middleware/redirects.js'));
    this.server.use(require('./middleware/caching.js'));
    this.server.use(
      cors({
        origin: true,
        credentials: true,
      })
    );
    this.server.use(
      ampCors({
        email: true,
      })
    );

    // debug computing times
    this.server.use((req, res, next) => {
      const timeStart = process.hrtime();

      res.on('finish', () => {
        const timeElapsed = process.hrtime(timeStart);
        let seconds = (timeElapsed[0] * 1000 + timeElapsed[1] / 1e6) / 1000;
        seconds = seconds.toFixed(3);
        const prefix = seconds > 1 ? 'CRITICAL_TIMING' : 'TIMING';
        let postfix = `[${res.statusCode}]`;
        if (req.header('amp-cache-transform')) {
          postfix += ' [SXG]';
        }
        console.log(
          `[${prefix}] ${req.get('host')}${
            req.originalUrl
          } ${seconds}s ${postfix}`
        );
      });

      next();
    });
  }

  async _configureSubdomains() {
    // Partitioned routers removed from here: playground, go, log, preview
    // These were handled implicitly by their `routers.<name>` definition.
    // Explicitly commenting here to align with strategy.
    // this.server.use(await subdomain.map(config.hosts.playground, routers.playground));
    // this.server.use(await subdomain.map(config.hosts.go, routers.go));
    // this.server.use(await subdomain.map(config.hosts.log, routers.log));
    // this.server.use(
    //   await subdomain.map(
    //     config.hosts.preview,
    //     express
    //       .Router() // eslint-disable-line new-cap
    //       .use([
    //         routers.example.api,
    //         routers.example.static,
    //         routers.example.embeds,
    //         routers.example.sources,
    //         routers.example.experiments,
    //         routers.example.inline,
    //       ])
    //   )
    // );
  }

  _configureRouters() {
    this.server.use(routers.cspReport); // Essential
    // Disable packager until we have a better way to manage our certs
    // this.server.use(routers.packager); // Partitioned: packager
    // this.server.use(routers.thumbor); // Partitioned: thumbor
    this.server.use(routers.whoAmI); // Essential
    this.server.use(routers.healthCheck); // Essential
    this.server.use(routers.example.api); // Essential
    // this.server.use(routers.pixi); // Partitioned: pixi
    // this.server.use(routers.survey); // Partitioned: survey
    this.server.use(routers.search); // Essential
    this.server.use(routers.boilerplate); // Essential
    this.server.use(routers.static); // Essential
    // this.server.use(routers.templates); // Partitioned: templates router
    // XMLs rendered by Grow as well as all pages located under /shared
    // are need to be served by specialized routers instead of the generic one.
    // Therefore register them first
    this.server.use(routers.growSharedPages); // Essential
    this.server.use(routers.growXmls); // Essential
    // Register the following router at last as it works as a catch-all
    this.server.use(routers.growPages); // Essential
  }

  _configureErrorHandlers() {
    // Essential
    // handle errors
    // eslint-disable-next-line no-unused-vars
    this.server.use((err, req, res, next) => {
      if (err) {
        console.error('[ERROR]', err);
        res.status(500).sendFile('500.html', {root: pagePath()});
      }
    });
    // handle 404s
    this.server.use(routers.notFound); // Essential
  }
}

module.exports = Platform;
