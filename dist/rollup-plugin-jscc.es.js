import MagicString from 'magic-string';
import { extname, join, relative } from 'path';
import { createFilter } from 'rollup-pluginutils';
import { readFileSync } from 'fs';

/**
 * @module regexlist
 */

// name=value in directives - $1:name, $2:value (including any comment)
var VARPAIR = /^\s*(_[0-9A-Z][_0-9A-Z]*)\s*=?(.*)/

// to verify valid varnames and for #unset
var VARNAME = /^_[0-9A-Z][_0-9A-Z]*$/

// prefixing varnames inside expression with `this.` or `global.`
var EVLVARS = /(^|[^$\w\.])(_[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/g

// replace varnames inside the code from $_VAR.prop to value
var REPVARS = /(?:(\$_[0-9A-Z][_0-9A-Z]*)(\.[\w]+)?)(?=[\W]|$)/g

// matches single and double quoted strings, take care about embedded eols
var STRINGS = /"[^"\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^"\n\r\\]*)*"|'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/g

// For replacing of jspreproc variables ($1 = prefix, $2 = varname)
var _REPVARS = RegExp(STRINGS.source + '|' + EVLVARS.source, 'g')

/**
 * Method to perform the evaluation of the received string using
 * a function instantiated dynamically.
 *
 * @param   {string} str - String to evaluate, can include other defined vars
 * @param   {object} ctx - Set of variable definitions
 * @returns {any}          The result.
 */
function evalExpr (str, ctx) {

  // var replacement
  function _repVars (m, p, v) {
    return v
      ? p + (v in ctx ? 'this.' + v : v in global ? 'global.' + v : 'undefined')
      : m
  }

  var expr = str
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(_REPVARS, _repVars)

  var result

  try {
    // eslint-disable-next-line no-new-func
    var fn = new Function('', 'return (' + expr + ');')
    result = fn.call(ctx)
  } catch (e) {
    e.message += " in expression: " + expr
    throw e
  }

  return result
}

/*
    Parser for conditional comments
 */
var NONE = 0
var IF   = 1
var ELSE = 2

var WORKING = 0
var TESTING = 1
var ENDING  = 2

// These characters have to be escaped.
var R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g

// Matches a line with a directive, not including line-ending
var S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source

// Default opennig sequence of directives is ['//', '/*']
var S_DEFAULT = '//|/\\*'

// Match a substring that includes the first unquoted `//`
var R_LASTCMT = new RegExp(STRINGS.source + '|(//)', 'g')


/**
 * Conditional comments parser
 *
 * @param {object} options - The global options
 * @class
 */
function Parser (options) {
  this.options = options
  this.cc = [{
    state: WORKING,
    block: NONE
  }]
}


Parser.prototype = {

  _emitError: function _emitError (str) {
    //str = `jspp [${ this.cc.fname || 'input' }] : ${ str }`
    throw new Error(str)
  },

  /**
   * Retrieve the required expression with the jscc comment removed.
   * It is necessary to skip quoted strings to avoid truncation
   * of expressions like "file:///path"
   *
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Normalized expression.
   */
  _normalize: function _normalize (ckey, expr) {
    // anything after `#else/#endif` is ignored
    if (ckey === 'else' || ckey === 'endif') {
      return ''
    }
    // ...other keywords must have an expression
    if (!expr) {
      this._emitError('Expression expected for #' + ckey)
    }
    var match
    R_LASTCMT.lastIndex = 0
    while ((match = R_LASTCMT.exec(expr))) {
      if (match[1]) {
        expr = expr.slice(0, match.index)
        break
      }
    }
    return expr.trim()
  },

  /**
   * Expression evaluation for `#if-#ifset-#ifnset`.
   * Intercepts the `#ifset-#ifnset` shorthands, call `evalExpr` for `#if` statements.
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Evaluated expression as string.
   */
  _getValue: function _getValue (ckey, expr) {
    if (ckey !== 'if') {
      var yes = expr in this.options.values ? 1 : 0

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }
    // returns the raw value of the expression
    return evalExpr(expr, this.options.values)
  },

  // Inner helper - throws if the current block is not of the expected type
  _checkBlock: function _checkBlock (info, key, mask) {
    var block = info.block
    var isIn  = block && block === (block & mask)

    if (!isIn) { this._emitError('Unexpected #' + key) }
  },

  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  parse: function parse (match) {
    var cc     = this.cc
    var last   = cc.length - 1
    var ccInfo = cc[last]
    var state  = ccInfo.state
    var key    = match[1]
    var expr   = this._normalize(key, match[2])

    switch (key) {
      // Conditional blocks -- `#if-ifset-ifnset` pushes the state and `#endif` pop it
      case 'if':
      case 'ifset':
      case 'ifnset':
        state = state === ENDING ? ENDING : this._getValue(key, expr) ? WORKING : TESTING
        cc[++last] = {
          state: state,
          block: IF
        }
        break

      case 'elif':
        this._checkBlock(ccInfo, key, IF)
        if (state === TESTING && this._getValue('if', expr)) {
          ccInfo.state = state = WORKING
        } else if (state === WORKING) {
          ccInfo.state = state = ENDING
        }
        break

      case 'else':
        this._checkBlock(ccInfo, key, IF)
        ccInfo.block = ELSE
        ccInfo.state = state = state === TESTING ? WORKING : ENDING
        break

      case 'endif':
        this._checkBlock(ccInfo, key, IF | ELSE)
        cc.pop()
        --last
        state = cc[last].state
        break

      default:
        // set-unset-error is processed only for working blocks
        if (state === WORKING) {
          switch (key) {
            case 'set':
              this._set(expr)
              break
            case 'unset':
              this._unset(expr)
              break
            case 'error':
              this._error(expr)
              break
            // istanbul ignore next: just in case
            default:
              this._emitError('Unknown directive #' + key)
              break
          }
        }
        break
    }

    return state === WORKING
  },

  /**
   * Check unclosed blocks before vanish.
   */
  close: function close () {
    if (this.cc.length !== 1 || this.cc[0].state !== WORKING) {
      this._emitError('Unexpected end of file')
    }
    this.options = false
  },

  getRegex: function getRegex () {
    var list = this.options.prefixes

    if (list) { list = list.map(function (s) { return s.replace(R_ESCAPED, '\\'); }).join('|') }
    else { list = S_DEFAULT }

    list = S_RE_BASE.replace('@', list)
    return RegExp(list, 'gm')
  },

  _set: function _set (s) {
    var m = s.match(VARPAIR)
    if (m) {
      var k = m[1]
      var v = m[2]

      this.options.values[k] = v ? evalExpr(v.trim(), this.options.values) : undefined
    } else {
      this._emitError(("Invalid symbol or declaration \"" + s + "\""))
    }
  },

  _unset: function _unset (s) {
    var def = s.match(VARNAME)
    if (def) {
      delete this.options.values[s]
    } else {
      this._emitError(("Invalid symbol name \"" + s + "\""))
    }
  },

  _error: function _error (s) {
    s = s && evalExpr(s, this.options.values) || 'Error'
    throw new Error('' + s)
  }
}

function _getVersion () {
  var path$$1 = process.cwd().replace(/\\/g, '/')
  var pack, version = '?'

  while (~path$$1.indexOf('/')) {
    pack = join(path$$1, 'package.json')
    try {
      version = require(pack).version
      break
    } catch (_) {/**/}
    path$$1 = path$$1.replace(/\/[^/]*$/, '')
  }
  return version
}

function parseOptions (file, opts) {
  if (!opts) { opts = {} }
  if (!opts.values) { opts.values = {} }

  // sallow copy of the values, must be set per file
  var values = {}
  var source = opts.values
  if (typeof source != 'object') {
    throw new Error('values must be an plain object')
  }

  // grab _VERSION once in the source options
  if (source._VERSION == null) {
    source._VERSION = _getVersion()
  }

  Object.keys(source).forEach(function (v) {
    if (!VARNAME.test(v)) {
      throw new Error(("invalid variable name: " + v))
    }
    values[v] = source[v]
  })

  // file is readonly and valid only for this instance
  Object.defineProperty(values, '_FILE', {
    value: file && relative(process.cwd(), file).replace(/\\/g, '/') || '',
    enumerable: true
  })

  // sequence starting a directive, default is `//|/*` (JS comment)
  var prefixes = opts.prefixes
  if (typeof prefixes == 'string') {
    prefixes = [prefixes]
  }

  return {
    sourceMap: opts.sourceMap !== false,
    keepLines: !!opts.keepLines,
    prefixes: prefixes,
    values: values
  }
}

// for matching all vars inside code
function remapVars (magicStr, values, str, start) {
  var re = REPVARS
  var mm
  var changes = false

  re.lastIndex = 0  // `re` is global, so reset

  while ((mm = re.exec(str))) {
    var v = mm[1].slice(1)

    if (v in values) {
      var p = mm[2] && mm[2].slice(1)
      var idx = start + mm.index

      v = values[v]
      if (p && p in v) {
        v = v[p]
        mm[1] += mm[2]
      } else if (typeof v == 'object') {
        v = JSON.stringify(v)
      }

      magicStr.overwrite(idx, idx + mm[1].length, '' + v)
      changes = true
    }
  }

  return changes
}

/**
 * rollup-plugin-jspp entry point
 * @module
 */
/*
function fixEnd (code, pos) {
  if (code[pos] === '\r' && code[pos + 1] === '\n') ++pos
  return pos + 1
}*/

function preproc (code, filename, _options) {

  var options   = parseOptions(filename, _options)
  var magicStr  = new MagicString(code)
  var parser    = new Parser(options)

  var re = parser.getRegex()  // $1:keyword, $2:expression

  var changes   = false
  var output    = true
  var hideStart = 0
  var lastIndex
  var match

  re.lastIndex = lastIndex = 0

  while ((match = re.exec(code))) {
    var index = match.index

    if (output) {
      pushCache(code.slice(lastIndex, index), lastIndex)
    }
    lastIndex = re.lastIndex

    if (output === parser.parse(match)) {
      if (output) {
        removeBlock(index, lastIndex)
      }
    } else {
      output = !output
      if (output) {
        // output begins, remove the hidden block now
        removeBlock(hideStart, lastIndex)
      } else {
        // output ends, for now, all we do is to save
        // the pos where the hidden block begins
        hideStart = index
      }
    }
  }

  parser.close()  // let parser to detect unbalanced blocks

  if (code.length > lastIndex) {
    pushCache(code.slice(lastIndex), lastIndex, output)
  }

  // done, return an object if there was changes
  if (changes) {
    var result = {
      code: magicStr.toString()
    }
    if (changes && options.sourceMap) {
      result.map = magicStr.generateMap({ hires: true })
    }
    return result
  }

  return code


  // helpers ==============================================

  function pushCache (str, start) {
    if (str && ~str.indexOf('$_')) {
      changes = remapVars(magicStr, options.values, str, start) || changes
    }
  }

  function removeBlock (start, end) {
    var block = ''

    if (options.keepLines) {
      block = code.slice(start, end).replace(/[^\r\n]+/g, '')

    // @TODO: Remove first jscc lines
    } else if (start) {
      --start
      if (code[start] === '\n' && code[start - 1] === '\r') {
        --start
      }
    }
    magicStr.overwrite(start, end, block)
    changes = true
  }
}

/**
 * Creates a filter for the options `include`, `exclude`, and `extensions`.
 * It filter out names starting with `\0`.
 * Since `extensions` is not a rollup option, I think is widely used.
 *
 * @param {object}       opts - The user options
 * @param {array|string} exts - Default extensions
 * @returns {function}   Filter function that returns true if a given
 *                       file matches the filter.
 */
function _createFilter (opts, exts) {
  if (!opts) { opts = {} }

  var filt = createFilter(opts.include, opts.exclude)

  exts = opts.extensions || exts || '*'
  if (exts !== '*') {
    exts = (Array.isArray(exts)
      ? exts : [exts]).map(function (e) { return e[0] !== '.' ? '.' + e : e; })
  }

  return function (id) {
    return filt(id) && (exts === '*' || exts.indexOf(extname(id)) > -1)
  }
}

/**
 * rollup-plugin-jscc entry point
 * @module
 */
function jspp (options) {

  var filter = _createFilter(options, ['.js', '.jsx', '.tag'])

  return {

    name: 'jscc',

    load: function load (id) {
      if (filter(id)) {
        var code = readFileSync(id, 'utf8')
        return preproc(code, id, options)
      }
      return null
    }
  }
}

export default jspp;
