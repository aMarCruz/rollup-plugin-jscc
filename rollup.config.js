
import buble from 'rollup-plugin-buble'
import nodeResolve from 'rollup-plugin-node-resolve'

const external = [
  'magic-string',
  'rollup-pluginutils',
  'fs',
  'path'
]

export default {
  entry: './src/index.js',
  plugins: [
    buble(),
    nodeResolve({ jsnext: true })
  ],
  external: external,
  interop: false
}
