"use strict";

// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cp = require("child_process");
const cssnano = require("cssnano");
const del = require("del");
const eslint = require("gulp-eslint");
const haml = require("gulp-haml");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const sassImage = require('gulp-sass-image');
const webpack = require("webpack");
const webpackconfig = require("./webpack.config.js");
const webpackstream = require("webpack-stream");
const fileinclude = require('gulp-file-include');
const gulpCopy = require('gulp-copy');
const ghPages = require('gulp-gh-pages');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const flattern = require('gulp-flatten');
const sourcemaps = require('gulp-sourcemaps');
const formatHtml = require('gulp-format-html');
const bulkSass = require('gulp-sass-bulk-importer');

const paths = {
  images: 'assets/**/*.+(jpeg|jpg|png|gif|svg)',
}

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./app"
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

function image() {
    return gulp.src(paths.images)
        .pipe(sassImage({
            targetFile: '_generated-imagehelper.scss', // default target filename is '_sass-image.scss'
            // template: 'your-sass-image-template.mustache',
            //images_path: '/assets/',
            http_images_path: '/assets/images',
            css_path: './src/assets/stylesheets/includes'
        }))
        .pipe(gulp.dest('./src/assets/stylesheets/includes'));
}

// CSS task
function css() {
  return gulp
    .src("./src/assets/stylesheets/application.scss")
    .pipe(bulkSass())
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write(''))
    .pipe(gulp.dest("./app/assets/stylesheets"))
    .pipe(browsersync.stream());
}

// Clean assets
function clean() {
  return del(["./app"]);
}

//partials
function partials () {
  return gulp.src('./src/partials/**/*.haml')
    .pipe(haml())
    .pipe(gulp.dest(function(file) {return file.base;}))

}
//haml
function html () {
  return gulp.src('./src/*.haml')
    .pipe(haml())
    .pipe(fileinclude({
        prefix: '@@',
        basepath: '@file'
      }))
      .pipe(formatHtml())
    .pipe(gulp.dest('./app'));

}
// Lint scripts
function scriptsLint() {
  return gulp
    .src(["./src/assets/js/**/*", "./gulpfile.js"])
    .pipe(plumber())
    .pipe(eslint({ configFile: '.eslintrc'}))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
      .src(["./src/assets/js/**/*", "./src/partials/**/*.js"])
      .pipe(flattern())
      //.pipe(concat("index.min.js"))
      //.pipe(uglify())
      .pipe(plumber())
      //.pipe(webpackstream(webpackconfig, webpack))
      // folder only, filename is specified in webpack config
      .pipe(gulp.dest("./app/assets/js"))
      .pipe(browsersync.stream())
  );
}

//copy
function copy () {
  return gulp.src('./src/assets/images/**')
    .pipe(gulp.dest('./app/assets/images'));
}

// Deploy
function deploy () {
  return gulp.src('./app/**/*')
    .pipe(ghPages());
}

// Watch files
function watchFiles() {
  gulp.watch(paths.images, image);
  gulp.watch(
    [
      "./src/assets/stylesheets/**/*",
      "./src/partials/**/*.scss"
    ],
    gulp.series(css, browserSyncReload)
  );
  gulp.watch(["./src/js/**/*", "./src/partials/**/*.js"], gulp.series(scriptsLint, scripts));
  gulp.watch(
    [
      //"./_includes/**/*",
      //"./_layouts/**/*",
      //"./_pages/**/*",
      //"./_posts/**/*",
      "./src/*.haml",
      "./src/partials/**/*.haml"
    ],
    gulp.series(partials, html, browserSyncReload)
  );
  //gulp.watch("./assets/img/**/*", images);
}

// define complex tasks

//const build = gulp.series(clean, gulp.parallel(css, images, jekyll, js));
const js = gulp.series(scriptsLint, scripts);
const build = gulp.series(clean, partials, gulp.parallel(html, css, copy, js));
const watch = gulp.parallel(watchFiles, browserSync);

// export tasks
//exports.images = images;
exports.partials =    partials;
exports.html =        html;
exports.image =       image;
exports.css =         css;
exports.js =          js;
exports.clean =       clean;
exports.concat =      concat;
exports.copy =        copy;
exports.build =       build;
exports.watch =       watch;
exports.deploy =      deploy;
exports.default =     build;
