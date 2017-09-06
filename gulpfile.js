var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
// 串行执行任务
var gulpSequence = require('gulp-sequence');
var eslint = require('gulp-eslint');
// 头部注释
var header = require('gulp-header');
var pkg = require('./package.json');
var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @author <%= pkg.author %>',
    ' * <%= pkg.homepage %>',
    ' */',
    ''
].join('\n');

// 暂且将debug和release放在一起
var debugPath = './dist/debug/';
var releasePath = './dist/';

// eslint代码检查，方便调试
gulp.task('eslint_js', function() {
    return gulp.src(['./src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format());
        // 开启后如果报错会退出
        //.pipe(eslint.failAfterError());
});

// 核心文件的打包
gulp.task('pack_bizlogic_js', function() {
    return gulp.src(['./src/minirefresh.dataprocess.js',
        './src/minirefresh.dataprocess.v6path.js', './src/minirefresh.dataprocess.v7path.js',
        './src/minirefresh.bizlogic.js'])
        .pipe(concat('minirefresh.bizlogic.js'))
        .pipe(gulp.dest(debugPath));
});

// 压缩发布的源文件
gulp.task('js_uglify', function() {
    return gulp.src([debugPath + '**/*.js', '!' + debugPath + '**/*.min.js'])
        .pipe(uglify())
        // 压缩时进行异常捕获
        .on('error', function(err) {
            console.log('line number: %d, message: %s', err.lineNumber, err.message);
            this.end();
        })
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(header(banner, {
            pkg: pkg
        }))
        .pipe(gulp.dest(releasePath));
});

gulp.task('lint', ['eslint_js']);

gulp.task('pack_debug', ['pack_bizlogic_js']);

gulp.task('pack_release', ['js_uglify']);

gulp.task('default', function(callback) {
    gulpSequence('lint', 'pack_debug', 'pack_release')(callback);
});

// 看守
gulp.task('watch', function() {

    // 看守所有位在 dist/  目录下的档案，一旦有更动，便进行重整
    //  gulp.watch([config.src+'/gulpWatch.json']).on('change', function(file) {
    //      console.log("改动");
    //  });
    gulp.watch('./src/**/*', ['default']);

});