// Generated by CoffeeScript 1.8.0
var App, drones, fs, installDependencies, npm, repo, running, spawner, stack, stackApps, startApp, stopApp, stopApps, type, user,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

fs = require('fs');

spawner = require('./spawner');

npm = require('./npm');

repo = require('./repo');

user = require('./user');

stack = require('./stack');

type = [];

type['git'] = require('./git');

App = require('./app').App;

drones = [];

running = [];

stackApps = ['home', 'data-system', 'proxy'];


/*
    Start Application <app>
        * check if application isn't started
        * start process
        * add application in drones and running
 */

startApp = (function(_this) {
  return function(app, callback) {
    if (running[app.name] != null) {
      return callback('Application already exists');
    } else {
      return spawner.start(app, function(err, result) {
        if (err != null) {
          return callback(err);
        } else if (result == null) {
          err = new Error('Unknown error from Spawner.');
          return callback(err);
        } else {
          drones[app.name] = result.pkg;
          running[app.name] = result;
          return callback(null, result);
        }
      });
    }
  };
})(this);


/*
    Stop all applications in tab <apps>
 */

stopApps = function(apps, callback) {
  var app;
  if (apps.length > 0) {
    app = apps.pop();
    return stopApp(app, function() {
      console.log("" + app + ":stop application");
      return stopApps(apps, callback);
    });
  } else {
    return callback();
  }
};


/*
    Stop application <name>
        * Stop process
        * Catch event exit (or error)
        * Delete application in running
 */

stopApp = (function(_this) {
  return function(name, callback) {
    var err, monitor, onErr, onStop;
    monitor = running[name].monitor;
    onStop = function() {
      monitor.removeListener('error', onErr);
      monitor.removeListener('exit', onStop);
      monitor.removeListener('stop', onStop);
      delete running[name];
      return callback(null, name);
    };
    onErr = function(err) {
      monitor.removeListener('stop', onStop);
      monitor.removeListener('exit', onStop);
      return callback(err, name);
    };
    monitor.once('stop', onStop);
    monitor.once('exit', onStop);
    monitor.once('error', onErr);
    try {
      return monitor.stop();
    } catch (_error) {
      err = _error;
      console.log(err);
      callback(err, name);
      return onErr(err);
    }
  };
})(this);


/*
    Install depdencies of application <app> <test> times
        * Try to install dependencies (npm install)
        * If installation return an error, try again (if <test> isnt 0)
 */

installDependencies = (function(_this) {
  return function(app, test, callback) {
    test = test - 1;
    return npm.install(app, function(err) {
      if ((err != null) && test === 0) {
        return callback(err);
      } else if (err != null) {
        return installDependencies(app, test, callback);
      } else {
        return callback();
      }
    });
  };
})(this);


/*
    Remove application <name> from running
        Userfull if application exit with timeout
 */

module.exports.removeRunningApp = (function(_this) {
  return function(name) {
    return delete running[name];
  };
})(this);


/*
    Install applicaton defineed by <manifest>
        * Check if application isn't already installed
        * Create user cozy-<name> if necessary
        * Create application repo for source code
        * Clone source in repo
        * Install dependencies
        * If application is a stack application, add application in stack.json
        * Start process
 */

module.exports.install = (function(_this) {
  return function(manifest, callback) {
    var app;
    app = new App(manifest);
    app = app.app;
    if ((drones[app.name] != null) || fs.existsSync(app.dir)) {
      console.log("" + app.name + ":already installed");
      console.log("" + app.name + ":start application");
      return startApp(app, callback);
    } else {
      return user.create(app, function() {
        console.log("" + app.name + ":create directory");
        return repo.create(app, function(err) {
          if (err != null) {
            callback(err);
          }
          console.log("" + app.name + ":git clone");
          return type[app.repository.type].init(app, function(err) {
            if (err != null) {
              return callback(err);
            } else {
              console.log("" + app.name + ":npm install");
              return installDependencies(app, 2, function(err) {
                var _ref;
                if (err != null) {
                  return callback(err);
                } else {
                  console.log("" + app.name + ":start application");
                  if (_ref = app.name, __indexOf.call(stackApps, _ref) >= 0) {
                    stack.addApp(app, function(err) {
                      return console.log(err);
                    });
                  }
                  drones[app.name] = app;
                  return startApp(app, callback);
                }
              });
            }
          });
        });
      });
    }
  };
})(this);


/*
    Start aplication defined by <manifest>
        * Check if application is installed
        * Start process
 */

module.exports.start = function(manifest, callback) {
  var app, err;
  app = new App(manifest);
  app = app.app;
  if ((drones[app.name] != null) || fs.existsSync(app.dir)) {
    return startApp(app, (function(_this) {
      return function(err, result) {
        if (err != null) {
          return callback(err);
        } else {
          return callback(null, result);
        }
      };
    })(this));
  } else {
    err = new Error('Cannot start an application not installed');
    return callback(err);
  }
};


/*
    Stop application <name>
        * Check if application is started
        * Stop process
 */

module.exports.stop = function(name, callback) {
  var err;
  if (running[name] != null) {
    return stopApp(name, callback);
  } else {
    err = new Error('Cannot stop an application not started');
    return callback(err);
  }
};


/*
    Stop all started applications
        Usefull when controller is stopped
 */

module.exports.stopAll = function(callback) {
  return stopApps(Object.keys(running), callback);
};


/*
    Uninstall application <name>
        * Check if application is installed
        * Stop application if appplication is started
        * Remove from stack.json if application is a stack application
        * Remove code source
        * Delete application from drones (and running if necessary)
 */

module.exports.uninstall = function(name, callback) {
  var app, err;
  if (drones[name] != null) {
    if (running[name] != null) {
      console.log("" + name + ":stop application");
      running[name].monitor.stop();
      delete running[name];
    }
    if (__indexOf.call(stackApps, name) >= 0) {
      console.log("" + name + ":remove from stack.json");
      stack.removeApp(name, function(err) {
        return console.log(err);
      });
    }
    app = drones[name];
    return repo["delete"](app, (function(_this) {
      return function(err) {
        console.log("" + name + ":delete directory");
        if (drones[name] != null) {
          delete drones[name];
        }
        if (err) {
          callback(err);
        }
        return callback(null, name);
      };
    })(this));
  } else {
    err = new Error('Cannot uninstall an application not installed');
    return callback(err);
  }
};


/*
    Update an application <name>
        * Check if application is installed
        * Stop application if application is started
        * Update code source (git pull / npm install)
        * Restart application if it was started
 */

module.exports.update = function(name, callback) {
  var app, err, restart;
  if (drones[name] != null) {
    restart = false;
    if (running[name] != null) {
      console.log("" + name + ":stop application");
      stopApp(name, callback);
      restart = true;
    }
    app = drones[name];
    console.log("" + name + ":update application");
    return type[app.repository.type].update(app, (function(_this) {
      return function(err) {
        if (err != null) {
          return callback(err);
        } else {
          return installDependencies(app, 2, function(err) {
            if (err != null) {
              return callback(err);
            } else {
              if (restart) {
                return startApp(app, function(err, result) {
                  console.log("" + name + ":start application");
                  if (err != null) {
                    callback(err);
                  }
                  return callback(null, result);
                });
              } else {
                return callback(null, app);
              }
            }
          });
        }
      };
    })(this));
  } else {
    err = new Error('Application is not installed');
    console.log(err);
    return callback(err);
  }
};


/*
    Add application <app> in drone
        Usefull for autostart
 */

module.exports.addDrone = function(app, callback) {
  drones[app.name] = app;
  return callback();
};


/*
    remove drones
        Usefull for tests
 */

module.exports.removeDrones = function(callback) {
  drones = [];
  running = [];
  return callback();
};


/*
    Return all applications (started or stopped)
 */

module.exports.all = function(callback) {
  return callback(null, drones);
};


/*
    Return all started applications
 */

module.exports.running = function(callback) {
  var app, apps, _i, _len;
  apps = [];
  for (_i = 0, _len = drones.length; _i < _len; _i++) {
    app = drones[_i];
    if (running[app.name] != null) {
      apps[app.name] = app;
    }
  }
  return callback(null, apps);
};
