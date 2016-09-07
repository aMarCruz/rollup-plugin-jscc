
import { STRINGS, DIVISOR, REGEXES, EVLVARS } from './revars'

// For replacing of jspreproc variables (#set)
const _REPVARS = RegExp(
    STRINGS.source + '|' +
    DIVISOR.source + '|' +
    REGEXES.source + '|' +     // $1 can have '/'
    EVLVARS.source,            // $2 = prefix, $3 = var name
  'g')

/**
 * Method to perform the evaluation of the received string using
 * a function instantiated dynamically.
 *
 * @param   {string} str - String to evaluate, can include other defined vars
 * @param   {object} ctx - Set of variable definitions
 * @returns {any}          The result.
 */
export default function evalExpr (str, ctx) {

  // var replacement
  function _repVars (m, _, p, v) {
    return v
      ? p + (v in ctx ? 'this.' + v : v in global ? 'global.' + v : 'undefined')
      : m
  }

  let expr = str
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(_REPVARS, _repVars)

  let result

  try {
    // eslint-disable-next-line no-new-func
    let fn = new Function('', 'return (' + expr + ');')
    result = fn.call(ctx)
  } catch (e) {
    console.error(`In expression: ${ expr }`)  // eslint-disable-line no-console
    throw e
  }

  return result
}
