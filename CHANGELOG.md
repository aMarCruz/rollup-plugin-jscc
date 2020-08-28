# rollup-plugin-jscc changes

## \[2.0.0] - 2020-08-28

### Added

- PrettierX + TypeScript for formating
- [markdownlint](https://www.npmjs.com/package/markdownlint) and [prettierx](https://github.com/brodybits/prettierx) config files
- VS Code settings for this project

### Changed

- Update dependencies (using rollup ^2.26) and adjust rollup config
- Update ESLint config, now PrettierX is used for code formating
- Update code format to comply with prettierx rules
- Require Rollup v2 & NodeJS v10 or above
- Update test (remove NodeJS v6, add v14)
- Update license

### Fixed

- PR #5: fix source map support - Thanks to @billowz
  - Upgrade rollup to 1.0.0
  - Added `mapContent` option
  - Added `sourcemap` test case
  - Fix source path in the sourcemap
- Fix #8: if entry point is named '.mjs' it does not works by @muayyad-alsadi

## \[1.0.0] - 2018-11-23

### Added

- Added TypeScript v3 definitions.
- Test and badges for [Code Climate](https://codeclimate.com) and [Codecov](https://codecov.io).

### Changed

- Only CommonJS version with dependency on jscc v1.1.0
- The minimum supported version of node.js is 6
- The predefined extensions were extended to include those of React and TypeScript.
- `RegEx` and `Date` values now outputs its literal content in replacements.
- Objects containing `NaN` now outputs `NaN` in replacements.
- `Infinite` and `-Infinity` in JSON objects are replaced with `Number.MAX_VALUE` and `Number.MIN_VALUE`, respectively.

## \[0.3.3] - fix in jscc

- Using jscc v0.3.3 that fixes bug in sourceMap generation.

## \[0.3.2] - sync with jscc

- From this release, the version number will be in sync with jscc.
- Updated `devDependencies`.

## \[0.2.2] - jscc own repo

- The staring sequence of HTML comments (`'<!--'`) is included in the predefined prefixes.
- jscc was moved to its own [github repository](https://github.com/aMarCruz/jscc) and has 100% coverage.

## \[0.2.1] - fixing issues

- New predefined `_VERSION` varname contains `version` from the `package.json` file in the current working dir or some level up.
- Fix the test of predefined `_FILE` varname.
- Fix an issue with the space between keywords and expressions allowing line endings.

## \[0.2.0] - getting better

- It is a complete rewrite, ready for inclussion in the rollup wiki.
- Fix issues with bublé inclussion and regexes.js in Windows.

## \[0.1.3] - refactorization

- More simple, less options, more tests.

## \[0.1.2] - html

- This is the last version with removal of regular comments, please use rollup-plugin-cleanup for this.
- Removes direct dependency on regexes (this will be a module in npm).
- Fix regex for matching literal regexes skipping html tags.
- Fix html test by removing `new Date()`.

## \[0.1.1] - Fixes

Some fixes and support for html comments.

## \[0.1.0] - 2016-09-01

First public release
