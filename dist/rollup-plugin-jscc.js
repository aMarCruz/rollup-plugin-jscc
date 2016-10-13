'use strict';

var MagicString = require('magic-string');
var path = require('path');
var rollupPluginutils = require('rollup-pluginutils');
var fs = require('fs');

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
var _REPVARS = RegExp(((STRINGS.source) + "|" + (EVLVARS.source)), 'g')

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
  var _repVars = function (m, p, v) {
    return v
      ? p + (v in ctx ? ("this." + v) : v in global ? ("global." + v) : 'undefined')
      : m
  }

  var expr = str
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(_REPVARS, _repVars)

  var result

  try {
    // eslint-disable-next-line no-new-func
    var fn = new Function('', ("return (" + expr + ");"))
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
// branch type
var NONE = 0
var IF   = 1
var ELSE = 2

// status
var WORKING = 0
var TESTING = 1
var ENDING  = 2
var ERROR   = 3

// These characters have to be escaped.
var R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g

// Matches a line with a directive, not including line-ending
var S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source

// Match a substring that includes the first unquoted `//`
var R_LASTCMT = new RegExp(((STRINGS.source) + "|(//)"), 'g')


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
  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  parse: function parse (match) {         //eslint-disable-line complexity
    var self = this
    var cc   = self.cc
    var ccInfo = cc[cc.length - 1]
    var state  = ccInfo.state

    if (state === ERROR) {
      return false
    }

    var key  = match[1]
    var expr = self._normalize(key, match[2])

    switch (key) {
      // Conditional blocks -- `#if-ifset-ifnset` pushes the state and `#endif` pop it
      case 'if':
      case 'ifset':
      case 'ifnset':
        if (state !== ENDING) {
          state = self._getValue(key, expr) ? WORKING : TESTING
        }
        ccInfo = { state: state, block: IF }
        cc.push(ccInfo)
        break

      case 'elif':
        if (_checkBlock(IF)) {
          if (state === TESTING && self._getValue('if', expr)) {
            ccInfo.state = WORKING
          } else if (state === WORKING) {
            ccInfo.state = ENDING
          }
        }
        break

      case 'else':
        if (_checkBlock(IF)) {
          ccInfo.block = ELSE
          ccInfo.state = state === TESTING ? WORKING : ENDING
        }
        break

      case 'endif':
        if (_checkBlock(IF | ELSE)) {
          cc.pop()
          ccInfo = cc[cc.length - 1]
        }
        break

      default:
        // set-unset-error is processed only for working blocks
        if (state === WORKING) {
          switch (key) {
            case 'set':
              self._set(expr)
              break
            case 'unset':
              self._unset(expr)
              break
            case 'error':
              self._error(expr)
              //_error throws
          }
        }
        break
    }

    return ccInfo.state === WORKING

    // Inner helper - throws if the current block is not of the expected type
    function _checkBlock (mask) {
      var block = ccInfo.block

      if (block !== NONE && block === (block & mask)) {
        return true
      }
      self._emitError(("Unexpected #" + key))
      return false
    }
  },

  /**
   * Check unclosed blocks before vanish.
   *
   * @returns {boolean} `true` if no error.
   */
  close: function close () {
    var cc  = this.cc
    var len = cc.length
    var err = len !== 1 || cc[0].state !== WORKING

    if (err && cc[0].state !== ERROR) {
      this._emitError('Unexpected end of file')
    }
    this.options = false
    return !err
  },

  /**
   * Returns the regex to match directives through all the code.
   *
   * @returns {RegExp} Global-multiline regex
   */
  getRegex: function getRegex () {
    var list = this.options.prefixes
                .map(function (s) { return s.replace(R_ESCAPED, '\\'); })
                .join('|')

    return RegExp(S_RE_BASE.replace('@', list), 'gm')
  },

  /**
   * Internal error handler. Set the state to ERROR and calls the
   * method `options.errorHandler`, if any, or throws an error.
   *
   * @param {string} message - Error description
   */
  _emitError: function _emitError (message) {
    var errFn = this.options.errorHandler

    //message = `jspp [${this.cc.fname || 'input'}] : ${message}`
    this.cc[this.cc.length - 1].state = this.cc[0].state = ERROR

    if (typeof errFn == 'function') {
      errFn(message)
    } else {
      throw new Error(message)
    }
  },

  /**
   * Retrieve the required expression with the jscc comment removed.
   * It is necessary to skip quoted strings and avoid truncation
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
      this._emitError(("Expression expected for #" + ckey))
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

  _set: function _set (s) {
    var m = s.match(VARPAIR)
    if (m) {
      var k = m[1]
      var v = m[2]

      this.options.values[k] = v ? evalExpr(v.trim(), this.options.values) : undefined
    } else {
      this._emitError(("Invalid memvar assignment \"" + s + "\""))
    }
  },

  _unset: function _unset (s) {
    var def = s.match(VARNAME)
    if (def) {
      delete this.options.values[s]
    } else {
      this._emitError(("Invalid memvar name \"" + s + "\""))
    }
  },

  _error: function _error (s) {
    s = evalExpr(s, this.options.values)
    throw new Error(s)
  }
}

function checkOptions (opts) {
  if (!opts) { opts = {} }

  var values = opts.values || (opts.values = {})

  if (typeof opts.values != 'object') {
    throw new Error('jscc values must be a plain object')
  }

  // set _VERSION once in the options
  if (values._VERSION == null) {
    var path$$1 = process.cwd().replace(/\\/g, '/')
    var pack, version = '?'

    while (~path$$1.indexOf('/')) {
      pack = path.join(path$$1, 'package.json')
      try {
        version = require(pack).version
        break
      } catch (_) {/**/}
      path$$1 = path$$1.replace(/\/[^/]*$/, '')
    }
    values._VERSION = version
  }

  Object.keys(opts.values).forEach(function (v) {
    if (!VARNAME.test(v)) {
      throw new Error(("Invalid memvar name: " + v))
    }
  })

  // sequence starting a directive, default is `//|/*` (JS comment)
  var prefixes = opts.prefixes
  if (!prefixes) {
    opts.prefixes = ['//', '/*', '<!--']
  } else if (typeof prefixes == 'string') {
    opts.prefixes = [prefixes]
  } else if (!Array.isArray(prefixes)) {
    throw new Error('`prefixes` must be an array')
  }

  return opts
}

function parseOptions (file, opts) {

  opts = checkOptions(opts)

  // shallow copy of the values, must be set per file
  var values = {}
  var source = opts.values

  Object.keys(source).forEach(function (v) { values[v] = source[v] })

  // file is readonly and valid only for this instance
  Object.defineProperty(values, '_FILE', {
    value: file && path.relative(process.cwd(), file).replace(/\\/g, '/') || '',
    enumerable: true
  })

  return {
    sourceMap:    opts.sourceMap !== false,
    keepLines:    opts.keepLines,
    errorHandler: opts.errorHandler,
    prefixes:     opts.prefixes,
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
      var p   = mm[2] && mm[2].slice(1)
      var idx = start + mm.index

      v = values[v]
      if (p && p in v) {
        v = v[p]
        mm[1] += mm[2]
      } else if (typeof v == 'object') {
        v = JSON.stringify(v)
      }

      magicStr.overwrite(idx, idx + mm[1].length, String(v))
      changes = true
    }
  }

  return changes
}

/**
 * rollup-plugin-jspp entry point
 * @module
 */
function preproc (code, filename, options) {

  options = parseOptions(filename, options)

  var magicStr  = new MagicString(code)
  var parser    = new Parser(options)

  var re = parser.getRegex()  // $1:keyword, $2:expression

  var changes   = false
  var output    = true
  var realStart = 0
  var hideStart = 0
  var lastIndex = 0
  var match, index

  re.lastIndex = 0

  while ((match = re.exec(code))) {

    index = match.index

    if (output && lastIndex < index) {
      pushCache(code.slice(lastIndex, index), lastIndex)
    }

    lastIndex = re.lastIndex

    if (output === parser.parse(match)) {
      if (output) {
        lastIndex = removeBlock(index, lastIndex)
      }
    } else {
      output = !output
      if (output) {
        // output begins, remove the hidden block now
        lastIndex = removeBlock(hideStart, lastIndex)
      } else {
        // output ends, for now, all we do is to save
        // the pos where the hidden block begins
        hideStart = index
      }
    }

  }

  if (!parser.close()) {  // let parser to detect unbalanced blocks
    output = false
  }

  if (output && code.length > lastIndex) {
    pushCache(code.slice(lastIndex), lastIndex)
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
    } else if (start > realStart) {
      --start
      if (code[start] === '\n' && code[start - 1] === '\r') {
        --start
      }
    } else if (end < code.length && /[\n\r]/.test(code[end])) {
      ++end
      if (code[end] === '\n' && code[end - 1] === '\r') {
        ++end
      }
      realStart = end
    }
    magicStr.overwrite(start, end, block)
    changes = true

    return end
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

  var filt = rollupPluginutils.createFilter(opts.include, opts.exclude)

  exts = opts.extensions || exts || '*'
  if (exts !== '*') {
    if (!Array.isArray(exts)) { exts = [exts] }
    exts = exts.map(function (e) { return e[0] !== '.' ? ("." + e) : e })
  }

  return function (id) {
    return filt(id) && (exts === '*' || exts.indexOf(path.extname(id)) > -1)
  }
}

/**
 * rollup-plugin-jscc entry point
 * @module
 */
function jspp (options) {
  if (!options) { options = {} }

  var filter = _createFilter(options, ['.js', '.jsx', '.tag'])

  return {

    name: 'jscc',

    load: function load (id) {
      if (filter(id)) {
        var code = fs.readFileSync(id, 'utf8')
        return preproc(code, id, options)
      }
      return null
    }
  }
}

module.exports = jspp;
