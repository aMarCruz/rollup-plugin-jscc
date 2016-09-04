'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var MagicString = _interopDefault(require('magic-string'));
var rollupPluginutils = require('rollup-pluginutils');
var fs = require('fs');

/**
 * @module regexes
 *
 * Shared regexes
 */

var RE = {
  // Multi-line comment
  MLCOMMS:  /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
  // Single-line comment
  SLCOMMS:  /\/\/.*$/g,
  // Quoted strings, take care about embedded eols
  STRINGS:  /"[^"\n\\]*(?:\\[\S\s][^"\n\\]*)*"|'[^'\n\\]*(?:\\[\S\s][^'\n\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g,
  // Allows skip division operators to detect non-regex slash -- $1: the slash
  DIVISOR:  /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/g,
  // Matches regexes -- $1 last slash of the regex
  REGEXES:  /\/(?=[^*\/])[^[/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[/\\]*)*?(\/)[gim]*/g,

  // Matches valid HTML comments (allowed in ES6 code)
  HTMLCOMMS: /<!--(?!>)[\S\s]*?-->/g,

  // Matches the start of a comment
  ISCOMMENT: /^(?:<--|\/\*|\/\/)/,

  // The constant values of this module
  VARPAIR:  /^\s*(__[0-9A-Z][_0-9A-Z]*)\s*=?(.*)/,
  VARNAME:  /^__[0-9A-Z][_0-9A-Z]*$/,

  // var names inside expression
  REPVARS:  /(^|[^$\w])(__[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/,

  // template for var list
  VARLIST:  /(^|[^$\w])(__(?:@))\b(?=[^$\w]|$)/.source,

  // for matching all vars inside code
  reVarList: function reVarList (values) {
    var list = Object.keys(values).map(function (v) { return v.slice(2); }).join('|')
    return this.VARLIST.replace('@', list)
  }
}

var _filters = {
  // only preserve license
  license:  /^@license\b/,
  // (almost) like the uglify defaults
  some:     /(?:^(?:\/[*/]|<--)!|(?:@license|@preserve|@cc_on)\b)/,
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
  srcmaps:  /\/\/#\ssource(Mapping)URL=/
}

function parseOptions (filename, options) {
  if (!options) options = {}

  function _file (s) {
    return s && path.relative(process.cwd(), filename).replace(/\\/g, '/') || ''
  }

  // sallow copy of the values, for per file basis
  var values = {}
  var source = options.values
  if (source) {
    if (typeof source != 'object') {
      throw new Error('values must be an plain object')
    } else {
      Object.keys(source).forEach(function (v) {
        if (!RE.VARNAME.test(v)) {
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
    comments: comments,
    values: values
  }
}

var _MULTILINES = /[ \t]*\n\s*$/.source
var _ONELINE = /(?:[ \t]+$)/.source

/*
    Matched result is $1:prefix, $2:varname, $3:lines
 */
function makeRegex (values, lines) {
  var list = RE.reVarList(values)

  if (lines >= 0) list += "|(" + _MULTILINES + ")"

  return new RegExp((list + "|" + _ONELINE), 'gm')
}

function limitLines (block, lines) {
  return lines > 0 ? block.replace(/[^\n]+/g, '').slice(0, lines) : ''
}


function postproc (code, opts) {

  // @TODO: Optimize for maxEmptyLines -1
  var magicString = new MagicString(code)
  var maxLines = opts.maxEmptyLines < 0 ? 0xffff : opts.maxEmptyLines
  var regex = makeRegex(opts.values, maxLines)

  var match, block, repstr, changes

  // this avoids removing the last EOL
  if (/\n\s*$/.test(code)) magicString.append('\n')

  match = code.match(/^\s*\n(?=\s*\S)/)
  if (match) {
    block = match[0]
    repstr = limitLines(block, maxLines)
    changes = replaceBlock(block, 0, repstr)
    regex.lastIndex = block.length
  }

  while ((match = regex.exec(code))) {

    block = match[2]
    if (block) {
      repstr = match[1] + opts.values[block]
    } else {
      block = match[3]
      repstr = block ? limitLines(match[3], maxLines) : ''
    }

    changes = replaceBlock(match[0], match.index, repstr) || changes
  }

  if (changes) {
    var result = { code: magicString.toString() }
    if (opts.sourceMap) {
      result.map = magicString.generateMap({ hires: true })
    }
    return result
  }

  return code

  function replaceBlock (_block, start, _str) {
    if (_block === _str) return false
    var end = start + _block.length
    magicString.overwrite(start, end, _str)
    return true
  }
}

// For replacing of jspreproc variables (#set)
var _REPVARS = RegExp(
    RE.STRINGS.source + '|' +
    RE.DIVISOR.source + '|' +     // $1 can have '/'
    RE.REGEXES.source + '|' +     // $2 can have '/'
    RE.REPVARS.source,            // $3 = prefix, $4 = var name
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
  function _repVars (m, _1, _2, p, v) {
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
    console.error(("---> \"" + expr + "\""))  // eslint-disable-line no-console
    throw e
  }

  return result
}

/*
    Parser for conditional comments
 */
// const
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
    var match = block.match(/\n|\*\/|-->/)

    if (match) {
      var len = match[0].length
      if (len > 1) match.index += len
      block = block.slice(0, match.index)
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
    var m = s.match(RE.VARPAIR)
    if (m) {
      var k = m[1]
      var v = m[2]

      this.options.values[k] = v ? evalExpr(v.trim(), this.options.values) : undefined
    } else {
      this._emitError(("Invalid symbol or declaration \"" + s + "\""))
    }
  },

  _unset: function _unset (s) {
    var def = s.match(RE.VARNAME)
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

/**
 * By using premaked string of spaces, blankBlock is faster than
 * block.replace(/[^ \n]+/, ' ').
 *
 * @const {string}
 * @static
 */
var space150 = new Array(151).join(' ')

/**
 * Replaces all characters in the clock with spaces, except line-feeds.
 *
 * @param   {string} block - The buffer to replace
 * @returns {string}         The replacement block.
 */
function blankBlock (block) {
  return block.replace(/[^\n]+/g, function (m) {
    var len = m.length
    var str = space150
    while (str.length < len) str += space150
    return str.slice(0, len)
  })
}

/**
 * rollup-plugin-jspp entry point
 * @module
 */
var QBLOCKS = RegExp([
  RE.MLCOMMS.source,                  // --- multi-line comment
  RE.SLCOMMS.source,                  // --- single-line comment
  RE.HTMLCOMMS.source,                // --- html multi-line comment
  RE.STRINGS.source,                  // --- string, don't care about embedded eols
  RE.DIVISOR.source,                  // $1: division operator
  RE.REGEXES.source                   // $2: last slash of regex
].join('|'), 'gm')


function preproc (code, filename, options) {

  var parser = new CodeParser(options)
  var cache  = []
  var output = true

  var re = QBLOCKS
  var lastIndex
  var match

  if (~code.indexOf('\r')) {
    code = code.replace(/\r\n/g, ' \n').replace(/\r/g, '\n')
  }
  re.lastIndex = lastIndex = 0

  while ((match = re.exec(code))) {

    var index = match.index
    var block = match[0]
    if (match[1] || match[2] || /['"`]/.test(block[0])) continue

    var comment = parser.parse(code, block, index)
    if (comment) {
      pushCache(code.slice(lastIndex, index), output)

      if (comment.type === 'JSCC') {
        block = comment.block
        re.lastIndex = index + block.length
        output = parser.checkOutput(comment)
        pushCache(block, false)
      } else {
        pushCache(block, output && canOut(comment))
      }

      lastIndex = re.lastIndex
    }
  }

  parser.close()  // let parser to detect unbalanced blocks

  if (code.length > lastIndex) {
    pushCache(code.slice(lastIndex), output)
  }

  return cache.join('')

  // helpers ==============================================

  function pushCache (block, out) {
    if (block) cache.push(out ? block : blankBlock(block))
  }

  function canOut (comment) {
    var oc = options.comments

    // Array.find is not available in node 0.12
    function find (f, s) {
      for (var i = 0; i < f.length; i++) {
        if (f[i].test(s)) return true
      }
      return false
    }
    return oc === true || oc && find(oc, comment.block)
  }
}

/**
 * rollup-plugin-jspp entry point
 * @module
 */
function jspp (options) {
  if ( options === void 0 ) options = {};


  var filter = rollupPluginutils.createFilter(options.include, options.exclude)

  return {
    name: 'jspp',
    load: function load (id) {
      if (!filter(id)) return null
      var code = fs.readFileSync(id, 'utf8')
      var opts = parseOptions(id, options)
      return postproc(preproc(code, id, opts), opts)
    }
  }
}

module.exports = jspp;
//# sourceMappingURL=rollup-plugin-jspp.cjs.js.map
