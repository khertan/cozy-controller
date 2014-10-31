// Generated by CoffeeScript 1.8.0
var controller, exec, log, restartController, updateController;

controller = require('../lib/controller');

log = require('printit')();

exec = require('child_process').exec;

updateController = function(callback) {
  return exec("npm -g update cozy-controller", function(err, stdout) {
    if (err) {
      return callback(err);
    } else {
      return restartController(callback);
    }
  });
};

restartController = function(callback) {
  return exec("supervisorctl restart cozy-controller", function(err, stdout) {
    if (err) {
      return callback("This feature is available only if controller is managed" + " by supervisor");
    } else {
      log.info("Controller was successfully restarted.");
      return callback();
    }
  });
};


/*
    Install application.
        * Check if application is declared in body.start
        * if application is already installed, just start it
 */

module.exports.install = function(req, res, next) {
  var manifest;
  if (req.body.start == null) {
    res.send(400, {
      error: "Manifest should be declared in body.start"
    });
  }
  manifest = req.body.start;
  return controller.install(req.connection, manifest, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        "drone": {
          "port": result.port
        }
      });
    }
  });
};


/*
    Start application
        * Check if application is declared in body.start
        * Check if application is installed
        * Start application
 */

module.exports.start = function(req, res, next) {
  var manifest;
  if (req.body.start == null) {
    res.send(400, {
      error: "Manifest should be declared in body.start"
    });
  }
  manifest = req.body.start;
  return controller.start(manifest, function(err, result) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        "drone": {
          "port": result.port
        }
      });
    }
  });
};


/*
    Stop application
        * Check if application is installed
        * Stop application
 */

module.exports.stop = function(req, res, next) {
  var name;
  name = req.params.name;
  return controller.stop(name, function(err, result) {
    if (err != null) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};


/*
    Uninstall application
        * Check if application is installed
        * Uninstall application
 */

module.exports.uninstall = function(req, res, next) {
  var name;
  name = req.params.name;
  return controller.uninstall(name, function(err, result) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};


/*
    Update application
        * Check if application is installed
        * Update appplication
 */

module.exports.update = function(req, res, next) {
  var name;
  name = req.params.name;
  return controller.update(req.connection, name, function(err, result) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        "drone": {
          "port": result.port
        }
      });
    }
  });
};


/*
    Update application
        * Check if application is installed
        * Update appplication
 */

module.exports.updateStack = function(req, res, next) {
  return controller.update(req.connection, 'data-system', function(err, result) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return controller.update(req.connection, 'proxy', function(err, result) {
        if (err) {
          log.error(err.toString());
          return res.send(400, {
            error: err.toString()
          });
        } else {
          return controller.update(req.connection, 'home', function(err, result) {
            if (err) {
              log.error(err.toString());
              return res.send(400, {
                error: err.toString()
              });
            } else {
              return updateController(function(err) {
                if (err) {
                  log.error(err.toString());
                  return res.send(400, {
                    error: err.toString()
                  });
                } else {
                  return res.send(200, {});
                }
              });
            }
          });
        }
      });
    }
  });
};


/*
    Reboot controller
 */

module.exports.restartController = function(req, res, next) {
  return restartController(function(err) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {});
    }
  });
};


/*
    Return a list with all applications
 */

module.exports.all = function(req, res, next) {
  return controller.all(function(err, result) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};


/*
    Return a list with all started applications
 */

module.exports.running = function(req, res, next) {
  return controller.running(function(err, result) {
    if (err) {
      log.error(err.toString());
      return res.send(400, {
        error: err.toString()
      });
    } else {
      return res.send(200, {
        app: result
      });
    }
  });
};
