/*
  @version v1.0
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
    console.log('This is a conditional, hidden block!');
    return code + '\n// go to https://github.com/aMarCruz/rollup-plugin-jscc and give your star!'
  }

  function jspp (options = {}) {

    var filter = function (id) {
      return id ? 1 + 2 : 1
    };

    return {
      // name for errors
      name: 'jspp',
      // comment
      run: function (code, id) {
        if (typeof code != 'string') {
          code = 'function () {\n};\n\n// jscc is cool!';
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbImJ1bmRsZS1zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOltudWxsXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBQ0E7QUFDQSxFQUFBO0FBQ0EsRUFBQTs7QUFFQSxFQUFBO0FBQ0EsRUFBQTs7QUFRQSxFQUFBO0FBQ0EsRUFBQSxTQUFTLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDeEIsRUFBQSxFQUFFLE9BQU8sSUFBSTtBQUNiLEVBQUEsQ0FBQzs7QUFFRCxFQUFBO0FBRUEsRUFBQSxTQUFTLFFBQVEsRUFBRSxJQUFJLEVBQUU7QUFDekIsRUFBQSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUMsQ0FBQTtBQUNyRCxFQUFBLEVBQUUsT0FBTyxJQUFJLEdBQUcsK0VBQXVDO0FBQ3ZELEVBQUEsQ0FBQzs7QUFPRCxBQUFlLEVBQUEsU0FBUyxJQUFJLEVBQUUsT0FBTyxHQUFHLEVBQUUsRUFBRTs7QUFFNUMsRUFBQSxFQUFFLElBQUksTUFBTSxHQUFHLFVBQVUsRUFBRSxFQUFFO0FBQzdCLEVBQUEsSUFBSSxPQUFPLEVBQUUsR0FBRyxDQUFNLEdBQUcsQ0FBQyxHQUFHLENBQU07QUFDbkMsRUFBQSxHQUFHLENBQUE7O0FBRUgsRUFBQSxFQUFFLE9BQU87QUFFVCxFQUFBO0FBQ0EsRUFBQSxJQUFJLElBQUksRUFBRSxNQUFNO0FBRWhCLEVBQUE7QUFDQSxFQUFBLElBQUksR0FBRyxFQUFFLFVBQVUsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUM3QixFQUFBLE1BQU0sSUFBSSxPQUFPLElBQUksSUFBSSxRQUFRLEVBQUU7QUFDbkMsRUFBQSxRQUFRLElBQUksR0FBRyx1Q0FBUSxDQUFBO0FBQ3ZCLEVBQUEsT0FBTztBQUNQLEVBQUEsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3ZCLEVBQUEsUUFBUSxPQUFPLElBQUk7QUFDbkIsRUFBQSxPQUFPO0FBQ1AsRUFBQSxNQUFNLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDN0MsRUFBQSxLQUFLO0FBQ0wsRUFBQSxHQUFHO0FBQ0gsRUFBQTtBQUNBLEVBQUEsQ0FBQzs7Ozs7In0=