
import MagicString from 'magic-string'
import RE from './regexes'

const _MULTILINES = /[ \t]*\n\s*$/.source
const _ONELINE = /(?:[ \t]+$)/.source

/*
    Matched result is $1:prefix, $2:varname, $3:lines
 */
function makeRegex (values, lines) {
  let list = RE.reVarList(values)

  if (lines >= 0) list += `|(${ _MULTILINES })`

  return new RegExp(`${ list }|${ _ONELINE }`, 'gm')
}

function limitLines (block, lines) {
  return lines > 0 ? block.replace(/[^\n]+/g, '').slice(0, lines) : ''
}


export default function postproc (code, opts) {

  // @TODO: Optimize for maxEmptyLines -1
  const magicString = new MagicString(code)
  const maxLines = opts.maxEmptyLines < 0 ? 0xffff : opts.maxEmptyLines
  const regex = makeRegex(opts.values, maxLines)

  let match, block, repstr, changes

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
    let result = { code: magicString.toString() }
    if (opts.sourceMap) {
      result.map = magicString.generateMap({ hires: true })
    }
    return result
  }

  return code

  function replaceBlock (_block, start, _str) {
    if (_block === _str) return false
    let end = start + _block.length
    magicString.overwrite(start, end, _str)
    return true
  }
}
