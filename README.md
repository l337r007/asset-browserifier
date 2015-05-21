# asset-browserifier

[browserify](https://github.com/substack/node-browserify) references inside [gulp-useref](https://github.com/jonkemp/gulp-useref) pipelines.

## Install

Install with [npm](https://npmjs.org/)

```
npm install --save-dev l337r007/asset-browserifier
```

## Usage

The following example will parse the build blocks in the HTML, replace them and browserify `.js` files.

```js
var gulp = require('gulp'),
    useref = require('gulp-useref'),
    AssetBrowserify = require('asset-browserifier');

gulp.task('default', function () {
    var filter = new AssetBrowserify();
    var assets = useref.assets({}, filter.collect);
    
	return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(filter.reInject())
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});
```

## Requirements

Asset-Browserifier requires you to use [gulp-useref](https://github.com/jonkemp/gulp-useref) > 1.1.2; this is so the collect function has access to the output file names. This has only been integrated in [gulp-useref PR#108](https://github.com/jonkemp/gulp-useref/pull/108).
You can (until the 1.1.3 release of gulp-useref) achieve this by depending on the github instead of the npm release, i.e.:

```JSON
"devDependencies": {
    "gulp-useref": "git://github.com/jonkemp/gulp-useref"
}
```

## API

### new AssetBrowserify([options]);

#### options.browserify

Type: `function`
Default: `require('browserify')`

Override the Browserify constructor, e.g. to use [watchify](https://github.com/substack/watchify).

#### options.filter

Type: `Array`
Default: `["*.js", "**/*.js"]`

Files to consider for Browserfication. Since all gulp-useref assets pass through AssetBrowserifier, we need to filter which ones to actually consider. If you use other file extensions for your javascript files, specify them here.

#### options.bundlePipe

Type: `function`
Default: `undefined`

Specify a pipeline to be run on the browserified bundle file. For example using [lazypipe](https://github.com/OverZealous/lazypipe)

### collect()

returns a stream sorting files into substreams internal to AssetBrowserifier, for later passing into browserify.
Remember to pass this into gulp-useref's `assets` without calling it, since if will be called there. See the example.

### reInject()

returns a stream which merges the browserified bundles back into the processing pipeline.

## License

MIT © Wolfgang Herget, [DFKI GmbH](http://www.dfki.de)
