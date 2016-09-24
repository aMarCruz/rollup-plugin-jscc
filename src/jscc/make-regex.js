
// These characters have to be escaped.
const R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g

// Matches a line with a directive, not including line-ending
const S_RE_BASE = /^(?:(?![\r\n])\s*)?(?:@)#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?:(?=\s)(.*)|\/{3}.*)?$/.source

// Default opennig sequence of directives is ['//', '/*']
const S_DEFAULT = '//|/\\*'

export default function makeRegex (options) {
  let list = options.prefixes

  if (list) list = list.map(s => s.replace(R_ESCAPED, '\\')).join('|')
  else list = S_DEFAULT

  list = S_RE_BASE.replace('@', list)
  return RegExp(list, 'gm')
}
