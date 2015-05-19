var through = require('through2');
var gutil = require('gulp-util');
var File = require('vinyl');
var stockBrowserify = require('browserify');
var multimatch = require('multimatch');

function everyFileFunction(instance, outputFile) {
	return function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-asset-broserify', 'Streaming not supported'));
			return;
		}

		if (multimatch(file.path, instance._filter)) {
			if (instance._files[outputFile] === undefined) {
				instance._files[outputFile] = [];
			}
			file.originalBase = file.base;
			instance._files[outputFile].push(file);
		}

		cb();
	};
};

function flushFunction(instance, outputFile) {
	return function (doneFlush) {
		var out = this;
		var myFiles = instance._files[outputFile];
		if (myFiles.length > 0) {
			instance._browserify(myFiles, {basedir: myFiles[0].originalBase})
					.bundle(function (err, result) {
						if (err) {
							doneFlush(err);
						} else {
							// push result into out
							var f = new File({
								path: outputFile,
								contents: result
							});
							out.push(f);
							delete myFiles;
							doneFlush();
						}
					});
		} else {
			doneFlush();
		}
	};
};

var AssetBrowserifier = function (browserify, nameFilter) {
	this._filter = nameFilter || ["*.js"];
	this._browserify = browserify || stockBrowserify;
	this._files = {};
	var instance = this;
	this.stream = function (outputFile) {
		return through.obj(
			everyFileFunction(instance, outputFile),
			flushFunction(instance, outputFile)
			);
		};
	};

module.exports = AssetBrowserifier;