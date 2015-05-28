var through = require('through2');
var gutil = require('gulp-util');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var stockBrowserify = require('browserify');
var multimatch = require('multimatch');
var defaults = require('defaults');
var merge = require('merge-stream');
var duplex = require('plexer');

function everyFileFunction(instance, outputFile) {
	// switchyard:
	//  - files that match options.filter go into a stream for their outputfile
	//  - others pass through unharmed.
	return function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			// only real files, please.
			cb(new gutil.PluginError('asset-browserifier', 'Streaming not supported'));
			return;
		}

		if (instance.shouldProcess(file.path)) {
			if (!instance._baseDirs[outputFile]) {
				// keep a record of the basedir for the first file of each output
				// not even sure if that's needed anymore.
				instance._baseDirs[outputFile] = file.base;
			}
			instance._files[outputFile].push(file);
		} else {
			//this.push(file, {end: false});
		}

		cb();
	};
};

var AssetBrowserifier = function (options) {
	this._options = defaults(options, {
		browserify: stockBrowserify,
		filter: ["*.js", "**/*.js"],
		bundlePipe: undefined
	});
	this._baseDirs = new Object();
	this._files = new Object();
	this._processed = new Object();
	this._outStream = through.obj();
	var instance = this;
	this.collect = function (outputFile) {
			// called from within gulp-useref, hence we need instance,
			// which is why this function is defined in the constructor.

			if (!instance.shouldProcess(outputFile)) {
				// no-op
				return through.obj();
			}

			// create a new stream for each outputFile:
			instance._files[outputFile] = through.obj();
			return through.obj(everyFileFunction(instance, outputFile),
			function /* flush */ (cb) {
				// when all assets were passed in, start the browserify pipe.
				instance.process(outputFile);
				// then, tell the pipe nothing more will happen.
				instance._files[outputFile].end();
				cb();
			}
			);
		};
};

AssetBrowserifier.prototype.process = function(outputFile) {
		var stream = this._files[outputFile];
		var finalOpts = defaults(this._options.browserifyOpts, {
			basedir: this._baseDirs[outputFile]
		});
		var b = this._options.browserify(finalOpts);
		var instance = this;

		// argh, browserify, y u no streamable!
		stream.pipe(through.obj(function(file,enc,cb) {
			// save file.path, else it will be called "_stream_X"
			b.add(file, {"file": file.path});
			cb();
		}, function (cb) {
			var bundleStream = b.bundle();
			var s = bundleStream.pipe(source(outputFile)).pipe(buffer());
			if (instance._options.bundlePipe !== undefined) {
				s = s.pipe(instance._options.bundlePipe());
			}
			s.pipe(instance._outStream, {end: false});
			s.on('end', function() {
				instance._processed[outputFile] = true;
				if (instance.allProcessed()) {
					process.nextTick(function() {
						instance._outStream.end();
					});
				}
			});
			cb();
		}));
	};

AssetBrowserifier.prototype.allProcessed = function() {
		for (var should in this._files) {
			if (!this._processed[should]) {
				return false;
			}
		}
		return true;
	};

AssetBrowserifier.prototype.shouldProcess = function(fileName) {
		var match = multimatch(fileName, this._options.filter);
		return match.length > 0;
	};

AssetBrowserifier.prototype.reInject = function() {
		// passthrough files from upstream, and add our results.
		var dummyStream = through.obj();
		return duplex({objectMode: true},
			// everything written to us gets buffered here:
			dummyStream,
			// and we promptly return it, with our results mixed in:
			merge(dummyStream, this._outStream)).on('end', function(){console.log("ended");});
	};

module.exports = AssetBrowserifier;
