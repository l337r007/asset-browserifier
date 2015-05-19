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
    var assets = useref.assets({noconcat: true}, filter.stream);
    
	return gulp.src('app/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});
```

## License

MIT © Wolfgang Herget, [DFKI GmbH](http://www.dfki.de)
