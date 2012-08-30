var fs    = require('fs');

var requireAll = function (options) {
  var files   = fs.readdirSync(options.dirname);
  var modules = {};

  files.forEach(function(file) {
    var filepath = options.dirname + '/' + file;
    if (fs.statSync(filepath).isDirectory()) {
      modules[file] = requireAll({
        dirname: filepath,
        filter: options.filter
      });

    } else {
      var match = file.match(options.filter);
      if (!match) return;

      modules[match[1]] = require(filepath);
    }
  });

  return modules;
};


var Elements = module.exports = requireAll({
  dirname : __dirname,
  filter  : /([A-Z].+)\.js$/,
});
