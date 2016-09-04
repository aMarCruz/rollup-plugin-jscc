/*

  Testing sourcemaps

*/
/* eslint-disable no-undef */
//#set __TEST 1
//#set __CODE 'function () {\\n};\\n// jspp2 is cool!'

function preproc (code) {
  return code
}

function postproc (code) {
  return code
}

export default function jspp (options = {}) {

  var filter = function (id) {
    return id || __TEST ? __TEST : true
  }

  return {
//#if __DEBUG
    // name for errors
    name: 'jspp',
//#endif
    // comment
    transform: function (code, id) {
      if (typeof code != 'string') {
        code = '__CODE'
      }
      if (!filter(id)) {
        return null
      }
      return postproc(preproc(code, options))
    }
  }
  // end
}
