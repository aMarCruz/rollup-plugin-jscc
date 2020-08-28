/**
 * rollup-plugin-jscc v2.0.0
 * @license MIT
 */
/* eslint-disable */
'use strict';

const rollupPluginutils = require('rollup-pluginutils');
const path = require('path');
const getPackageVersion = require('@jsbits/get-package-version');
const fs = require('fs');
const jscc = require('jscc');

/**
 * Creates a filter for the options `include`, `exclude`, and `extensions`.
 *
 * Since `extensions` is not a rollup option, I think is widely used.
 *
 * @param {import('..').Options} opts The user options
 * @param {string|string[]} exts Default extensions
 * @returns {function} Filter function that returns true if a given file
 *    matches the filter.
 */
const makeFilter = (opts, exts) => {
  const _filt = rollupPluginutils.createFilter(opts.include, opts.exclude);

  exts = opts.extensions || exts;
  if (!exts || exts === '*') {
    return _filt // do not filter extensions
  }

  if (!Array.isArray(exts)) {
    exts = [exts];
  }
  exts = exts.map(e => (e[0] !== '.' ? `.${e}` : e));

  return id => _filt(id) && exts.includes(path.extname(id))
};

/**
 * @param {import('..').Options} options -
 * @returns {import('jscc').Options}
 */
const parseOptions = options => {
  options = Object.assign(
    {
      prefixes: [/\/[/*] ?/, /<!-- ?/],
    },
    options
  );

  options.values = Object.assign(
    {
      _VERSION: getPackageVersion(),
    },
    options.values
  );

  options.sourceMap = options.sourcemap !== false && options.sourceMap !== false;

  return options
};

/**
 * Returns a shallow copy of the jscc options.
 *
 * @param {jscc.Options} opts
 * @returns {jscc.Options}
 */
const _getJsccOpts = opts => ({
  escapeQuotes: opts.escapeQuotes,
  keepLines: opts.keepLines,
  mapHires: opts.mapHires,
  prefixes: opts.prefixes,
  sourceMap: opts.sourceMap,
  mapContent: opts.mapContent !== false,
  values: Object.assign({}, opts.values),
});

/**
 * Simple wrapper for the async `fs.readFile` that returns a Promise that
 * resolves to a string with the content decoded as utf8.
 *
 * @param {string} fname Absolute or relative to cwd
 * @returns {Promise<string>}
 */
const _getSource = fname =>
  new Promise((resolve, reject) => {
    fs.readFile(fname, 'utf8', (error, data) => {
      // istanbul ignore if
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });

/**
 * Call jscc and returns a Promise that is resolved with a {code,map} object
 * or a string if the buffer did not change or `options.sourceMap:false`.
 *
 * @param {string} fname Absolute or relative to cwd
 * @param {jscc.Options} options jscc options
 * @param {string} [code] Source
 * @returns {Promise<string>}
 */
const procFile = (fname, options, code) => {
  // Supports transform
  const promise = code != null ? Promise.resolve(code) : _getSource(fname);

  return promise
    .then(source => {
      // Supports buffer
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(source)) {
        source = source.toString();
      }
      // Ignore non-string sources
      return typeof source === 'string'
        ? jscc(source, fname, _getJsccOpts(options))
        : source
    })
    .then(ret => {
      /*
        change the relative source path in the source map to the input file path
        explanation:
          rollup will resolve source path through the file's directory absolute path
          and the source path in the returned source map by the plugin

            new Source(resolve(dirname(module.id), originalSourcemap.sourceRoot || '.', source), sourcesContent[i])

          @see https://github.com/rollup/rollup/blob/v1.15.6/src/utils/collapseSourcemaps.ts#L196
      */
      if (ret.map) {
        ret.map.sources[0] = fname;
      }
      return ret
    })
};

const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.tag'];

/**
 * rollup-plugin-jscc entry point
 *
 * @param {import('..').Options} options User options
 * @returns {import('rollup').Plugin}
 */
function jsccPlugin (options) {
  // Get the jscc options from the plugin options
  options = parseOptions(options);

  const filter = makeFilter(options, DEFAULT_EXTENSIONS);

  if (options.asloader !== false) {
    return {
      name: 'jscc',
      load: id => (filter(id) ? procFile(id, options) : null),
    }
  }

  return {
    name: 'jscc',
    transform: (code, id) => (filter(id) ? procFile(id, options, code) : null),
  }
}

module.exports = jsccPlugin;
//# sourceMappingURL=index.js.map
