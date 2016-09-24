
var buble = require('rollup-plugin-buble')
var nodeResolve = require('rollup-plugin-node-resolve')
var external = [
  'magic-string',
  'rollup-pluginutils',
  'fs',
  'path'
]

module.exports = {
  entry: 'src/index.js',
  plugins: [
    buble(),
    nodeResolve({ jsnext: true })
  ],
  external: external
}
