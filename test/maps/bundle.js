/*
 plugin version 1.0
*/
var myapp = (function () {
  'use strict';

  /*
    Testing sourcemaps with the jscc plugin.
    https://github.com/aMarCruz/rollup-plugin-jscc

    @license: MIT
  */

  /* dummy */
  function preproc (code) {
    return code
  }

  /* conditional "compilation" */
  function postproc (code) {
    console.log('This is a conditional, hidden block!')
    return code + '\n// go to https://github.com/aMarCruz/rollup-plugin-jscc and give your star!'
  }

  function jspp (options = {}) {

    var filter = function (id) {
      return id ? 1 + 2 : 1
    }

    return {
      // name for errors
      name: 'jspp',
      // comment
      run: function (code, id) {
        if (typeof code != 'string') {
          code = 'function () {\n};\n\n// jscc is cool!'
        }
        if (!filter(id)) {
          return null
        }
        return postproc(preproc(code, options))
      }
    }
    //#end
  }

  return jspp;

}());
/* follow me on Twitter! @amarcruz */

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbImJ1bmRsZS1zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOltudWxsXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBQ0E7QUFDQSxFQUFBO0FBQ0EsRUFBQTs7QUFFQSxFQUFBO0FBQ0EsRUFBQTs7QUFRQSxFQUFBO0FBQ0EsRUFBQSxTQUFTLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDeEIsRUFBQSxFQUFFLE9BQU8sSUFBSTtBQUNiLEVBQUEsQ0FBQzs7QUFFRCxFQUFBO0FBRUEsRUFBQSxTQUFTLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDekIsRUFBQSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUM7QUFDckQsRUFBQSxFQUFFLE9BQU8sSUFBSSxHQUFHLCtFQUF1QztBQUN2RCxFQUFBLENBQUM7O0FBT0QsQUFBZSxFQUFBLFNBQVMsSUFBSSxFQUFFLE9BQU8sR0FBRyxFQUFFLEVBQUU7O0FBRTVDLEVBQUEsRUFBRSxJQUFJLE1BQU0sR0FBRyxVQUFVLEVBQUUsRUFBRTtBQUM3QixFQUFBLElBQUksT0FBTyxFQUFFLEdBQUcsQ0FBTSxHQUFHLENBQUMsR0FBRyxDQUFNO0FBQ25DLEVBQUEsR0FBRzs7QUFFSCxFQUFBLEVBQUUsT0FBTztBQUVULEVBQUE7QUFDQSxFQUFBLElBQUksSUFBSSxFQUFFLE1BQU07QUFFaEIsRUFBQTtBQUNBLEVBQUEsSUFBSSxHQUFHLEVBQUUsVUFBVSxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQzdCLEVBQUEsTUFBTSxJQUFJLE9BQU8sSUFBSSxJQUFJLFFBQVEsRUFBRTtBQUNuQyxFQUFBLFFBQVEsSUFBSSxHQUFHLHVDQUFRO0FBQ3ZCLEVBQUEsT0FBTztBQUNQLEVBQUEsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3ZCLEVBQUEsUUFBUSxPQUFPLElBQUk7QUFDbkIsRUFBQSxPQUFPO0FBQ1AsRUFBQSxNQUFNLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDN0MsRUFBQSxLQUFLO0FBQ0wsRUFBQSxHQUFHO0FBQ0gsRUFBQTtBQUNBLEVBQUEsQ0FBQzs7Ozs7In0=