/**
 * @module regexlist
 */

// name=value in directives - $1:name, $2:value (including any comment)
export const VARPAIR = /^\s*(_[0-9A-Z][_0-9A-Z]*)\s*=?(.*)/

// to verify valid varnames and for #unset
export const VARNAME = /^_[0-9A-Z][_0-9A-Z]*$/

// prefixing varnames inside expression with `this.` or `global.`
export const EVLVARS = /(^|[^$\w\.])(_[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/g

// replace varnames inside the code from $_VAR.prop to value
export const REPVARS = /(?:(\$_[0-9A-Z][_0-9A-Z]*)(\.[\w]+)?)(?=[\W]|$)/g

// matches single and double quoted strings, take care about embedded eols
export const STRINGS = /"[^"\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^"\n\r\\]*)*"|'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/g
