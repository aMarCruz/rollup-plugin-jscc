
import { createFilter } from 'rollup-pluginutils'
import { extname } from 'path'

/**
 * Creates a filter for the options `include`, `exclude`, and `extensions`.
 * It filter out names starting with `\0`.
 * Since `extensions` is not a rollup option, I think is widely used.
 *
 * @param {object}       opts - The user options
 * @param {array|string} exts - Default extensions
 * @returns {function}   Filter function that returns true if a given
 *                       file matches the filter.
 */
export default function _createFilter (opts, exts) {
  if (!opts) opts = {}

  const filt = createFilter(opts.include, opts.exclude)

  exts = opts.extensions || exts || '*'
  if (exts !== '*') {
    exts = (Array.isArray(exts)
      ? exts : [exts]).map(e => e[0] !== '.' ? '.' + e : e)
  }

  return function (id) {
    return filt(id) && (exts === '*' || exts.indexOf(extname(id)) > -1)
  }
}
