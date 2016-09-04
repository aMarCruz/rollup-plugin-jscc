/**
 * rollup-plugin-jspp entry point
 * @module
 */
import CodeParser from './codeparser'
import blankBlock from './blankblock'
import RE from './regexes'

const QBLOCKS = RegExp([
  RE.MLCOMMS.source,                  // --- multi-line comment
  RE.SLCOMMS.source,                  // --- single-line comment
  RE.HTMLCOMMS.source,                // --- html multi-line comment
  RE.STRINGS.source,                  // --- string, don't care about embedded eols
  RE.DIVISOR.source,                  // $1: division operator
  RE.REGEXES.source                   // $2: last slash of regex
].join('|'), 'gm')


export default function preproc (code, filename, options) {

  let parser = new CodeParser(options)
  let cache  = []
  let output = true

  let re = QBLOCKS
  let lastIndex
  let match

  if (~code.indexOf('\r')) {
    code = code.replace(/\r\n/g, ' \n').replace(/\r/g, '\n')
  }
  re.lastIndex = lastIndex = 0

  while ((match = re.exec(code))) {

    let index = match.index
    let block = match[0]
    if (match[1] || match[2] || /['"`]/.test(block[0])) continue

    let comment = parser.parse(code, block, index)
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
    let oc = options.comments

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
