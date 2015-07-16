var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var path = require('path');
var http = require('http');
var st = require('st');

/******************* Jade to html ***********/
function getLocals() {
  var resumeData = require('./resume.json');
  var locals = require('./i18n/' +
                       resumeData.data_lang + '/dict.js');
  for (var item in resumeData) {
    locals[item] = resumeData[item];
  }

  locals.highlight = function highlight(str) {
    return str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<strong>$1</strong>');
  }

  return locals;
}

gulp.task('jade', function() {
  return gulp.src('./src/jade/index.jade')
    .pipe(plugins.debug())
    .pipe(plugins.jade({
      locals: getLocals()
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(plugins.livereload());
});

/************* less to css  ********************/
var lessPath = [path.join(__dirname, 'src', 'less', 'includes'),
                path.join(__dirname, 'src', 'less', 'components')];

function less2css(srcPath, destPath, debug) {
  if(!debug) {
    return gulp.src(srcPath)
      .pipe(plugins.less({ paths: lessPath }))
      .pipe(plugins.debug())
      .pipe(plugins.minifyCss({ compatibility: 'ie9' }))
      .pipe(gulp.dest(destPath));
  } else {
    return gulp.src(srcPath)
      .pipe(plugins.debug())
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.less({ paths: lessPath }))
      .pipe(plugins.sourcemaps.write())
      .pipe(gulp.dest(destPath))
      .pipe(plugins.livereload());
  }
}

gulp.task('less', function() {
  less2css('./src/less/index.less', './dist/');
});

gulp.task('less-debug', function() {
  less2css('./src/less/index.less', './dist/', true);
});

/************** Static assets **************/
gulp.task('static', function() {
  return gulp.src('./static/**/*', { base: 'static' })
    .pipe(plugins.changed('./dist/static/'))
    .pipe(plugins.debug())
    .pipe(gulp.dest('./dist/static/'))
    .pipe(plugins.livereload());
});

/****************** Watch ****************/
gulp.task('watch', ['server'], function() {
  plugins.livereload.listen({ basePath: 'dist' });
  gulp.watch(['./src/**/*.jade', './resume.json',
              './i18n/**/*.js'], ['jade']);
  gulp.watch('./src/**/*.less', ['less']);
});

/****************** Build ****************/
gulp.task('build', ['jade', 'less-debug', 'static']);
gulp.task('build-for-deploy', ['jade', 'less', 'static']);

/****************** Server ****************/
function server(done) {
  http.createServer(
    st({
      path: __dirname + '/dist',
      index: 'index.html',
      cache: false
    })
  ).listen(8000, done);
  console.log("preview listening on http://localhost:8000");
}

gulp.task('server', ['build'], server);
gulp.task('preview', ['build-for-deploy'], server);

/****************** Deploy ****************/
gulp.task('deploy', ['build-for-deploy'], function() {
  return gulp.src('./dist/**/*')
    .pipe(plugins.ghPages());
});

/****************** Default ****************/
gulp.task('default', ['server', 'watch']);