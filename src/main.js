/**
 * rollup-plugin-jscc entry point
 * @module
 */
import parseOptions from './jscc/parseoptions'
import postproc from './jscc/postproc'
import preproc from './jscc/preproc'
import { createFilter } from 'rollup-pluginutils'
import { readFileSync } from 'fs'
import { extname } from 'path'


export default function jspp (options) {
  if (!options) options = {}

  // prepare extensions to match with the extname() result
  function normalizeExtensions (exts) {
    if (exts) {
      for (let i = 0; i < exts.length; i++) {
        let ext = exts[i].toLowerCase()
        exts[i] = ext[0] !== '.' ? '.' + ext : ext
      }
    } else {
      exts = ['.js']
    }
    return exts
  }

  const extensions = normalizeExtensions(options.extensions)
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'jscc',
    load (id) {
      if (filter(id) && ~extensions.indexOf(extname(id).toLowerCase())) {
        let code = readFileSync(id, 'utf8')
        let opts = parseOptions(id, options)
        return postproc(preproc(code, id, opts), opts)
      }
      return null
    }
  }
}
