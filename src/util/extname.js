export default function extname (s) {
  const match = /(?!\.\/\\|\.\.)[^/\\](\.[^./\\]*)$/.exec(s)
  return match ? match[1] : ''
}
