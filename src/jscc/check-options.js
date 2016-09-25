import { VARNAME } from './revars'
import { join as pathJoin } from 'path'

export default function checkOptions (opts) {
  if (!opts) opts = {}

  let values = opts.values
  if (values) {
    if (typeof opts.values != 'object') {
      throw new Error('jscc values must be a plain object')
    }
    Object.keys(opts.values).forEach(v => {
      if (!VARNAME.test(v)) {
        throw new Error(`invalid variable name: ${ v }`)
      }
    })
  } else {
    values = opts.values = {}
  }

  // set _VERSION once in the options
  if (values._VERSION == null) {
    let path = process.cwd().replace(/\\/g, '/')
    let pack, version = '?'

    while (~path.indexOf('/')) {
      pack = pathJoin(path, 'package.json')
      try {
        version = require(pack).version
        break
      } catch (_) {/**/}
      path = path.replace(/\/[^/]*$/, '')
    }
    values._VERSION = version
  }

  // sequence starting a directive, default is `//|/*` (JS comment)
  let prefixes = opts.prefixes
  if (typeof prefixes == 'string') {
    opts.prefixes = [prefixes]
  }

  return opts
}
