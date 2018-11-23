# rollup-plugin-jscc changes

## \[1.0.0] - 2018-11-23

## Added

- Added TypeScript v3 definitions.

## Changed

- Only CommonJS version with dependency on jscc v1.1.0
- The minimum supported version of node.js is 6
- The predefined extensions were extended to include those of React and TypeScript.
- `RegEx` and` Date` values now outputs its literal content in replacements.
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
