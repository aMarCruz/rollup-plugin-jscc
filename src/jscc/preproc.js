/**
 * rollup-plugin-jspp entry point
 * @module
 */
import MagicString from 'magic-string'
import Parser from './parser'
import parseOptions from './parse-options'
import remapVars from './remap-vars'

/*
function fixEnd (code, pos) {
  if (code[pos] === '\r' && code[pos + 1] === '\n') ++pos
  return pos + 1
}*/

export default function preproc (code, filename, _options) {

  const options   = parseOptions(filename, _options)
  const magicStr  = new MagicString(code)
  const parser    = new Parser(options)

  const re = parser.getRegex()  // $1:keyword, $2:expression

  let changes   = false
  let output    = true
  let hideStart = 0
  let lastIndex
  let match

  re.lastIndex = lastIndex = 0
  debugger //eslint-disable-line
  while ((match = re.exec(code))) {
    let index = match.index

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
    let result = {
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
    let block = ''

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
