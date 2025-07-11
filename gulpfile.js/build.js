'use strict';

const gulp = require('gulp');
const {sh} = require('@lib/utils/sh');
const grow = require('@lib/utils/grow');
const mkdirp = require('mkdirp').sync;
const config = require('@lib/config');
const signale = require('signale');
const del = require('del');
const fs = require('fs');
const path = require('path');
const through = require('through2');
const archiver = require('archiver');
const yaml = require('js-yaml');
// const {samplesBuilder} = require('@lib/build/samplesBuilder'); // Non-essential: samplesBuilder
const {project} = require('@lib/utils');
const git = require('@lib/utils/git');
// const ComponentReferenceImporter = require('@lib/pipeline/componentReferenceImporter'); // Non-essential: ComponentReferenceImporter
// const SpecImporter = require('@lib/pipeline/specImporter'); // Non-essential: SpecImporter
// const RecentGuides = require('@lib/pipeline/recentGuides'); // Non-essential: RecentGuides
const gulpSass = require('gulp-sass')(require('sass'));
// const importRoadmap = require('./import/importRoadmap.js'); // Non-essential: importRoadmap
// const importWorkingGroups = require('./import/importWorkingGroups.js'); // Non-essential: importWorkingGroups
const {staticify} = require('./staticify.js');
const {whoAmI} = require('./whoAmI.js');
// const importAdVendorList = require('./import/importAdVendorList.js'); // Non-essential: importAdVendorList
// const {thumborImageIndex} = require('./thumbor.js'); // Non-essential: thumborImageIndex
const CleanCSS = require('clean-css');
// const {PIXI_CLOUD_ROOT} = require('@lib/utils/project').paths; // Non-essential: PIXI_CLOUD_ROOT
const {copyFile} = require('fs/promises');
// const nunjucks = require('nunjucks'); // Comment out: nunjucksEnv is now unused
// const {importBlog} = require('@lib/templates/ImportBlogFilter.js'); // Non-essential: importBlog
// const { // Non-essential: importYouTubeChannel
//   importYouTubeChannel,
// } = require('@lib/templates/ImportYouTubeChannel.js');
// const {survey} = require('@lib/templates/SurveyFilter.js'); // Non-essential: survey
// const {survey} = require('@lib/templates/SurveyFilter.js'); // Already commented
// const { // Non-essential: SupportedFormatsExtension is used by nunjucksEnv, which is non-essential
//   SupportedFormatsExtension,
// } = require('@lib/templates/SupportedFormatsExtension.js');
const {optimize} = require('@lib/utils/ampOptimizer.js'); // Essential
const toml = require('@iarna/toml'); // Essential

// Path of the grow test pages for filtering in the grow podspec.yaml
const TEST_CONTENT_PATH_REGEX = '^/tests/';

/**
 * Cleans all directories/files that get created by any of the following
 * tasks
 *
 * @return {Promise}
 */
function clean() {
  return del(
    [
      project.absolute('.cache/**/*'),

      project.paths.DIST,
      project.paths.BUILD,

      project.absolute('boilerplate/dist'),

      project.paths.CSS,
      project.absolute('pages/extensions/**/*.pyc'),
      project.absolute(
        'pages/content/amp-dev/documentation/examples/documentation/**/*.html'
      ),
      project.absolute(
        'pages/content/amp-dev/documentation/examples/previews/**/*.html'
      ),
      project.absolute('pages/icons'),
      project.absolute('pages/layouts'),
      project.absolute('pages/macros'),
      project.absolute('pages/views'),
      project.absolute('pages/.depcache.json'),
      project.absolute('pages/podspec.yaml'),

      // project.absolute('examples/static/samples/samples.json'), // Partitioned: samplesBuilder
      // project.absolute('playground/dist'), // Partitioned: playground

      project.paths.GROW_BUILD_DEST,
      project.paths.STATICS_DEST,
      project.absolute('platform/static'),
      // project.absolute('playground/dist'), // Partitioned: playground - already handled above in del
    ],
    {'force': true}
  );
}

/**
 * Compiles all SCSS partials to CSS
 *
 * @return {Stream}
 */
function sass() {
  const options = {
    'outputStyle': 'compressed',
    'includePaths': [project.paths.SCSS],
  };

  return gulp
    .src(`${project.paths.SCSS}/**/[^_]*.scss`)
    .pipe(gulpSass.sync(options))
    .on('error', function (e) {
      console.error(e);
      // eslint-disable-next-line no-invalid-this
      this.emit('end');
    })
    .pipe(gulp.dest(project.paths.CSS));
}

/**
 * Copies the templates into the Grow pod
 *
 * @return {Stream}
 */
function templates() {
  return gulp
    .src(`${project.paths.FRONTEND_TEMPLATES}/**/*`)
    .pipe(gulp.dest(project.paths.GROW_POD));
}

/**
 * Copies the icons into the Grow pod
 *
 * @return {Stream}
 */
function icons() {
  return gulp
    .src(`${project.paths.ICONS}/**/*`)
    .pipe(gulp.dest(`${project.paths.GROW_POD}/icons`));
}

function buildFrontend21() {
  return sh('npm run build:frontend');
}

/**
 * Runs all tasks needed to build the frontend
 * @return {undefined}
 */
function buildFrontend(done) {
  return gulp.parallel(sass, templates, icons, buildFrontend21)(done);
}

/**
 * Builds the playground
 * @return {Promise}
 */
// async function buildPlayground() { // Non-essential: playground
//   await sh('mkdir -p playground/dist');
//   await sh('npm run build:playground');
//
//   await gulp
//     .src(project.absolute('netlify/configs/preview.amp.dev/netlify.toml'))
//     .pipe(gulp.dest(`${project.paths.DIST}/examples`));
//
//   await gulp
//     .src([project.absolute('pages/static/**/*')])
//     .pipe(gulp.dest(`${project.paths.DIST}/playground/static`));
//
//   await gulp
//     .src(project.absolute('playground/dist/**/*'))
//     .pipe(gulp.dest(`${project.paths.DIST}/playground`));
//
//   return await gulp
//     .src(project.absolute('netlify/configs/playground.amp.dev/netlify.toml'))
//     .pipe(gulp.dest(`${project.paths.DIST}/playground`));
// }

/**
 * Builds Pixi
 * @return {Promise}
 */
// async function buildPixi() { // Non-essential: pixi
//   await sh('mkdir -p pixi/dist');
//   return sh('npm run build:pixi');
// }

/**
 * Builds the pixi cloud functions project
 */
// function buildPixiFunctions() { // Non-essential: pixiFunctions
//   return sh('npm install', {
//     workingDir: PIXI_CLOUD_ROOT,
//   });
// }

/**
 * Builds the boilerplate generator
 * @return {Promise}
 */
function buildBoilerplate() {
  // Essential
  return sh('node build.js', {
    workingDir: project.absolute('boilerplate'),
  });
}

/**
 * Builds documentation pages, preview pages and source files by parsing
 * the samples sources
 *
 * @return {Promise}
 */
// function buildSamples() { // Non-essential: samplesBuilder
//   return samplesBuilder.build();
// }

/**
 * Zips templates for download.
 */
function zipTemplates() {
  // Essential
  const templateDir = path.join(project.paths.DIST, 'static/files/templates/');
  mkdirp(templateDir);
  return gulp.src(project.paths.TEMPLATES + '/*/*/').pipe(
    through.obj(async (file, encoding, callback) => {
      const archive = archiver('zip', {
        'zlib': {'level': 9},
      });
      const zipFilePath = path.join(templateDir, file.basename + '.zip');
      const zipFileStream = fs.createWriteStream(zipFilePath);
      archive
        .directory(file.path + '/', false)
        .pipe(zipFileStream)
        .on('close', () => {
          signale.success(`Zipped template ${zipFilePath}`);
          callback();
        })
        .on('error', (e) => {
          signale.error(`Writing template zip ${zipFilePath} failed`, e);
          callback(e);
        });
      archive.finalize();
    })
  );
}

/**
 * Runs all importers
 *
 * @return {Promise}
 */
function importAll() {
  // Essential (but calls will be partitioned)
  return Promise.all([
    // new ComponentReferenceImporter().import(), // Non-essential: ComponentReferenceImporter
    // new SpecImporter().import(), // Non-essential: SpecImporter
    // new RecentGuides().import(), // Non-essential: RecentGuides (from the list in reqs)
    // importRoadmap.importRoadmap(), // Non-essential: importRoadmap
    // importWorkingGroups.importWorkingGroups(), // Non-essential: importWorkingGroups
    // importAdVendorList.importAdVendorList(), // Non-essential: importAdVendorList
  ]);
}

/**
 * Imports just the reference docs.
 *
 * @return {Promise}
 */
// function importComponents() { // Non-essential (no longer used by importAll)
//   return new ComponentReferenceImporter().import();
// }

/**
 * Builds playground and boilerplate generator, imports all remote documents,
 * builds samples, lints Grow pod and JavaScript.
 *
 * @return {undefined}
 */
function buildPrepare(done) {
  // Essential
  return gulp.series(
    // Build playground and boilerplate that early in the flow as they are
    // fairly quick to build and would be annoying to eventually fail downstream
    // buildSamples, // Non-essential: samplesBuilder
    // --- ADDED STEP: Copy samples.json to expected location --- (Dependent on buildSamples, so comment out)
    // async function copySamplesJson() {
    //   const sourcePath = project.absolute('examples/static/samples/samples.json');
    //   const destPath = path.join(project.paths.STATICS_DEST, 'samples/samples.json');
    //   await mkdirp(path.dirname(destPath)); // Ensure destination directory exists
    //   await copyFile(sourcePath, destPath);
    //   signale.success(`Copied samples.json from ${sourcePath} to ${destPath}`);
    // },
    gulp.parallel(
      // buildPlayground, // Non-essential: playground
      buildBoilerplate, // Essential
      // buildPixi, // Non-essential: pixi
      buildFrontend21, // Essential
      importAll, // Essential (but its internal calls are partitioned)
      zipTemplates, // Essential
      persistBuildInfo // ADD THIS LINE: Generate build-info.yaml here
    ),
    async () => {
      // Essential (used by deploy workflow)
      if (!process.env.CI) {
        return;
      }
      const archive = `artifacts/pages-${process.env.GITHUB_RUN_ID}.tar.gz`;
      // we need to add all folders that contain files generated by the grow process...
      const SETUP_STORED_PATHS = [
        './pages/content/',
        './pages/shared/',
        './dist/',
        './boilerplate/lib/',
        './boilerplate/dist/',
        // './playground/dist/', // Non-essential
        './frontend21/dist/',
        './.cache/',
        // './examples/static/samples/samples.json', // Partitioned: samplesBuilder
        './platform/config/build-info.yaml', // ADD THIS LINE: Explicitly include build-info.yaml
      ];

      await sh(`mkdir -p artifacts`);
      await sh(`tar cfj ${archive} ${SETUP_STORED_PATHS.join(' ')}`);
    },
    // eslint-disable-next-line prefer-arrow-callback
    function exit(_done) {
      // Essential (used by gulp.series)
      done();
      _done();
      process.exit(0);
    }
  )(done);
}

/**
 * Fetches remote artifacts that have been built in earlier stages
 *
 * @return {Promise}
 */
function unpackArtifacts() {
  // Essential
  let stream = gulp.src(['artifacts/**/*.tar.gz', 'artifacts/**/*.zip'], {
    'read': false,
  });

  stream = stream.pipe(
    through.obj(async (artifact, encoding, callback) => {
      console.log('Unpacking', artifact.path, '...');
      await sh(`tar xf ${artifact.path}`);
      await sh(`rm ${artifact.path}`);
      stream.push(artifact);
      callback();
    })
  );

  return stream;
}

/**
 * Starts Grow to build the pages
 *
 * @return {Promise}
 */
function buildPages(done) {
  // Essential
  return gulp.series(
    unpackArtifacts, // Essential
    buildFrontend, // Essential
    // eslint-disable-next-line prefer-arrow-callback
    async function buildGrow() {
      // Essential (core Grow build)
      const options = {};
      if (config.isTestMode()) {
        options.include_paths = TEST_CONTENT_PATH_REGEX;
        options.locales = 'en';
        options.noSitemap = true;
      } else if (config.isProdMode()) {
        options.ignore_paths = TEST_CONTENT_PATH_REGEX;
      }
      config.configureGrow(options);

      await grow('deploy --noconfirm --threaded');
    },
    minifyPages, // Essential
    // eslint-disable-next-line prefer-arrow-callback
    function sharedPages() {
      // Essential
      // Copy shared pages separated from PageTransformer as they should
      // not be transformed
      return gulp
        .src(`${project.paths.GROW_BUILD_DEST}/shared/*.html`)
        .pipe(gulp.dest(`${project.paths.PAGES_DEST}/shared`));
    },
    // eslint-disable-next-line prefer-arrow-callback
    async function copyBuildFiles(done) {
      // Essential (copies manifest, serviceworker, etc.)
      if (!config.options?.locales?.includes(config.getDefaultLocale())) {
        console.log(
          'Skipping page publishing. Default language is not build, only:',
          config.options.locales
        );
        return done();
      }

      await copyFile(
        `${project.paths.GROW_POD}/static/manifest.json`,
        `${project.paths.PAGES_DEST}/manifest.json`
      );

      await copyFile(
        `${project.paths.GROW_POD}/static/serviceworker.js`,
        `${project.paths.PAGES_DEST}/serviceworker.js`
      );

      await copyFile(
        `${project.paths.GROW_BUILD_DEST}/index-2021.html`,
        `${project.paths.PAGES_DEST}/index.html`
      );

      await copyFile(
        `${project.paths.GROW_BUILD_DEST}/about/websites-2021.html`,
        `${project.paths.PAGES_DEST}/about/websites.html`
      );

      await gulp
        .src([`${project.paths.TEMPLATES}/**/*`])
        .pipe(
          gulp.dest(
            `${project.paths.PAGES_DEST}/documentation/templates/preview/`
          )
        );

      await gulp
        .src([project.absolute('pages/static/**/*')])
        .pipe(gulp.dest(`${project.paths.PAGES_DEST}/static`));

      await gulp
        .src(project.absolute('netlify/configs/amp.dev/netlify.toml'))
        .pipe(
          through.obj((file, encoding, callback) => {
            let netlifyConfig = file.contents.toString();

            const goLinks = project.absolute('platform/config/go-links.yaml');
            let redirects = yaml.load(fs.readFileSync(goLinks, 'utf-8'));

            // remove the regex entries in the go links, they were manually added
            // to the config
            redirects = Object.entries(redirects).filter(
              ([path]) => !path.includes('^')
            );

            redirects = redirects.map(([from, to]) => {
              from = `https://go.amp.dev${from}`;

              // we only want to update the URL of shorturls that point to relative URLs
              if (!to.startsWith('http://') && !to.startsWith('https://')) {
                to = `https://amp.dev${to}`;
              }

              return {
                from,
                to,
                'status': 302,
                'force': true,
              };
            });

            netlifyConfig = toml.parse(netlifyConfig);
            netlifyConfig.redirects = [
              ...(netlifyConfig.redirects || []),
              ...redirects,
            ];

            netlifyConfig = toml.stringify(netlifyConfig, 0, 2);

            file.contents = Buffer.from(netlifyConfig);

            return callback(null, file);
          })
        )
        .pipe(gulp.dest(`${project.paths.PAGES_DEST}`));

      done();
    },
    staticify, // Essential
    // renderExamples, // Non-essential: newPost is part of it
    optimizeFiles, // Essential
    // eslint-disable-next-line prefer-arrow-callback
    function sitemap() {
      // Essential (Grow output)
      // Copy XML files written by Grow
      return gulp
        .src(`${project.paths.GROW_BUILD_DEST}/**/*.xml`)
        .pipe(gulp.dest(`${project.paths.PAGES_DEST}`));
    },
    // eslint-disable-next-line prefer-arrow-callback
    async function packArtifacts() {
      // Essential (used by deploy workflow)
      if (!process.env.CI) {
        return;
      }

      const archive = `artifacts/pages-${process.env.GITHUB_RUN_ID}.tar.gz`;
      // we need to add all folders that contain files generated by the grow process...
      await sh(
        `tar cfj ${archive} ./dist/pages ./dist/inline-examples ` +
          './dist/static/files/search-promoted-pages'
      );
    },
    whoAmI // Essential
  )(done);
}

/**
 * creates a new nunjucks environment for rendering
 *
 */
// Comment out nunjucksEnv function definition itself
// function nunjucksEnv() { // Non-essential: nunjucksEnv (used by renderExamples, which is non-essential)
//   const env = new nunjucks.Environment(null, {
//     tags: {
//       blockStart: '[%',
//       blockEnd: '%]',
//       variableStart: '[=',
//       variableEnd: '=]',
//       commentStart: '[[[[#',
//       commentEnd: '#]]]]',
//     },
//   });
//
//   env.addExtension(
//     'SupportedFormatsExtension',
//     new SupportedFormatsExtension()
//   );
//   // env.addFilter('importBlog', importBlog, true); // Already commented
//   // env.addFilter('importYouTubeChannel', importYouTubeChannel, true); // Already commented
//   // env.addFilter('survey', survey, true); // Already commented
//
//   return env;
// }

function optimizeFiles(cb) {
  // Essential
  return gulp
    .src([
      `${project.paths.PAGES_DEST}/**/*.html`,
      `!${project.paths.PAGES_DEST}/static/samples/**/*.html`,
    ])
    .pipe(
      through.obj((file, encoding, callback) => {
        const unoptimizedFile = file.contents.toString();

        console.log(`running optimize on ${file.path}...`);

        optimize({query: ''}, unoptimizedFile, {}, file.path).then(
          (optimizedFile) => {
            file.contents = Buffer.from(optimizedFile);
            callback(null, file);
          }
        );
      })
    )
    .pipe(gulp.dest((f) => f.base))
    .on('end', cb);
}

// function newPost(text, img, id) { // Non-essential: newPost
//   return {
//     id: id,
//     text: text,
//     img: '/static/samples/img/' + img,
//     timestamp: Number(new Date()),
//   };
// }

// async function renderExamples(done) { // Non-essential: renderExamples (uses newPost)
//   const logger = require('@lib/utils/log')('Static File Generator');
//   const env = nunjucksEnv();
//   const blogItems = [
//     newPost('A green landscape with trees.', 'landscape_green_1280x853.jpg', 1),
//     newPost(
//       'Mountains reflecting on a lake.',
//       'landscape_mountains_1280x657.jpg',
//       2
//     ),
//     newPost(
//       'A road leading to a lake with mountains on the back.',
//       'landscape_lake_1280x857.jpg',
//       3
//     ),
//     newPost(
//       'Forested hills with a grey sky in the background.',
//       'landscape_trees_1280x960.jpg',
//       4
//     ),
//     newPost(
//       'Scattered houses in a mountain village.',
//       'landscape_village_1280x853.jpg',
//       5
//     ),
//     newPost('A deep canyon.', 'landscape_canyon_1280x1700.jpg', 6),
//     newPost(
//       'A desert with mountains in the background.',
//       'landscape_desert_1280x853.jpg',
//       7
//     ),
//     newPost('Colorful houses on a street.', 'landscape_houses_1280x803.jpg', 8),
//     newPost('Blue sea surrounding a cave.', 'landscape_sea_1280x848.jpg', 9),
//     newPost(
//       'A ship sailing the sea at sunset.',
//       'landscape_ship_1280x853.jpg',
//       10
//     ),
//   ];
//
//   const configObj = {
//     time: new Date().toLocaleTimeString(),
//     timestamp: Number(new Date()),
//     // send a random list of blog items to make it also work on the cache
//     blogItems: blogItems.filter(() =>
//       Math.floor(Math.random() * Math.floor(2))
//     ),
//   };
//
//   return gulp
//     .src(`${project.paths.DIST}/examples/sources/**/*.html`)
//     .pipe(
//       through.obj(async (file, enc, callback) => {
//         const srcHTML = file.contents.toString();
//
//         env.renderString(srcHTML, configObj, (err, result) => {
//           if (err) {
//             logger.error(`Error rendering ${file.path}`);
//             return callback(err);
//           }
//
//           file.contents = Buffer.from(result);
//           callback(null, file);
//         });
//       })
//     )
//     .pipe(gulp.dest((f) => f.base))
//     .on('end', () => {
//       done();
//     });
// }

/**
 * Removes unnecessary whitespace from rendered pages and minifies their CSS
 *
 * @return {Promise}
 */
function minifyPages() {
  // Essential
  // Configure CleanCSS to use a more aggressive set of rules to achieve better
  // results
  const cleanCss = new CleanCSS({
    2: {
      all: true,
      mergeSemantically: true,
      restructureRules: true,
    },
  });

  return gulp
    .src(`${project.paths.GROW_BUILD_DEST}/**/*.html`)
    .pipe(
      through.obj((page, encoding, callback) => {
        let html = page.contents.toString();

        // Minify the CSS
        const css = html.match(/(?<=<style amp-custom>).*?(?=<\/style>)/ms);
        if (css) {
          const minifiedCss = cleanCss.minify(css[0]).styles;
          html =
            html.slice(0, css.index) +
            minifiedCss +
            html.slice(css.index + css[0].length);
        }

        page.contents = Buffer.from(html);
        callback(null, page);
      })
    )
    .pipe(gulp.dest((f) => f.base))
    .on('end', cb);
}

/**
 * Collects the static files of all sub projcts to dist while creating ZIPs
 * from folders ending on .zip
 *
 * @return {Stream}
 */
function collectStatics(done) {
  // Essential
  // Used to keep track of unfinished archives
  const archives = {};

  gulp
    .src([
      project.absolute('pages/static/**/*'),
      project.absolute('examples/static/**/*'),
      project.absolute('frontend21/dist/static/**/*'),
    ])
    .pipe(
      through.obj(async function (file, encoding, callback) {
        // Skip potential archive parent directories to have the path writable later
        if (file.stat.isDirectory() && file.path.endsWith('.zip')) {
          callback();
          return;
        }

        // Check if file could be part of a ZIP and not already is one itself
        if (file.path.includes('.zip') && !file.path.endsWith('.zip')) {
          // If the file should be part of a ZIP file pass it over to archiver
          const relativePath = file.relative.slice(
            0,
            file.relative.indexOf('.zip') + 4
          );
          const archive =
            archives[relativePath] ||
            archiver('zip', {
              'zlib': {'level': 9},
            });

          // Only append real files, directories will be created automatically
          const filePath = file.relative.replace(relativePath, '');
          if (!file.stat.isDirectory() && filePath) {
            archive.append(file.contents, {'name': filePath});
          }

          archives[relativePath] = archive;
          callback();
          return;
        }

        // ... and simply copy all other files
        // eslint-disable-next-line no-invalid-this
        this.push(file);
        callback();
      })
    )
    .pipe(gulp.dest(project.paths.STATICS_DEST))
    .on('end', async () => {
      signale.await('Writing ZIPs ...');

      const writes = [];
      for (const [archivePath, contents] of Object.entries(archives)) {
        contents.finalize();

        const dest = path.join(project.paths.STATICS_DEST, archivePath);
        const archive = fs.createWriteStream(dest);

        writes.push(
          new Promise((resolve, reject) => {
            contents.pipe(archive).on('close', () => {
              signale.success(`Wrote archive ${archivePath}`);
              resolve();
            });
          })
        );
      }

      await gulp
        .src(`${project.paths.DIST}/inline-examples/documentation**/**/*`)
        .pipe(gulp.dest(`${project.paths.DIST}/examples/sources/`));

      await Promise.all(writes);
      signale.await('Finished collecting static files!');
      done();
    });
}

/**
 * Writes information about the current build to a file to be able to
 * inspect the current version on /who-am-i
 *
 * @return {undefined}
 */
function persistBuildInfo(done) {
  // Essential
  const buildInfo = {
    'number': process.env.GITHUB_RUN_ID || null,
    'at': new Date(),
    'by': process.env.GITHUB_ACTOR || git.user(),
    'environment': config.environment,
    'commit': {
      'sha': process.env.GITHUB_SHA || git.version(),
      'message': git.message(),
    },
  };
  // Ensure the directory exists before writing the file
  mkdirp(path.dirname(project.paths.BUILD_INFO));

  fs.writeFile(project.paths.BUILD_INFO, yaml.dump(buildInfo), done);
}

exports.clean = clean; // Essential
exports.sass = sass; // Essential
exports.icons = icons; // Essential
exports.templates = templates; // Essential
// exports.importAll = importAll; // Non-essential: importAll
// exports.importComponents = importComponents; // Non-essential: importComponents (depends on ComponentReferenceImporter)
// exports.buildPlayground = buildPlayground; // Non-essential: playground
// exports.buildPixi = buildPixi; // Non-essential: pixi
exports.buildBoilerplate = buildBoilerplate; // Essential
exports.buildFrontend = buildFrontend; // Essential
// exports.buildSamples = buildSamples; // Non-essential: samplesBuilder
exports.zipTemplates = zipTemplates; // Essential
exports.buildPages = buildPages; // Essential
exports.buildPrepare = buildPrepare; // Essential
exports.minifyPages = minifyPages; // Essential
exports.staticify = staticify; // Essential
exports.unpackArtifacts = unpackArtifacts; // Essential
exports.collectStatics = collectStatics; // Essential
exports.whoAmI = whoAmI; // Essential
// exports.buildPixiFunctions = buildPixiFunctions; // Non-essential: pixi
exports.buildFinalize = gulp.series(
  // Essential
  gulp.parallel(collectStatics, persistBuildInfo)
  //  thumborImageIndex, // Non-essential: thumborImageIndex
);

exports.build = gulp.series(
  // Essential
  clean,
  buildPrepare,
  buildPages,
  gulp.parallel(collectStatics, persistBuildInfo)
);

exports.buildForGrowTests = gulp.series(buildBoilerplate, buildPages); // Essential
