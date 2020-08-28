import getPackageVersion from '@jsbits/get-package-version'

/**
 * @param {import('..').Options} options -
 * @returns {import('jscc').Options}
 */
const parseOptions = options => {
  options = Object.assign(
    {
      prefixes: [/\/[/*] ?/, /<!-- ?/],
    },
    options
  )

  options.values = Object.assign(
    {
      _VERSION: getPackageVersion(),
    },
    options.values
  )

  options.sourceMap = options.sourcemap !== false && options.sourceMap !== false

  return options
}

export default parseOptions
