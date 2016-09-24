/*
    Parser for conditional comments
 */
import { STRINGS, VARPAIR, VARNAME } from './revars'
import evalExpr from './evalexpr'

const NONE = 0
const IF   = 1
const ELSE = 2

const WORKING = 0
const TESTING = 1
const ENDING  = 2

// These characters have to be escaped.
const R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g

// Matches a line with a directive, not including line-ending
const S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source

// Default opennig sequence of directives is ['//', '/*']
const S_DEFAULT = '//|/\\*'

// Match a substring that includes the first unquoted `//`
const R_LASTCMT = new RegExp(STRINGS.source + '|(//)', 'g')


/**
 * Conditional comments parser
 *
 * @param {object} options - The global options
 * @class
 */
export default function Parser (options) {
  this.options = options
  this.cc = [{
    state: WORKING,
    block: NONE
  }]
}


Parser.prototype = {

  _emitError (str) {
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
  _normalize (ckey, expr) {
    // anything after `#else/#endif` is ignored
    if (ckey === 'else' || ckey === 'endif') {
      return ''
    }
    // ...other keywords must have an expression
    if (!expr) {
      this._emitError('Expression expected for #' + ckey)
    }
    let match
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
  _getValue (ckey, expr) {
    if (ckey !== 'if') {
      let yes = expr in this.options.values ? 1 : 0

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }
    // returns the raw value of the expression
    return evalExpr(expr, this.options.values)
  },

  // Inner helper - throws if the current block is not of the expected type
  _checkBlock (info, key, mask) {
    let block = info.block
    let isIn  = block && block === (block & mask)

    if (!isIn) this._emitError('Unexpected #' + key)
  },

  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  parse (match) {
    let cc     = this.cc
    let last   = cc.length - 1
    let ccInfo = cc[last]
    let state  = ccInfo.state
    let key    = match[1]
    let expr   = this._normalize(key, match[2])

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
  close () {
    if (this.cc.length !== 1 || this.cc[0].state !== WORKING) {
      this._emitError('Unexpected end of file')
    }
    this.options = false
  },

  getRegex () {
    let list = this.options.prefixes

    if (list) list = list.map(s => s.replace(R_ESCAPED, '\\')).join('|')
    else list = S_DEFAULT

    list = S_RE_BASE.replace('@', list)
    return RegExp(list, 'gm')
  },

  _set (s) {
    let m = s.match(VARPAIR)
    if (m) {
      let k = m[1]
      let v = m[2]

      this.options.values[k] = v ? evalExpr(v.trim(), this.options.values) : undefined
    } else {
      this._emitError(`Invalid symbol or declaration "${ s }"`)
    }
  },

  _unset (s) {
    let def = s.match(VARNAME)
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
