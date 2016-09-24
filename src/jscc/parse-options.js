import { VARNAME } from './revars'
import { relative } from 'path'

export default function parseOptions (file, opts) {
  if (!opts) opts = {}

  // sallow copy of the values, must be set per file
  let values = {}
  let source = opts.values
  if (source) {
    if (typeof source != 'object') {
      throw new Error('values must be an plain object')
    } else {
      Object.keys(source).forEach(v => {
        if (!VARNAME.test(v)) {
          throw new Error(`invalid variable name: ${ v }`)
        }
        values[v] = source[v]
      })
    }
  }

  // file is readonly and valid only for this instance
  Object.defineProperty(values, '_FILE', {
    value: file && relative(process.cwd(), file).replace(/\\/g, '/') || '',
    enumerable: true
  })

  // sequence starting a directive, default is `//|/*` (JS comment)
  let prefixes = opts.prefixes
  if (typeof prefixes == 'string') {
    prefixes = [prefixes]
  }

  return {
    sourceMap: opts.sourceMap !== false,
    keepLines: !!opts.keepLines,
    prefixes,
    values
  }
}
