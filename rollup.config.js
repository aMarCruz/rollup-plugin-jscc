const nodeResolve = require('rollup-plugin-node-resolve')
const pkg = require('./package.json')

const external = Object.keys(pkg.dependencies).concat(['fs', 'path'])
const banner = `/**
 * rollup-plugin-jscc v${pkg.version}
 * @license ${pkg.license}
 */
/* eslint-disable */`

export default {
  input: './src/index.js',
  plugins: [
    nodeResolve(),
  ],
  external,
  output: {
    banner,
    file: './index.js',
    format: 'cjs',
    interop: false,
    sourcemap: true,
  },
}
