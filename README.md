# rollup-plugin-jscc

<!-- prettier-ignore-start -->
[![npm Version][npm-badge]][npm-url]
[![Build Status][build-badge]][build-url]
[![AppVeyor Status][wbuild-badge]][wbuild-url]
[![Maintainability][climate-badge]][climate-url]
[![Test coverage][codecov-badge]][codecov-url]
[![License][license-badge]][license-url]
<!-- prettier-ignore-end -->

Conditional compilation and compile-time variable replacement for [Rollup](http://rollupjs.org/).

rollup-plugin-jscc is **not** a transpiler, it is a wrapper of [jscc](https://github.com/aMarCruz/jscc), a tiny and powerful, language agnostic file preprocessor that uses JavaScript to transform text based on expressions at compile time.

With jscc, you have:

- Conditional inclusion/exclusion of blocks, based on compile-time variables\*
- Compile-time variables with all the power of JavaScript expressions
- Replacement of variables in the sources, by its value _at compile-time_
- Sourcemap support, useful for JavaScript sources.
- TypeScript v3 definitions

\* This feature allows you the conditional declaration of ES6 imports (See the [example](#example)).

Since jscc is a preprocessor, rollup-plugin-jscc is implemented as a _file loader_, so it runs before any transpiler and is invisible to them. This behavior allows you to use it in a wide range of file types but, if necessary, it can be used as a Rollup _transformer_ instead of a loader.

_**NOTE**_

The removal of non-jscc comments is not included, but you can use [rollup-plugin-cleanup](https://github.com/aMarCruz/rollup-plugin-cleanup), which brings compaction and normalization of lines in addition to the conditional removal of JS comments.

## Support my Work

I'm a full-stack developer with more than 20 year of experience and I try to share most of my work for free and help others, but this takes a significant amount of time, effort and coffee so, if you like my work, please consider...

[<img src="https://amarcruz.github.io/images/kofi_blue.png" height="36" title="Support Me on Ko-fi" />][kofi-url]

Of course, feedback, PRs, and stars are also welcome 🙃

Thanks for your support!

## Install

```bash
npm i rollup-plugin-jscc -D
# or
yarn add rollup-plugin-jscc -D
```

rollup-plugin-jscc requires rollup v2.0 and node.js v10.12 or later.

### Usage

rollup.config.js

```js
import { rollup } from 'rollup'
import jscc from 'rollup-plugin-jscc'

export default {
  input: 'src/main.js',
  plugins: [
    jscc({
      values: { _APPNAME: 'My App', _DEBUG: 1 },
    }),
  ],
  //...other options
}
```

in your source:

```js
/*#if _DEBUG
import mylib from 'mylib-debug';
//#else */
import mylib from 'mylib'
//#endif

mylib.log('Starting $_APPNAME v$_VERSION...')
```

output:

```js
import mylib from 'mylib-debug'

mylib.log('Starting My App v1.0.0...')
```

That's it.

\* jscc has two predefined memvars: `_FILE` and `_VERSION`, in addition to giving access to the environment variables through the nodejs [`proccess.env`](https://nodejs.org/api/process.html#process_process_env) object.

## Options

Plain JavaScript object, with all properties optional.

| Name | Type | Description |
| --- | --- | --- |
| asloader | boolean | If `false`, run the plugin as a `transformer`, otherwise run as `loader` (the default). |
| escapeQuotes | string | String with the type of quotes to escape in the output of strings: 'single', 'double' or 'both'.<br>**Default** nothing. |
| keepLines | boolean | Preserves the empty lines of directives and blocks that were removed.<br>Use this option with `sourceMap:false` if you are interested only in keeping the line numbering.<br>**Default** `false` |
| mapHires | boolean | Make a hi-res source-map, if `sourceMap:true` (the default).<br>**Default** `true` |
| prefixes | string &vert; RegExp &vert;<br>Array&lt;string&vert;RegExp&gt; | The start of a directive. That is the characters before the '#', usually the start of comments.<br>**Default** `['//', '/*', '<!--']` (with one optional space after them). |
| sourcemap | boolean | Must include a sourcemap?<br>Should be the same value as the property `sourcemap` of the Rollup output.<br>**Default** `true` |
| mapContent | boolean | Include the original source in the sourcemap, if `sourceMap:true` (the default).<br>**Default** `true` |
| values | object | Plain object defining the variables used by jscc during the preprocessing.<br>**Default** `{}` |
| extensions | string &vert; Array&lt;string&gt; | Array of strings that specifies the file extensions to process.<br>**Default** `['js', 'jsx', 'ts', 'tsx', 'mjs', 'tag']` |
| include | string &vert; Array&lt;string&gt; | [minimatch](https://github.com/isaacs/minimatch) or array of minimatch patterns for paths that must be included in the processing. |
| exclude | string &vert; Array&lt;string&gt; | [minimatch](https://github.com/isaacs/minimatch) or array of minimatch patterns for paths that should be ignored. |

## Directives

Please see the [jscc wiki](https://github.com/aMarCruz/jscc/wiki) to know about directives used by jscc.

## What's New

Please see the [CHANGELOG](CHANGELOG.md).

## License

The [MIT License](LICENSE)

[npm-badge]: https://img.shields.io/npm/v/rollup-plugin-jscc.svg
[npm-url]: https://www.npmjs.com/package/rollup-plugin-jscc
[build-badge]: https://img.shields.io/travis/aMarCruz/rollup-plugin-jscc.svg
[build-url]: https://travis-ci.org/aMarCruz/rollup-plugin-jscc
[wbuild-badge]: https://img.shields.io/appveyor/ci/aMarCruz/rollup-plugin-jscc/master.svg?style=flat-square
[wbuild-url]: https://ci.appveyor.com/project/aMarCruz/rollup-plugin-jscc/branch/master
[climate-badge]: https://api.codeclimate.com/v1/badges/896211f2169f2c1dcd62/maintainability
[climate-url]: https://codeclimate.com/github/aMarCruz/rollup-plugin-jscc/maintainability
[codecov-badge]: https://codecov.io/gh/aMarCruz/rollup-plugin-jscc/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/aMarCruz/rollup-plugin-jscc
[license-badge]: https://img.shields.io/npm/l/express.svg
[license-url]: https://github.com/aMarCruz/rollup-plugin-jscc/blob/master/LICENSE
[kofi-url]: https://ko-fi.com/C0C7LF7I
