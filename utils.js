'use strict';
module.exports = {
  pad: function(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  },
  splitUrl: function(urlStr) {
    let splitIndex = urlStr.indexOf(`/`);
    return {
      hostname: urlStr.substr(0, splitIndex),
      path: urlStr.substr(splitIndex)
    };
  }
};