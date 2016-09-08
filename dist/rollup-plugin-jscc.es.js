import MagicString from 'magic-string';
import { relative, extname } from 'path';
import { createFilter } from 'rollup-pluginutils';
import { readFileSync } from 'fs';

/**
 * @module regexlist
 */

var VARPAIR = /^\s*(__[0-9A-Z][_0-9A-Z]*)\s*=?(.*)/
var VARNAME = /^__[0-9A-Z][_0-9A-Z]*$/

// var names inside expression
var EVLVARS = /(^|[^$\w\.])(__[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/g

// var names inside the code
var REPVARS = /(^|[^\w\.])(?!$\$)\$(__[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/g

var _filters = {
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

function parseOptions (filename, options) {
  if (!options) options = {}

  function _file (s) {
    return s && relative(process.cwd(), filename).replace(/\\/g, '/') || ''
  }

  // sallow copy of the values, for per file basis
  var values = {}
  var source = options.values
  if (source) {
    if (typeof source != 'object') {
      throw new Error('values must be an plain object')
    } else {
      Object.keys(source).forEach(function (v) {
        if (!VARNAME.test(v)) {
          throw new Error(("invalid variable name: " + v))
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
  var comments = options.comments
  if (comments == null) {
    comments = [_filters.some]
  } else if (comments === 'all') {
    comments = true
  } else if (comments === 'none') {
    comments = false
  } else if (typeof comments != 'boolean') {
    var filters = Array.isArray(comments) ? comments : [comments]
    comments = []
    filters.forEach(function (f) {
      if (f instanceof RegExp) {
        comments.push(f)
      } else if (typeof f != 'string') {
        throw new Error('type mismatch in comment filter.')
      } else if (f in _filters) {
        comments.push(_filters[f])
      } else {
        throw new Error(("unknown comments filter \"" + f + "\""))
      }
    })
  }

  return {
    sourceMap: options.sourceMap !== false,
    comments: comments,
    values: values
  }
}

/**
 * @module perf-regexes
 *
 * Optimized and powerful regexes for JavaScript
 */
/* eslint-disable max-len */

/** Matches valid multiline JS comments */
var JS_MLCOMM = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g

/** Single line JS comments */
var JS_SLCOMM = /\/\/[^\n\r]*/g

/** Single and double quoted strings, take care about embedded eols */
var JS_STRING = /"[^"\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^"\n\r\\]*)*"|'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/g

/** Allow skip division operators and closing html tags to detect non-regex slashes */
var JS_DIVISOR = /(?:\b(?:return|yield)\s+|<\/[-a-zA-Z]|(?:[$\w\)\]]|\+\+|--)\s*\/(?![*\/]))/g

/** Matches literal regexes -- $1 last slash of the regex */
var JS_REGEX = /\/(?=[^*\/\n\r>])[^[\n\r/\\]*(?:(?:\[(?:\\[^\n\r]|[^\]\n\r\\]*)*\]|\\.)[^[/\n\r\\]*)*?(\/)[gim]*/g

/** Matches valid HTML comments (ES6 code can have this) */
var HTML_COMM = /<!--(?!>)[\S\s]*?-->/g

/**
 * ES6 template strings (not recommended).
 * This is for very limited strings, since there's no way to parse
 * nested ES6 strings with regexes.
 *
 * This is a valid ES6 string: `foo ${ "`" + '`' + `\`${ { bar }.baz }` }`
 */
var ES6_TSTR_SIMPLE = /`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g

// For replacing of jspreproc variables (#set)
var _REPVARS = RegExp(
    JS_STRING.source  + '|' +
    JS_DIVISOR.source + '|' +
    JS_REGEX.source   + '|' +  // $1 = '/' if is a regex
    EVLVARS.source,            // $2 = prefix, $3 = var name
  'g')

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
  function _repVars (m, _, p, v) {
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
    console.error(("In expression: " + expr))  // eslint-disable-line no-console
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

var JSCC = /^(?:\/\/|\/\*|<!--)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?=[ \t\n\*]|-->|$)(-->|.*)/
var COMM = /^(?:\/\/|\/\*|<!--)/

function atStart (code, pos) {
  --pos
  do {
    if (pos < 0 || code[pos] === '\n') return true
  } while (/\s/.test(code[pos--]))
  return false
}


/**
 * Conditional comments parser
 *
 * @param {object} options - The global options
 * @class
 */
function CodeParser (options) {

  this.options = options
  this.cc = [{
    state: WORKING,
    block: NONE
  }]
}


CodeParser.prototype = {

  _emitError: function _emitError (str) {
    //str = `jspp [${ this.cc.fname || 'input' }] : ${ str }`
    throw new Error(str)
  },

  /**
   * Removes trailing singleline comment or the start of multiline comment
   * and checks if required expression is present.
   *
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Normalized expression.
   */
  _normalize: function _normalize (ckey, expr) {
    expr = expr.replace(/(?:\*\/|-->).*/, '').trim()

    // all keywords must have an expression, except `#else/#endif`
    if (!expr && ckey !== 'else' && ckey !== 'endif') {
      this._emitError('Expression expected for #' + ckey)
    }
    return expr
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
  checkInBlock: function checkInBlock (info, key, mask) {
    var block = info.block
    var isIn  = block && block === (block & mask)

    if (!isIn) this._emitError('Unexpected #' + key)
  },

  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Object} data - Object with the directive, created by parse
   * @returns {boolean}       Output state, `false` for hide the output.
   */
  checkOutput: function checkOutput (data) {
    var cc     = this.cc
    var last   = cc.length - 1
    var ccInfo = cc[last]
    var state  = ccInfo.state
    var key    = data.key
    var expr   = this._normalize(key, data.expr)

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
        this.checkInBlock(ccInfo, key, IF)
        if (state === TESTING && this._getValue('if', expr)) {
          ccInfo.state = state = WORKING
        } else if (state === WORKING) {
          ccInfo.state = state = ENDING
        }
        break

      case 'else':
        this.checkInBlock(ccInfo, key, IF)
        ccInfo.block = ELSE
        ccInfo.state = state = state === TESTING ? WORKING : ENDING
        break

      case 'endif':
        this.checkInBlock(ccInfo, key, IF | ELSE)
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

  _adjustBlock: function _adjustBlock (block) {
    // special case for hidden blocks
    if (block.slice(0, 2) === '/*') {
      var end = block.search(/\*\/|-->|\n/)

      if (~end && block[end] === '\n') {
        // trim avoids cut original \r\n eols
        block = block.slice(0, end).trim()
      }
    }
    return block
  },

  /**
   * Check if the line is a conditional comment
   *
   * @param   {string} code  - Full source code (untouched)
   * @param   {string} block - Unparsed comment block
   * @param   {number} start - Offset of comment inside `code`
   * @returns {object}         Object with info about the comment.
   */
  parse: function parse (code, block, start) {
    var match  = block.match(COMM)
    var result = false

    if (match) {
      match = block.match(JSCC)
      if (match && atStart(code, start)) {
        block  = this._adjustBlock(block)
        result = { type: 'JSCC', block: block, key: match[1], expr: match[2] }
      } else {
        result = { type: 'COMM', block: block }
      }
    }
    return result
  },

  /**
   * Check unclosed blocks before vanish.
   */
  close: function close () {
    if (this.cc.length > 1) {
      this._emitError('Unclosed conditional block')
    }
    this.options = false
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

// for matching all vars inside code
function remapVars (magicStr, values, str, start) {
  var re = REPVARS
  var mm
  var changes = false

  re.lastIndex = 0  // `re` is global, so reset

  while ((mm = re.exec(str))) {
    var v = mm[2]
    if (v && v in values) {
      var idx = start + mm.index + mm[1].length
      magicStr.overwrite(idx, idx + v.length + 1, '' + values[v])
      changes = true
    }
  }

  return changes
}

/**
 * rollup-plugin-jspp entry point
 * @module
 */
var QBLOCKS = RegExp([
  JS_MLCOMM.source,                 // --- multi-line comment
  JS_SLCOMM.source,                 // --- single-line comment
  HTML_COMM.source,                 // --- html multi-line comment
  JS_STRING.source,                 // --- string, don't care about embedded eols
  ES6_TSTR_SIMPLE.source,           // --- es6 template string (limited support)
  JS_DIVISOR.source,                // $1: division operator
  JS_REGEX.source                   // $2: last slash of regex
].join('|'), 'gm')


function preproc (code, filename, _options) {

  var opts      = parseOptions(filename, _options)
  var magicStr  = new MagicString(code)
  var parser    = new CodeParser(opts)

  var changes = false
  var output  = true
  var re = QBLOCKS

  var lastIndex
  var match

  // normalize eols - replacement here does NOT affect the result
  if (~code.indexOf('\r')) {
    code = code.replace(/\r\n/g, '\n\n').replace(/\r/g, '\n')
  }
  re.lastIndex = lastIndex = 0

  while ((match = re.exec(code))) {

    var index = match.index
    var block = match[0]
    if (match[1] || match[2] || /['"`]/.test(block[0])) continue

    var comment = parser.parse(code, block, index)
    if (comment) {
      pushCache(code.slice(lastIndex, index), lastIndex, output)

      block = comment.block   // parse can change the length

      if (comment.type === 'JSCC') {
        re.lastIndex = index + block.length
        output = parser.checkOutput(comment)
        pushCache(block, index, false)
      } else {
        pushCache(block, index, output && canOut(block))
      }

      lastIndex = re.lastIndex
    }
  }

  parser.close()  // let parser to detect unbalanced blocks

  if (code.length > lastIndex) {
    pushCache(code.slice(lastIndex), lastIndex, output)
  }

  // by getting the code from magicString, we keep original line-endings
  var result = {
    code: magicStr.toString()
  }
  if (changes && opts.sourceMap) {
    result.map = magicStr.generateMap({ hires: true })
  }
  return result


  // helpers ==============================================

  function pushCache (str, start, out) {
    if (!str) return

    if (!out) {
      magicStr.overwrite(start, start + str.length, ' ')
      changes = true

    } else if (~str.indexOf('$__')) {
      changes = remapVars(magicStr, opts.values, str, start) || changes
    }
  }

  // Array.find is not available in node 0.12
  function canOut (str) {
    var oc = opts.comments

    if (oc && oc !== true) {
      for (var i = 0; i < oc.length; i++) {
        if (oc[i].test(str)) return true
      }
      oc = false
    }
    return oc
  }
}

/**
 * Creates a filter for the options `include`, `exclude`, and `extensions`.
 * Since `extensions` is not a rollup option, I think is widely used.
 *
 * @param {object} opts? - The user options
 * @returns {function}     Filter function that returns true if a given
 *                         file matches the filter.
 */
function _createFilter (opts) {
  if (!opts) opts = {}

  var filt = createFilter(opts.include, opts.exclude)
  var exts = opts.extensions
             ? opts.extensions.map(function (e) { return (e[0] !== '.' ? '.' + e : e).toLowerCase(); })
             : ['.js']

  return function (name) {
    return filt(name) && exts.indexOf(extname(name).toLowerCase()) > -1
  }
}

/**
 * rollup-plugin-jscc entry point
 * @module
 */
function jspp (options) {

  var filter = _createFilter(options)

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