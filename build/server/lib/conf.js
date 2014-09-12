// Generated by CoffeeScript 1.8.0
var conf, fs, old_conf, patch, readFile;

fs = require('fs');

conf = {};

old_conf = {};

patch = "0";

readFile = (function(_this) {
  return function(callback) {
    if (fs.existsSync('/etc/cozy/controller.json')) {
      return fs.readFile('/etc/cozy/controller.json', 'utf8', function(err, data) {
        try {
          console.log(data);
          data = JSON.parse(data);
          console.log(data);
          return callback(null, data);
        } catch (_error) {
          return callback("Error : Configuration files isn't a correct json");
        }
      });
    } else {
      return callback(null, {});
    }
  };
})(this);

module.exports.init = (function(_this) {
  return function(callback) {
    return readFile(function(err, data) {
      if (err != null) {
        return callback(err);
      } else {
        if (data.old != null) {
          old_conf = {
            dir_log: data.old.dir_log || false,
            dir_source: data.old.dir_source || false,
            file_stack: data.old.file_stack || false
          };
        }
        conf = {
          npm_registry: data.npm_registry || false,
          npm_strict_ssl: data.npm_strict_ssl || false,
          dir_log: data.dir_log || '/var/log/cozy',
          dir_source: data.dir_source || '/usr/local/cozy/apps',
          file_token: data.file_token || '/etc/cozy/stack.token',
          file_stack: data.file_stack || '/usr/local/cozy/apps/stack.json'
        };
        if (data.env != null) {
          conf.env = {
            global: data.env.global || false,
            data_system: data.env.data_system || false,
            home: data.env.home || false,
            proxy: data.env.proxy || false
          };
        }
        if (data.patch != null) {
          patch = data.patch;
        }
        return callback();
      }
    });
  };
})(this);

module.exports.get = (function(_this) {
  return function(arg) {
    return conf[arg];
  };
})(this);

module.exports.getOld = (function(_this) {
  return function(arg) {
    return old_conf[arg];
  };
})(this);

module.exports.patch = (function(_this) {
  return function(arg) {
    return patch;
  };
})(this);

module.exports.removeOld = (function(_this) {
  return function() {
    return fs.open("/etc/cozy/controller.json", 'w', function(err, fd) {
      return fs.write(fd, JSON.stringify(conf), 0, conf.length, 0, function() {});
    });
  };
})(this);
