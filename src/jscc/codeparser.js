/*
    Parser for conditional comments
 */
import evalExpr from './evalexpr'
import RE from './regexes'

const NONE = 0
const IF   = 1
const ELSE = 2

const WORKING = 0
const TESTING = 1
const ENDING  = 2

const JSCC = /^(?:\/\/|\/\*|<!--)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?=[ \t\n\*]|-->|$)(-->|.*)/
const COMM = /^(?:\/\/|\/\*|<!--)/

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
export default function CodeParser (options) {

  this.options = options
  this.cc = [{
    state: WORKING,
    block: NONE
  }]
}


CodeParser.prototype = {

  _emitError (str) {
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
  _normalize (ckey, expr) {
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
  _getValue (ckey, expr) {
    if (ckey !== 'if') {
      let yes = expr in this.options.values ? 1 : 0

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }
    // returns the raw value of the expression
    return evalExpr(expr, this.options.values)
  },

  // Inner helper - throws if the current block is not of the expected type
  checkInBlock (info, key, mask) {
    let block = info.block
    let isIn  = block && block === (block & mask)

    if (!isIn) this._emitError('Unexpected #' + key)
  },

  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Object} data - Object with the directive, created by parse
   * @returns {boolean}       Output state, `false` for hide the output.
   */
  checkOutput (data) {
    let cc     = this.cc
    let last   = cc.length - 1
    let ccInfo = cc[last]
    let state  = ccInfo.state
    let key    = data.key
    let expr   = this._normalize(key, data.expr)

    switch (key) {
      // Conditional blocks -- `#if-ifset-ifnset` pushes the state and `#endif` pop it
      case 'if':
      case 'ifset':
      case 'ifnset':
        state = state === ENDING ? ENDING : this._getValue(key, expr) ? WORKING : TESTING
        cc[++last] = {
          state,
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

  _adjustBlock (block) {
    // special case for hidden blocks
    if (block.slice(0, 2) === '/*') {
      let end = block.search(/\*\/|-->|\n/)

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
  parse (code, block, start) {
    let match  = block.match(COMM)
    let result = false

    if (match) {
      match = block.match(JSCC)
      if (match && atStart(code, start)) {
        block  = this._adjustBlock(block)
        result = { type: 'JSCC', block, key: match[1], expr: match[2] }
      } else {
        result = { type: 'COMM', block }
      }
    }
    return result
  },

  /**
   * Check unclosed blocks before vanish.
   */
  close () {
    if (this.cc.length > 1) {
      this._emitError('Unclosed conditional block')
    }
    this.options = false
  },

  _set (s) {
    let m = s.match(RE.VARPAIR)
    if (m) {
      let k = m[1]
      let v = m[2]

      this.options.values[k] = v ? evalExpr(v.trim(), this.options.values) : undefined
    } else {
      this._emitError(`Invalid symbol or declaration "${ s }"`)
    }
  },

  _unset (s) {
    let def = s.match(RE.VARNAME)
    if (def) {
      delete this.options.values[s]
    } else {
      this._emitError(`Invalid symbol name "${ s }"`)
    }
  },

  _error (s) {
    s = s && evalExpr(s, this.options.values) || 'Error'
    throw new Error('' + s)
  }
}
