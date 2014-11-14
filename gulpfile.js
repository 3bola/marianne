'use strict';

var gulp       = require('gulp')
  , plumber    = require('gulp-plumber')
  , sass       = require('gulp-sass')
  , prefix     = require('gulp-autoprefixer')
  , livereload = require('gulp-livereload')
  , handlebars = require('gulp-handlebars')
  , wrap       = require('gulp-wrap')
  , declare    = require('gulp-declare')
  , concat     = require('gulp-concat')
  , coffee     = require('gulp-coffee')
  , sourcemaps = require('gulp-sourcemaps')
  , express    = require('express')
  , path       = require('path')

// Configuration
// -------------

var Config = {

  port: 8080,
  livereload_port: 35729,

  images: {
    optimize: true,
    optimizationLevel: 3,
    progressive: true,
    interlaced: true
  },

  styles: {
    preprocessor: 'sass',
    sass: {
      errorLogToConsole: true
    },
    prefix: ['last 2 version', '> 5%', 'safari 5', 'ie 8', 'ie 7', 'opera 12.1', 'ios 6', 'android 4']
  },

  scripts: {
    preprocessor: 'coffee',
    sourcemap: true
  },

  templates: {
    namespace: 'templates',
    noRedeclare: true
  },

  paths: {
    source:  './app',
    build:   './dist',
    folders: {
      lib:    '/lib',
      js:     '/js',
      coffee: '/coffee',
      tmpl:   '/tmpl',
      scss:   '/scss',
      css:    '/css',
      img:    '/img',
      fonts:  '/fonts'
    }
  }
  
}

// Utilities
// ---------

function dir(root, folder) {
  if(!folder) {
    return Config.paths[root];
  }
  return Config.paths[root] + Config.paths.folders[folder];
}

// Tasks
// -----

gulp.task('server', function() {
  return express()
    .use(express.static(path.resolve(dir('source'))))
    .listen(Config.port);
});

gulp.task('livereload', function() {
  return livereload.listen(Config.livereload_port, function(err) {
    if(err) console.error(err);
  });
});

gulp.task('scripts', function() {
  switch(Config.scripts.preprocessor) {
    case 'coffeescript':
    case 'coffee':
      return gulp.src(dir('source', 'coffee') + '/**/*.coffee')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(coffee({ bare: true }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dir('source', 'js')));
      break;
    default:
      return true;
      break;
  }
});

gulp.task('templates', function() {
  return gulp.src(dir('source', 'tmpl') + '/*.hbs')
    .pipe(plumber())
    .pipe(handlebars())
    .pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare(Config.templates))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest(dir('source', 'js')));
});

gulp.task('styles', function() {
  switch(Config.styles.preprocessor) {
    case 'sass':
      return gulp.src(dir('source', 'scss') + '/index.scss')
        .pipe(plumber())
        .pipe(sass(Config.styles.sass))
        .pipe(prefix.apply(Config.styles.prefix))
        .pipe(gulp.dest(dir('source', 'css')));
      break;
    default:
      return true;
      break;
  }
});

gulp.task('watch', function() {
  gulp.watch(dir('source', 'coffee') + '/**', ['scripts']);
  gulp.watch(dir('source', 'tmpl') + '/**', ['templates']);
  gulp.watch(dir('source', 'scss') + '/**', ['styles']);

  // Call livereload
  gulp.watch([
    dir('source', 'img') + '/**',
    dir('source', 'css') + '/**',
    dir('source', 'js') + '/**',
    dir('source') + '/*.html',
  ], function(event) {
    livereload.changed(event.path);
  })
});

gulp.task('default', ['server', 'livereload', 'scripts', 'templates', 'styles', 'watch']);