/**
 * @module regexes
 *
 * Shared regexes
 */

export default {
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
  reVarList (values) {
    let list = Object.keys(values).map(v => v.slice(2)).join('|')
    return this.VARLIST.replace('@', list)
  }
}
