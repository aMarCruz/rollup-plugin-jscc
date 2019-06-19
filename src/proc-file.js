import fs from 'fs'
import jscc from 'jscc'

/**
 * Returns a shallow copy of the jscc options.
 *
 * @param {jscc.Options} opts
 * @returns {jscc.Options}
 */
const _getJsccOpts = (opts) => ({
  escapeQuotes: opts.escapeQuotes,
  keepLines: opts.keepLines,
  mapHires: opts.mapHires,
  prefixes: opts.prefixes,
  sourceMap: opts.sourceMap,
  mapContent: opts.mapContent,
  values: Object.assign({}, opts.values),
})

/**
 * Simple wrapper for the async `fs.readFile` that returns a Promise that
 * resolves to a string with the content decoded as utf8.
 *
 * @param {string} fname Absolute or relative to cwd
 * @returns {Promise<string>}
 */
const _getSource = (fname) => new Promise((resolve, reject) => {
  fs.readFile(fname, 'utf8', (error, data) => {
    // istanbul ignore if
    if (error) {
      reject(error)
    } else {
      resolve(data)
    }
  })
})

/**
 * Call jscc and returns a Promise that is resolved with a {code,map} object
 * or a string if the buffer did not change or `options.sourceMap:false`.
 *
 * @param {string} fname Absolute or relative to cwd
 * @param {jscc.Options} options jscc options
 * @param {string} [code] Source
 * @returns {Promise<string>}
 */
const procFile = function (fname, options, code) {
  // Supports transform
  const promise = code != null ? Promise.resolve(code) : _getSource(fname)

  return promise
    .then((source) => {
      // Supports buffer
      if (typeof Buffer !== 'undefined' && Buffer.isBuffer(source)) {
        source = source.toString()
      }
      // Ignore non-string sources
      return typeof source === 'string'
      ? jscc(source, fname, _getJsccOpts(options))
      : source
    }).then(ret =>{
      if(ret.map) {
        ret.map.sources[0] = fname    
      }
      return ret
    })
}

export default procFile
