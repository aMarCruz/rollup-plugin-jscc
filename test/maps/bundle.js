/*
 plugin version 1.0
*/
var jspp = (function () {
  'use strict';

  function preproc (code) {
    return code
  }
  function postproc (code) {
    return code
  }
  function jspp (options = {}) {
    var filter = function (id) {
      return 1
    }
    return {
      transform: function (code, id) {
        if (typeof code != 'string') {
          code = 'function () {\n};\n// jspp2 is cool!'
        }
        if (!filter(id)) {
          return null
        }
        return postproc(preproc(code, options))
      }
    }
  }

  return jspp;

}());
/* follow me on Twitter! @amarcruz */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbImJ1bmRsZS1zcmMuanMiXSwic291cmNlc0NvbnRlbnQiOltudWxsXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0VBU0EsU0FBUyxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBQ3hCLEVBQUEsRUFBRSxPQUFPLElBQUk7QUFDYixFQUFBLENBQUM7QUFFRCxFQUFBLFNBQVMsUUFBUSxFQUFFLElBQUksRUFBRTtBQUN6QixFQUFBLEVBQUUsT0FBTyxJQUFJO0FBQ2IsRUFBQSxDQUFDO0FBRUQsQUFBZSxFQUFBLFNBQVMsSUFBSSxFQUFFLE9BQU8sR0FBRyxFQUFFLEVBQUU7QUFFNUMsRUFBQSxFQUFFLElBQUksTUFBTSxHQUFHLFVBQVUsRUFBRSxFQUFFO0FBQzdCLEVBQUEsSUFBSSxPQUFPLENBQXFCLEFBQU87QUFDdkMsRUFBQSxHQUFHO0FBRUgsRUFBQSxFQUFFLE9BQU87QUFNVCxFQUFBLElBQUksU0FBUyxFQUFFLFVBQVUsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNuQyxFQUFBLE1BQU0sSUFBSSxPQUFPLElBQUksSUFBSSxRQUFRLEVBQUU7QUFDbkMsRUFBQSxRQUFRLElBQUksR0FBRyxzQ0FBUTtBQUN2QixFQUFBLE9BQU87QUFDUCxFQUFBLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN2QixFQUFBLFFBQVEsT0FBTyxJQUFJO0FBQ25CLEVBQUEsT0FBTztBQUNQLEVBQUEsTUFBTSxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdDLEVBQUEsS0FBSztBQUNMLEVBQUEsR0FBRztBQUVILEVBQUEsQ0FBQzs7Ozs7In0=