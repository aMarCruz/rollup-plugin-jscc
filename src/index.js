/**
 * rollup-plugin-jscc entry point
 * @module
 */
import preproc from './jscc/preproc'
import createFilter from './util/filter'
import { readFileSync } from 'fs'

export default function jspp (options) {

  const filter = createFilter(options)

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
