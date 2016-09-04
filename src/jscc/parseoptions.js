
import RE from './regexes'
import { relative } from 'path'

const _filters = {
  // only preserve license
  license:  /^@license\b/,
  // (almost) like the uglify defaults
  some:     /(?:@license|@preserve|@cc_on)\b/,
  // http://usejsdoc.org/
  jsdoc:    /^\/\*\*[^@]*@[A-Za-z]/,
  // http://www.jslint.com/help.html
  jslint:   /^\/[*\/](?:jslint|global|property)\b/,
  // http://jshint.com/docs/#inline-configuration
  jshint:   /^\/[*\/]\s*(?:jshint|globals|exported)\s/,
  // http://eslint.org/docs/user-guide/configuring
  eslint:   /^\/[*\/]\s*(?:eslint(?:\s|-[ed])|global\s)/,
  // http://jscs.info/overview
  jscs:     /^\/[*\/]\s*jscs:[ed]/,
  // https://gotwarlost.github.io/istanbul/
  istanbul: /^\/[*\/]\s*istanbul\s/,
  // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
  srcmaps:  /\/\/#\ssource(Mapping)URL=/,
  // preserve html comments
  html:    /<!--(?!>)[\S\s]*?-->/
}

export default function parseOptions (filename, options) {
  if (!options) options = {}

  function _file (s) {
    return s && relative(process.cwd(), filename).replace(/\\/g, '/') || ''
  }

  // sallow copy of the values, for per file basis
  let values = {}
  let source = options.values
  if (source) {
    if (typeof source != 'object') {
      throw new Error('values must be an plain object')
    } else {
      Object.keys(source).forEach(v => {
        if (!RE.VARNAME.test(v)) {
          throw new Error(`invalid variable name: ${ v }`)
        }
        values[v] = source[v]
      })
    }
  }

  // file is readonly and valid only for this instance
  Object.defineProperty(values, '__FILE', {
    value: _file(filename),
    enumerable: true
  })

  // multiple forms tu specify comment filters, default is 'some'
  let comments = options.comments
  if (comments == null) {
    comments = [_filters.some]
  } else if (comments === 'all') {
    comments = true
  } else if (comments === 'none') {
    comments = false
  } else if (typeof comments != 'boolean') {
    let filters = Array.isArray(comments) ? comments : [comments]
    comments = []
    filters.forEach(f => {
      if (f instanceof RegExp) {
        comments.push(f)
      } else if (typeof f != 'string') {
        throw new Error('type mismatch in comment filter.')
      } else if (f in _filters) {
        comments.push(_filters[f])
      } else {
        throw new Error(`unknown comments filter "${ f }"`)
      }
    })
  }

  /*
  let mapOptions = {
    sourceMapFile: options.sourceMapFile || '',
    includeContent: options.includeContent === true,
    hires: options.hires !== false
  }*/

  return {
    maxEmptyLines: options.maxEmptyLines | 0,
    sourceMap: options.sourceMap !== false,
    //mapOptions,
    comments,
    values
  }
}
