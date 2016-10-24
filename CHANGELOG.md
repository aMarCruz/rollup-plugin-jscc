# rollup-plugin-jscc changes

### v0.3.3 - fix in jscc
- Using jscc v0.3.3 that fixes bug in sourceMap generation.

### v0.3.2 - sync with jscc
- From this release, the version number will be in sync with jscc.
- Updated `devDependencies`.

### v0.2.2 - jscc own repo
- The staring sequence of HTML comments (`'<!--'`) is included in the predefined prefixes.
- jscc was moved to its own [github repository](https://github.com/aMarCruz/jscc) and has 100% coverage.

### v0.2.1 - fixing issues
- New predefined `_VERSION` varname contains `version` from the `package.json` file in the current working dir or some level up.
- Fix the test of predefined `_FILE` varname.
- Fix an issue with the space between keywords and expressions allowing line endings.

### v0.2.0 - getting better
- It is a complete rewrite, ready for inclussion in the rollup wiki.
- Fix issues with bublé inclussion and regexes.js in Windows.

### v0.1.3 - refactorization
- More simple, less options, more tests.

### v0.1.2 - html
- This is the last version with removal of regular comments, please use rollup-plugin-cleanup for this.
- Removes direct dependency on regexes (this will be a module in npm).
- Fix regex for matching literal regexes skipping html tags.
- Fix html test by removing `new Date()`.

### v0.1.1 - Fixes
Some fixes and support for html comments.

### v0.1.0 - sep/2016
First public release
