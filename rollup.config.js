import nodeResolve from '@rollup/plugin-node-resolve'
import pkg from './package.json'

const external = Object.keys(pkg.dependencies).concat(['fs', 'path'])
const banner = `/**
 * rollup-plugin-jscc v${pkg.version}
 * @license ${pkg.license}
 */
/* eslint-disable */`

export default {
  input: pkg.source,
  plugins: [nodeResolve()],
  external,
  output: {
    banner,
    file: pkg.main,
    format: 'cjs',
    exports: 'auto',
    interop: false,
    preferConst: true,
    sourcemap: true,
  },
}
