/*
  Testing sourcemaps
  @license: MIT
*/

/* eslint-disable no-undef */
/* global $__TEST */
//#set __TEST 1
//#set __DEBUG 1
//#set __CODE 'function () {\\n};\\n// jspp2 is cool!'

/* dummy */
function preproc (code) {
  return code
}

/* conditional "compilation" */
/*#if __DEBUG
function postproc (code) {
  console.log('This is a conditional, hidden block!')
  return code + ' (DEBUG)'
}
//#else */
function postproc (code) {
  return code
}
//#endif

export default function jspp (options = {}) {

  var filter = function (id) {
    return id || $__TEST ? $__TEST : true
  }

  return {
//#if __DEBUG
    // name for errors
    name: 'jspp',
//#endif
    // comment
    run: function (code, id) {
      if (typeof code != 'string') {
        code = '$__CODE'
      }
      if (!filter(id)) {
        return null
      }
      return postproc(preproc(code, options))
    }
  }
  // end
}
