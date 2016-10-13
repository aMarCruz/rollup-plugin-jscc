/**
 * rollup-plugin-jscc entry point
 * @module
 */
import jscc from 'jscc'
import createFilter from './util/filter'
import { readFileSync } from 'fs'

export default function jspp (options) {
  if (!options) options = {}

  const filter = createFilter(options, ['.js', '.jsx', '.tag'])

  return {

    name: 'jscc',

    load (id) {
      if (filter(id)) {
        const code = readFileSync(id, 'utf8')
        return jscc(code, id, options)
      }
      return null
    }
  }
}
