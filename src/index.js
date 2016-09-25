/**
 * rollup-plugin-jscc entry point
 * @module
 */
import preproc from './jscc/preproc'
import checkOptions from './jscc/check-options'
import createFilter from './util/filter'
import { readFileSync } from 'fs'

export default function jspp (options) {
  if (!options) options = {}

  const filter = createFilter(options, ['.js', '.jsx', '.tag'])

  options = checkOptions(options)

  return {

    name: 'jscc',

    load (id) {
      if (filter(id)) {
        let code = readFileSync(id, 'utf8')
        return preproc(code, id, options)
      }
      return null
    }
  }
}
