[![Build Status][build-image]][build-url]
[![AppVeyor Status][wbuild-image]][wbuild-url]
[![npm Version][npm-image]][npm-url]
[![License][license-image]][license-url]

# rollup-plugin-jscc

JavaScript preprocessor for [rollup](http://rollupjs.org/)

Featuring some of the C preprocessor characteristics through special JavaScript comments, jscc can be used in sources with a JavaScript-like syntax to build multiple versions of your software from the same code base.

With jscc, you have:

* Conditional exclusion of code, based on variables and JavaScript expressions
* Replacement of variables inside the source (by value at compile-time)
* Source Map support

This plugin is derived on [jspreproc](http://amarcruz.github.io/jspreproc), the tiny source file preprocessor in JavaScript, enhanced with Source Maps support but without the file importer (rollup does this better).

jscc is **not** a minifier nor a beautifier tool, but you can use [rollup-plugin-cleanup](https://github.com/aMarCruz/rollup-plugin-cleanup) to remove comments and empty lines.

## Install

```sh
npm install rollup-plugin-jscc --save-dev
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

That's it.

Because jscc is a preprocessor, it was implemented as a file loader.

By default, only the .js files are processed, but it can be useful in other sources, like html.
You can restrict or expand this using the `rollup` global options "include" and "exclude", or the "extensions" option (see below).

Please read about the syntax and options in [the wiki](https://github.com/aMarCruz/rollup-plugin-jscc/wiki).

**Note:**

jspreproc is a mature, proven tool, but does not handles ES6 strings, so this is an area that needs testing before to use in production (this plugin was developed to replace jspreproc in the construction of new versions [riot](https://riotjs.com), along with rollup and bablé).

## Known Issues

Regexes starting with `//` or `/>` breaks the parsing. Please follow the best-practices and use `/\/` and `/\>`.

## TODO

This is work in progress, so please update jscc constantly, I hope the first stable version does not take too long.

Expected features in future versions:

- [ ] 100% test coverage and more tests
- [ ] Explanatory error messages, with location of the error
- [ ] Configuration from the file system
- [ ] jscc own repository (independent version, usable by other tools)
- [ ] async mode
- [ ] Better documentation*
- [ ] Syntax hilighter for some editores
- [ ] You tell me...

---

\* _For me, write in english is 10x harder than coding JS, so contributions are welcome..._

[build-image]:    https://img.shields.io/travis/aMarCruz/rollup-plugin-jscc.svg
[build-url]:      https://travis-ci.org/aMarCruz/rollup-plugin-jscc
[wbuild-image]:   https://img.shields.io/appveyor/ci/aMarCruz/rollup-plugin-jscc/master.svg?style=flat-square
[wbuild-url]:     https://ci.appveyor.com/project/aMarCruz/rollup-plugin-jscc/branch/master
[npm-image]:      https://img.shields.io/npm/v/rollup-plugin-jscc.svg
[npm-url]:        https://www.npmjs.com/package/rollup-plugin-jscc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/rollup-plugin-jscc/blob/master/LICENSE
