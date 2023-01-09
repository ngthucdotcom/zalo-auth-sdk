const gulp = require('gulp');
const browserSync = require('browser-sync');
const runSequence = require('gulp4-run-sequence');

// Basic Gulp task syntax
gulp.task('start', function (done) {
	console.log('Starting pipeline!');
	done();
});

// Development Tasks
// -----------------

gulp.task('watch', function () {
	browserSync({
		server: {
			baseDir: './'
		}
	});


});

// Start browserSync server
gulp.task('serve', function () {
	browserSync({
		server: {
			baseDir: './'
		}
	});

	gulp.watch('./**/*.html').on('change', browserSync.reload);
	gulp.watch('./**/*.js').on('change', browserSync.reload);
});

gulp.task('default', function(callback) {
	runSequence(['serve'], callback)
});