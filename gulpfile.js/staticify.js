'use strict';

const Cheerio = require('cheerio');
const Vinyl = require('vinyl');
const config = require('@lib/config');
const gulp = require('gulp');
const nunjucks = require('nunjucks');
const through = require('through2');
const {htmlContent} = require('@lib/utils/cheerioHelper');
const {project} = require('@lib/utils');
// const {survey} = require('@lib/templates/SurveyFilter.js'); // Partitioned: survey
// const {importBlog} = require('@lib/templates/ImportBlogFilter.js'); // Partitioned: importBlog
// const { // Partitioned: importYouTubeChannel
//   importYouTubeChannel,
// } = require('@lib/templates/ImportYouTubeChannel.js');
const {
  // Essential
  SupportedFormatsExtension,
} = require('@lib/templates/SupportedFormatsExtension.js');
const {
  // Essential
  FORMAT_WEBSITES,
  SUPPORTED_FORMATS,
} = require('@lib/amp/formatHelper.js');
const {cheerioOptions} = require('../platform/lib/common/cheerioOptions'); // Essential
const coursesPath = '/documentation/courses'; // Essential
const coursesRegex = new RegExp(`^(.+)(?:${coursesPath})(.*)$`); // Essential

const getUpdatedURL = (u, requestedFormat, forcedFormat) => {
  // Essential
  return u.replace(
    /(.*documentation\/[^/]+)[\/.]([^?]+)?(?:\?(?:[^=]*)=(.*))?/,
    (match, section, page, embeddedQueryFormat) => {
      if (page === 'html') {
        page = 'index.html';
      }

      const hasFormat = forcedFormat || embeddedQueryFormat || requestedFormat;
      const fmt = hasFormat ? `${hasFormat}/` : '';
      return `${section}/${fmt}${page || ''}`;
    }
  );
};

/**
 * creates a new nunjucks environment for rendering
 *
 */
function nunjucksEnv() {
  // Essential (but filters/extensions might be partitioned)
  const env = new nunjucks.Environment(null, {
    tags: {
      blockStart: '[%',
      blockEnd: '%]',
      variableStart: '[=',
      variableEnd: '=]',
      commentStart: '[[[[#',
      commentEnd: '#]]]]',
    },
  });

  env.addExtension(
    'SupportedFormatsExtension',
    new SupportedFormatsExtension()
  );
  // env.addFilter('importBlog', importBlog, true); // Partitioned: importBlog
  // env.addFilter('importYouTubeChannel', importYouTubeChannel, true); // Partitioned: importYouTubeChannel
  // env.addFilter('survey', survey, true); // Partitioned: survey

  return env;
}

/**
 * Compiles the pages into standalone static files
 *
 * @return {Promise}
 */
async function staticify(done) {
  // Essential
  const logger = require('@lib/utils/log')('Static File Generator'); // Essential

  const requestPathRegex = new RegExp( // Essential
    `${project.paths.PAGES_DEST}|(index)?.html`,
    'g'
  );

  const generatedFormats = SUPPORTED_FORMATS.map((format) => {
    // Essential
    const f = (cb) => {
      const env = nunjucksEnv(); // Essential

      return gulp
        .src(`${project.paths.PAGES_DEST}/**/*html`)
        .pipe(
          // Render a static version of all of our pages

          through.obj(async (file, enc, callback) => {
            const configObj = {
              requestPath: `${file.path.replace(requestPathRegex, '')}/`,
              level: 'beginner', // Some filters require any level to be set, so we set a default here.
              format,
              requestedFormat: format,
            };

            const srcHTML = file.contents.toString();

            env.renderString(srcHTML, configObj, (err, result) => {
              if (err) {
                logger.error(`Error rendering ${file.path}`);
                return callback(err);
              }

              file.contents = Buffer.from(result);
              callback(null, file);
            });
          })
        )
        .pipe(
          through.obj(async function (file, enc, callback) {
            // Rewrite links inside of each of the pages

            const $ = Cheerio.load(file.contents.toString());
            const $links = $('a.nav-link, a.ap-m-format-toggle-link');

            $links.each(function () {
              // eslint-disable-next-line no-invalid-this
              const $this = $(this);
              const origURL = $this.attr('href');
              const updatedURL = getUpdatedURL(origURL, format);

              $this.attr('href', updatedURL);
            });

            const renderedPage = htmlContent($.root());

            // we need to render a "default" version for the URLs, and treat the "website" version as such
            if (format === FORMAT_WEBSITES) {
              const {path} = file;
              let contents = Buffer.from(renderedPage);

              if (file.path.endsWith('tools.html')) {
                // In addition to the tools pages for each format, we need to render a seperate main version that
                // shows all of them. Rather than render its twice, we can just toggle a classname.
                $('.ap-a-pill').addClass('active');
                contents = htmlContent($.root());
                contents = Buffer.from(contents);
              }

              // eslint-disable-next-line no-invalid-this
              this.push(new Vinyl({path, contents}));
            }

            file.path = getUpdatedURL(file.path, format);
            file.contents = Buffer.from(renderedPage);

            callback(null, file);
          })
        )
        .pipe(gulp.dest((file) => file.base))
        .on('end', cb);
    };

    Object.defineProperty(f, 'name', {
      value: `generatePagesFor${format}`,
      writable: false,
    });
    return f;
  });

  // generatedLevels relies on coursesPath, which is essential
  const generatedLevels = ['beginner', 'advanced'].map((level) => {
    // Essential
    const f = (cb) => {
      const env = nunjucksEnv(); // Essential

      return gulp
        .src(`${project.paths.PAGES_DEST}${coursesPath}/**/*.html`)
        .pipe(
          through.obj((file, enc, callback) => {
            const srcHTML = file.contents.toString();
            const configObj = {
              requestPath: `${file.path.replace(requestPathRegex, '')}/`,
              level,
              format: FORMAT_WEBSITES,
              requestedFormat: FORMAT_WEBSITES,
            };

            logger.log(`trying to rendering ${file.path}`);

            env.renderString(srcHTML, configObj, (err, result) => {
              if (err) {
                return callback(err);
              }

              file.contents = Buffer.from(result);
              callback(null, file);
            });
          })
        )
        .pipe(
          through.obj(function (file, enc, callback) {
            let renderedPage = file.contents.toString();

            const $ = Cheerio.load(renderedPage, cheerioOptions);
            const $links = $('.nav-link');
            const $levelToggle = $('.toggle-button input');

            $links.each(function () {
              // eslint-disable-next-line no-invalid-this
              const $this = $(this);
              const origURL = $this.attr('href');
              const updatedURL = origURL.replace(
                coursesRegex,
                (match, a, b) => `${a}/${coursesPath}/${level}${b}`
              );

              $this.attr('href', updatedURL);
            });

            const originalToggleLink = $levelToggle.attr('on');

            if (originalToggleLink) {
              const updatedToggleLink = originalToggleLink.replace(
                /(^[^\/]+\/[^\/]+\/[^\/]+\/)([^?]+)+\?level=([^']+)(.+)$/,
                (match, prefix, coursePath, level, suffix) =>
                  `${prefix}${level}/${coursePath}${suffix}`
              );
              $levelToggle.attr('on', updatedToggleLink);

              renderedPage = htmlContent($.root());
            }

            if (level === 'beginner') {
              // eslint-disable-next-line no-invalid-this
              this.push(
                new Vinyl({
                  path: `${file.path}`,
                  contents: Buffer.from(renderedPage),
                })
              );
            }

            file.path = file.path.replace(
              coursesRegex,
              (match, a, b) => `${a}/${coursesPath}/${level}${b}`
            );
            file.contents = Buffer.from(renderedPage);
            callback(null, file);
          })
        )
        .pipe(gulp.dest((f) => f.base))
        .on('end', cb);
    };

    Object.defineProperty(f, 'name', {
      value: `generateCoursesFor${level}`,
      writable: false,
    });
    return f;
  });

  // Search-promoted pages is part of search, which is essential
  await gulp // Essential
    .src(`${project.paths.STATICS_DEST}/files/search-promoted-pages/*json`)
    .pipe(
      through.obj((file, encoding, callback) => {
        const rawJSON = file.contents.toString();
        const data = JSON.parse(rawJSON);

        for (const page of data.pages) {
          page.url = new URL(page.url, config.hosts.platform.base).toString();
        }

        for (const page of data.components) {
          page.url = new URL(page.url, config.hosts.platform.base).toString();
        }

        file.contents = Buffer.from(
          JSON.stringify({
            result: data,
            initial: true,
          })
        );

        callback(null, file);
      })
    )
    .pipe(gulp.dest(() => `${project.paths.PAGES_DEST}/search/highlights/`));

  await gulp // Essential
    .src([
      project.absolute('pages/static/**/*'),
      project.absolute('examples/static/**/*'),
      project.absolute('frontend21/dist/static/**/*'),
    ])
    .pipe(gulp.dest(`${project.paths.PAGES_DEST}/static`));

  await gulp // Essential
    .src(`${project.paths.STATICS_DEST}/**/*`)
    .pipe(gulp.dest(() => `${project.paths.PAGES_DEST}/static`));

  return new Promise((resolve, reject) => {
    // Essential
    gulp.series(
      gulp.parallel(...generatedLevels),
      gulp.parallel(...generatedFormats),
      (seriesDone) => {
        seriesDone();
        resolve();
        done();
      }
    )();
  });
}

exports.staticify = staticify; // Essential
