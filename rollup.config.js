
var buble = require('rollup-plugin-buble')
var nodeResolve = require('rollup-plugin-node-resolve')
var external = ['fs', 'path']

module.exports = {
  entry: 'src/index.js',
  plugins: [
    buble(),
    nodeResolve({ jsnext: true, skip: ['magic-string', 'rollup-pluginutils'] })
  ],
  external: external
}
