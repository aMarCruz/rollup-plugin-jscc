/**
 * @module HtmlParser
 */

import assign from './utils/object-assign'
import Echo from './echo'

//#if !_T
import $_T from './_types'
//#endif
//#set _SELFCLOSE = 1
//#if 0
const $_SELFCLOSE = 1
//#endif

// Matches the start of valid tags names; used with the first 2 chars after '<'
const R_TAG_START = /^\/?[a-zA-Z]/

// Matches valid tags names after the validation with R_TAG_START.
// $1: tag name, $2: closing brace (no attributes, non self-closing tags only)
const R_TAG = /\/?(.[^\s>/]*)\s*(>)?/g

// Matches the closing tag of a `script` block
const R_SCRIPT_CLOSE = /<\/script\s*>/gi

// Matches the closing tag of a `style` block
const R_STYLE_CLOSE = /<\/style\s*>/gi

// Matches an attribute name-value pair (both can be empty).
// $1: attribute name, $2: value including any quotes
const R_ATTR_NAME_VAL = /(\S[^>/=\s]*)\s*(?:=\s*('[^']*'|"[^"]*"|[^\s>]+)?)?/g


// The HtmlParser class ===================================

/*
  Ctor for the class
*/
function HtmlParser (builder, options) {

  options = assign({
    keepComments: true,
    strict: false,
    verbose: false
  }, options)

  if (builder == null) {
    builder = new Echo()
  }

  if (typeof options.callback == 'function') {
    builder.callback = options.callback
  }
  if (typeof options.onError == 'function') {
    this.errorHandler = options.onError
  }

  this.options = options
  this.builder = builder
  this.reset()
}


assign(HtmlParser.prototype, {

  // Public methods =======================================

  reset () {
    this._state = {
      pos: 0,
      loc: 0,
      mode: $_T.TEXT,
      data: null,
      scryle: false,
      strict: false,
      queued: null,
      line: 1,
      col: 0
    }
    this.builder.reset()
  },

  /*
    The main parser
  */
  parse (data) {

    this.reset()

    let state = this._state
    state.data = data

    while (state.pos < state.data.length) {
      if (state.mode === $_T.TAG) {
        this._parseTag(state)
      } else if (state.mode === $_T.ATTR) {
        this._parseAttr(state)
      } else { // TEXT
        this._parseText(state)
      }
    }

    if (state.mode !== $_T.TEXT) {
      this.errorHandler(state, 'unespected end of file')
    }

    this._flush()
    this.builder.done()
  },

  /*
    Error handler can be replaced with your own function.
    It must return the next position inside state.data
    or raise an exception.
  */
  errorHandler (state, message) {
    if (this.options.strict) {
      const loc = this._newLoc(state, state.pos)
      message = `[${ loc.line },${ loc.col }] ${ message }`
      throw new Error(message)
    }
    return state.data.length
  },


  // Private ================================================

  /*
    Add raw text to the last *tag*, optionally closing the tag.
  */
  _addRaw (end, sc) {
    const state = this._state
    let q = state.queued

    state.pos = q.end = end
    if (sc === '/') {
      q._flags = ~~q._flags | $_SELFCLOSE
      this._flush()
    }
  },

  /*
    Pushes a new *tag* or attribute. Any `raw` data will be added to previuos tag
  */
  _pushAttr (attr) {
    const state = this._state
    let q = state.queued

    //assert(q && q.type === Mode.TAG, 'no previous tag for the attr!')
    state.pos = q.end = attr.end
    q.attrs.push(attr)
  },

  /*
    Pushes a new *tag* or attribute. Any `raw` data will be added to previuos tag
  */
  _pushTag (tag) {
    const state = this._state

    tag.attrs = []
    if (state.queued) this._flush()
    state.queued = tag
  },

  /*
    Stores text in the queued text node, or creates a new one.
  */
  _pushText (data, pos, nonew) {
    const state = this._state
    let len = data.length
    let q = state.queued

    if (q && q.type === $_T.TEXT) {
      q.raw += data
      q.end += len
    } else if (!nonew) {
      if (pos == null) pos = state.pos
      if (q) this._flush() // flush queued tag
      state.queued = this._newNode($_T.TEXT, null, pos, pos + len)
    }
  },

  /*
    Outputs the pending node to the builder.
  */
  _flush () {
    let q = this._state.queued
    if (q) {
      if (q.type === $_T.TAG && this.options.verbose) {
        q.raw = this._state.data.slice(q.start, q.end)
      }
      this.builder.write(q)
      this._state.queued = null
    }
  },

  /*
    Writes a node into the builder.
  */
  _write (node) {
    this._flush()
    this.builder.write(node)
  },


  // Helper parsers ---------------------------------------

  /*
    Parses regular text and script/style blocks ...scryle for short :-)
    (the content of script and style is text as well)
  */
  _parseText (state) {
    let data = state.data
    let pos  = state.pos
    let start, next

    if (state.scryle) {
      let name = state.scryle
      let re = name === 'script' ? R_SCRIPT_CLOSE : R_STYLE_CLOSE

      re.lastIndex = pos
      let match = re.exec(data)
      if (match) {
        start = match.index
        next = re.lastIndex
      } else {
        start = next = this.errorHandler(state, `unclosed tag "${ name }"`)
      }
      state.scryle  = ''       // no error, reset the flag now

      // write the tag content, if any
      if (start > pos) {
        this._pushText(data.slice(pos, start))
      }
      // now the closing tag, either </script> or </style>
      this._write(this._newNode($_T.TAG, '/' + name, start, next))
      state.mode = $_T.TEXT

    } else {
      next = data.indexOf('<', pos)
      if (~next) {
        state.mode = $_T.TAG
      } else {
        next = data.length
      }
      if (next > pos) {
        this._pushText(data.slice(pos, next))
      }
      state.pos = next + 1
    }
  },

  /*
    Parse the tag following '<', or delegate to other parser if an
    invalid tag name is found.
  */
  _parseTag (state) {
    let data = state.data
    let pos  = state.pos
    let str  = data.substr(pos, 2)

    if (str[0] === '!') {
      // doctype, cdata, or comment start
      this._parseComment(state, pos + 1)

    } else if (R_TAG_START.test(str)) {
      // its a tag, $1:name, $2:'>'
      R_TAG.lastIndex = pos
      let match  = R_TAG.exec(state.data)
      let endPos = R_TAG.lastIndex
      let name   = match[1].toLowerCase()

      if (name === 'script' || name === 'style') {
        state.scryle = name
      }
      if (str[0] === '/') {
        name = '/' + name
      }
      let tag = this._newNode($_T.TAG, name, pos - 1, endPos)

      // only '>' can ends the tag here, the '/' is handled as attr
      if (match[2] !== '>') {
        state.mode = $_T.ATTR
        this._pushTag(tag)
        return
      }
      this._write(tag)

    } else {
      this._pushText('<', state.pos - 1)
    }
    state.mode = $_T.TEXT
  },

  /*
    Subparser for comment, doctype, cdata, or comment declarations.
    Parameter `pos` points to the char after the openning '<!'.
    DOCTYPE declaration is valid only when it is the first node.
  */
  _parseComment (state, pos) {
    let data = state.data
    let loc  = pos - 2        // back to the '<'
    let str  = data.substr(pos, 7).toUpperCase()
    let type

    if (str === 'DOCTYPE' &&
        /\s/.test(data[pos + 7]) && data.search(/\S/) >= loc) {
      str = '>'
      type = $_T.DOCTYPE
      pos += 7

    //} else if (str === '[CDATA[') {
    //  str = ']]>'
    //  type = __CDATA
    //  pos += 7
    //
    } else {
      str = data.substr(pos, 2) === '--' ? '-->' : '>'
      type = $_T.COMMENT
    }

    pos = data.indexOf(str, pos)
    if (pos < 0) {
      pos = this.errorHandler(state, `unclosed ${ type === $_T.DOCTYPE ? 'doctype' : 'comment' }`)
    }
    pos += str.length

    let node = this._newNode(type, null, loc, pos)

    if (type === $_T.COMMENT && !this.options.keepComments) {
      this._pushText(' ', loc, true)
      state.pos = pos
    } else {
      this._write(node)
    }
  },

  /*
    The more complex parsing is in attributes.
  */
  _parseAttr (state) {
    const _C = /\S/g
    let data = state.data

    _C.lastIndex = state.pos
    let match = _C.exec(data)
    if (!match) {
      this._addRaw(data.length)
      return
    }
    let c = match[0]

    if (c === '>' || c === '/') {
      // maybe end of tag, skip this char. This mimic the behavior of
      // Chrome, skipping any '/' even if the closing '>' is not found.
      if (c !== '>') {
        match = _C.exec(data)
        if (!match || match[0] !== '>') {
          this._addRaw(match ? match.index : data.length)
          return
        }
      }
      this._addRaw(_C.lastIndex, c) // 1 to skip the closing '>'
      state.mode = $_T.TEXT

    } else {
      // R_ATTR_NAME_VAL = /(\S[^>/=\s]*)\s*(?:=\s*('[^']*'|"[^"]*"|[^\s>]+)?)?/g
      let start = match.index   // first non-whitespace
      let re    = R_ATTR_NAME_VAL
      re.lastIndex = start
      match     = re.exec(data)
      let end   = re.lastIndex
      let name  = match[1].toLowerCase()
      let value = match[2] || ''

      if (value) {
        let err
        switch (value[0]) {
          case '"':
            value = value.replace(/^"([^"]*)"$/, '$1')
            err = value[0] === '"'
            break
          case "'":
            value = value.replace(/^'([^']*)'$/, '$1')
            err = value[0] === "'"
            break
          default:
            value = value.trim()
        }
        if (err) {
          end = this.errorHandler(state, 'unclosed attribute')
          value = ''
        }
      }
      this._pushAttr({ name, value, start, end })
    }
  },

  // update global position
  _newLoc (state, start) {
    let col = state.col
    let pos = state.loc
    if (pos < start) {
      const data = state.data.slice(pos, start)
      const re  = /\r\n?|\n/g    // eols of any type (unix/mac/win)
      let lines = pos = 0

      while (re.exec(data)) {
        pos = re.lastIndex
        lines++
      }
      if (lines) {
        state.line += lines
        col = 0
      }
      state.col = col += data.length - pos
      state.loc = start
    }
    return { line: state.line, col }
  },

  /**
   * @param   {number}      type  - node type.
   * @param   {string|null} name  - node name, if null the node has no `name` property
   * @param   {number}      start - start pos, in tags this will point to '<'
   * @param   {number}      next  - pos after this node. In tags this will point to the char following
   *                                the '>', in text nodes points to the char after the text, so
   *                                this is mustly the `re.lastIndex` value
   * @returns {object}      a new node.
   */
  _newNode (type, name, start, next) {
    const state = this._state

    let node = { type }

    if (name) {
      node.name = name
    }
    if (this.options.location) {
      node.loc = this._newLoc(state, start)
    }
    if (this.options.verbose || ~[$_T.TEXT, $_T.COMMENT, $_T.DOCTYPE].indexOf(type)) {
      node.raw = state.data.slice(start, next)
    }

    node.start = start
    node.end   = state.pos = next
    return node
  }

})


export default HtmlParser
