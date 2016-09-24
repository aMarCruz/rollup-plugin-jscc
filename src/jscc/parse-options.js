import { VARNAME } from './revars'
import { join as pathjoin, relative } from 'path'

function _getVersion () {
  let path = process.cwd().replace(/\\/g, '/')
  let pack, version = '?'

  while (~path.indexOf('/')) {
    pack = pathjoin(path, 'package.json')
    try {
      version = require(pack).version
      break
    } catch (_) {/**/}
    path = path.replace(/\/[^/]*$/, '')
  }
  return version
}

export default function parseOptions (file, opts) {
  if (!opts) opts = {}
  if (!opts.values) opts.values = {}

  // sallow copy of the values, must be set per file
  let values = {}
  let source = opts.values
  if (typeof source != 'object') {
    throw new Error('values must be an plain object')
  }

  // grab _VERSION once in the source options
  if (source._VERSION == null) {
    source._VERSION = _getVersion()
  }

  Object.keys(source).forEach(v => {
    if (!VARNAME.test(v)) {
      throw new Error(`invalid variable name: ${ v }`)
    }
    values[v] = source[v]
  })

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
