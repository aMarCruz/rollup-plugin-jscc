/*
  This polyfill doesn't support symbol properties, since ES5 doesn't have symbols anyway.
*/
if (typeof Object.assign != 'function') {
  Object.assign = function (dest) {
    if (dest == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }
    var arg = arguments
    var has = Object.prototype.hasOwnProperty

    dest = Object(dest)
    for (var ix = 1; ix < arg.length; ix++) {
      var src = arg[ix]
      if (src) {
        for (var key in src) {
          if (has.call(src, key)) dest[key] = src[key]
        }
      }
    }
    return dest
  }
}

export default Object.assign
