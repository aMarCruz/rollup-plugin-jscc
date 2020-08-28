import { createFilter } from 'rollup-pluginutils'
import { extname } from 'path'

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
  const _filt = createFilter(opts.include, opts.exclude)

  exts = opts.extensions || exts
  if (!exts || exts === '*') {
    return _filt // do not filter extensions
  }

  if (!Array.isArray(exts)) {
    exts = [exts]
  }
  exts = exts.map(e => (e[0] !== '.' ? `.${e}` : e))

  return id => _filt(id) && exts.includes(extname(id))
}

export default makeFilter
