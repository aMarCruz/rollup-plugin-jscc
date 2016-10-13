[![Build Status][build-image]][build-url]
[![AppVeyor Status][wbuild-image]][wbuild-url]
[![npm Version][npm-image]][npm-url]
[![License][license-image]][license-url]

# rollup-plugin-jscc

Conditional compilation (and declaration of ES6 imports) for [rollup](http://rollupjs.org/)

Featuring some of the C preprocessor characteristics through special, configurable comments, jscc can be used in any type of files to build multiple versions of your software from the same code base.

With jscc, you have:

* Conditional inclusion/exclusion of code, based on compile-time variables*
* Compile-time variables with all the power of JavaScript expressions
* Replacement of variables inside the source (by value at compile-time)
* Source Map support

\* This feature allows you the conditional declaration of ES6 imports (See the [example](#example)).

Because this plugin is a preprocessor, it is implemented as a file loader.

jscc is **not** a minifier tool, it only does well that it does...

jscc is derived on [jspreproc](http://amarcruz.github.io/jspreproc), the tiny source file preprocessor in JavaScript, enhanced with Source Map support but without the file importer (rollup does this better).

**NOTE:**

v0.2.0 is a complete rewrite and there's breaking changes, please read the specs in [the wiki](https://github.com/aMarCruz/jscc/wiki).
Also, removal of comments is not included, but you can use [rollup-plugin-cleanup](https://github.com/aMarCruz/rollup-plugin-cleanup), which brings compaction and normalization of lines, in addition to the conditional removal of JS comments.

## Install

```sh
npm i rollup-plugin-jscc -D
```

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

## Example

```js
//#set _DEBUG 1

/*#if _DEBUG
import mylib from 'mylib-debug';
//#else */
import mylib from 'mylib';
//#endif

mylib.log('Starting v$_VERSION...');
```

output:

```js
import mylib from 'mylib-debug';

mylib.log('Starting v1.0.0...');
```

That's it.

\* From v0.2.1, jscc has the predefined `_VERSION` varname, in addition to `_FILE`.

## Documentation

You can read in the jscc Wiki about:

- [Options](https://github.com/aMarCruz/jscc/wiki/Options)
- [Syntax](https://github.com/aMarCruz/jscc/wiki/Syntax)
- [Keywords](https://github.com/aMarCruz/jscc/wiki/Keywords)
- [Examples & Tricks](https://github.com/aMarCruz/jscc/wiki/Examples)


## What's New

- The staring sequence of HTML comments (`'<!--'`) is included in the predefined prefixes.

From v0.2.2, the jscc codebase was moved to its own [github repository](https://github.com/aMarCruz/jscc) and has 100% coverage.
Test for node v0.12 is not included in this plugin, but it is in the jscc repo.

---

\* _For me, write in english is 10x harder than coding JS, so contributions are welcome..._


Don't forget to give me your star!


[build-image]:    https://img.shields.io/travis/aMarCruz/rollup-plugin-jscc.svg
[build-url]:      https://travis-ci.org/aMarCruz/rollup-plugin-jscc
[wbuild-image]:   https://img.shields.io/appveyor/ci/aMarCruz/rollup-plugin-jscc/master.svg?style=flat-square
[wbuild-url]:     https://ci.appveyor.com/project/aMarCruz/rollup-plugin-jscc/branch/master
[npm-image]:      https://img.shields.io/npm/v/rollup-plugin-jscc.svg
[npm-url]:        https://www.npmjs.com/package/rollup-plugin-jscc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/rollup-plugin-jscc/blob/master/LICENSE
