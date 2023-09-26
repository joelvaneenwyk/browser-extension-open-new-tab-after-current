const gulp = require('gulp');
const { src, dest, series } = gulp;
const deleteAsync = require('del');
const zip = require('gulp-zip');

const extensionName = 'Open-New-Tab-After-Current-Tab';

async function clean() {
  await deleteAsync(['build']);
  await Promise.resolve();
}

function build() {
  return src('src/**')
    .pipe(dest('build'));
}

function dist() {
  const manifest = require('./src/manifest.json');
  const distFileName = extensionName + '_v' + manifest.version + '.zip';
  return src('build/**')
    .pipe(zip(distFileName))
    .pipe(dest('dist'));
}

exports.clean = clean;
exports.build = series(clean, build);
exports.dist = series(clean, build, dist);
exports.default = series(clean, build, dist);
