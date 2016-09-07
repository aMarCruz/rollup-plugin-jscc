/**
 * rollup-plugin-jspp entry point
 * @module
 */
import MagicString from 'magic-string'
import parseOptions from './parseoptions'
import CodeParser from './codeparser'
import { remapVars } from './remapvars'
import { MLCOMMS, SLCOMMS, HTMLCOMMS, STRINGS, DIVISOR, REGEXES } from './revars'

const QBLOCKS = RegExp([
  MLCOMMS.source,                  // --- multi-line comment
  SLCOMMS.source,                  // --- single-line comment
  HTMLCOMMS.source,                // --- html multi-line comment
  STRINGS.source,                  // --- string, don't care about embedded eols
  DIVISOR.source,                  // $1: division operator
  REGEXES.source                   // $2: last slash of regex
].join('|'), 'gm')


export default function preproc (code, filename, _options) {

  const opts      = parseOptions(filename, _options)
  const magicStr  = new MagicString(code)
  const parser    = new CodeParser(opts)

  let changes = false
  let output  = true
  let re = QBLOCKS

  let lastIndex
  let match

  // normalize eols - replacement here does NOT affect the result
  if (~code.indexOf('\r')) {
    code = code.replace(/\r\n/g, '\n\n').replace(/\r/g, '\n')
  }
  re.lastIndex = lastIndex = 0

  while ((match = re.exec(code))) {

    let index = match.index
    let block = match[0]
    if (match[1] || match[2] || /['"`]/.test(block[0])) continue

    let comment = parser.parse(code, block, index)
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
  let result = {
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
    let oc = opts.comments

    if (oc && oc !== true) {
      for (var i = 0; i < oc.length; i++) {
        if (oc[i].test(str)) return true
      }
      oc = false
    }
    return oc
  }
}
