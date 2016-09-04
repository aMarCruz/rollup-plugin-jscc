[![Build Status][build-image]][build-url]
[![npm Version][npm-image]][npm-url]
[![License][license-image]][license-url]

# rollup-plugin-jscc

Conditional comments and code cleanup for [rollup](http://rollupjs.org/)

This plugin is derived on [jspreproc](http://amarcruz.github.io/jspreproc), the tiny source file preprocessor in JavaScript, enhanced with Source Maps support but without the file importer (rollup does this better).

Featuring some of the C preprocessor characteristics through JavaScript comments, jscc can be used in any source with a JavaScript-like syntax to build multiple version from one code base.

With jscc, you can go from this:

* Conditional exclusion of code based on variables and expressions
* Replacement of variables inside the source code (optional)
* Remotion of comments by powerfull filters (optional, configurable)
* Empty lines compactation (optional, configurable)
* Remotion of trailing spaces
* Normalization of line endings (to Unix)
* Source Maps support

**Why not with Uglify?**

Why with Uglify?

## Install

```sh
npm install rollup-plugin-jscc --save-dev
```

jscc works in node.js v4 or above (there's a node v0.12 compatible version in the `dist/legacy` folder).

## Usage

```js
import { rollup } from 'rollup';
import jscc from 'rollup-plugin-jscc';

rollup({
  entry: 'src/main.js',
  plugins: [
    jscc()
  ]
}).then(...)
```

That's it.

Currently, jscc is a file loader of rollup as the `load` method is where all the work is done.
By default, only the .js files are processed. You can restrict which files are processed using the `include` and `exclude` options.

Please read about the options and the syntax in the wiki.

_For me, write in english is 10x harder than coding JS, so contributions are welcome..._

**Note:**

jspreproc is a mature, proven tool, but does not handles ES6 strings, so this is an area that needs testing for production (this plugin was developed to replace jspreproc in the construction of new versions [riot](https://riotjs.com), along with rollup and bablé).

## TODO

This is work in progress, so please update jscc constantly, I hope the first stable version does not take too long.

Expected features in future versions:

- [ ] 100% test coverage and more and better tests
- [ ] Explanatory error messages, with location of the error
- [ ] Configuration from the file system
- [ ] jscc own repository (independent version, usable by other tools)
- [ ] async mode
- [ ] Better documentation
- [ ] Syntax hilighter for some editores
- [ ] You tell me...

---

[build-image]:    https://img.shields.io/travis/aMarCruz/rollup-plugin-jscc.svg
[build-url]:      https://travis-ci.org/aMarCruz/rollup-plugin-jscc
[npm-image]:      https://img.shields.io/npm/v/rollup-plugin-jscc.svg
[npm-url]:        https://www.npmjs.com/package/rollup-plugin-jscc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/rollup-plugin-jscc/blob/master/LICENSE
