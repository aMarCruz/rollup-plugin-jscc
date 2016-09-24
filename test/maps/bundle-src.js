//#set _REPO = 'https://github.com/aMarCruz/rollup-plugin-jscc'
/*
  Testing sourcemaps with the jscc plugin.
  $_REPO

  @license: MIT
*/
//#if 0 // hide `global` from the processed code
/* global $_TEST */
//#endif
//#set _TEST 1
//#set _DEBUG 1
//#set _CODE 'function () {\\n};\\n\\n// jscc is cool!'

/* dummy */
function preproc (code) {
  return code
}

/* conditional "compilation" */
/*#if _DEBUG
function postproc (code) {
  console.log('This is a conditional, hidden block!')
  return code + '\n// go to $_REPO and give your star!'
}
//#else //*/
function postproc (code) {
  return code
}
//#endif

export default function jspp (options = {}) {

  var filter = function (id) {
    return id ? $_TEST + 2 : $_TEST
  }

  return {
//#if _DEBUG
    // name for errors
    name: 'jspp',
//#endif
    // comment
    run: function (code, id) {
      if (typeof code != 'string') {
        code = '$_CODE'
      }
      if (!filter(id)) {
        return null
      }
      return postproc(preproc(code, options))
    }
  }
  //#end
}
