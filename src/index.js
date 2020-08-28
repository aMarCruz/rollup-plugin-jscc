import makeFilter from './make-filter'
import parseOptions from './parse-options'
import procFile from './proc-file'

const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.tag']

/**
 * rollup-plugin-jscc entry point
 *
 * @param {import('..').Options} options User options
 * @returns {import('rollup').Plugin}
 */
export default function jsccPlugin (options) {
  // Get the jscc options from the plugin options
  options = parseOptions(options)

  const filter = makeFilter(options, DEFAULT_EXTENSIONS)

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
