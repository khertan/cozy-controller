// Generated by CoffeeScript 1.7.1
var exec, forever, fs, mixin, path, semver;

forever = require('forever-monitor');

fs = require('fs');

path = require('path');

semver = require('semver');

exec = require('child_process').exec;

mixin = require('flatiron').common.mixin;

module.exports.start = function(app, callback) {
  var carapaceBin, env, foreverOptions, onError, onExit, onPort, onRestart, onStart, onStderr, onStdout, onTimeout, process, responded, result, timeout, token, _ref;
  result = {};
  if ((_ref = app.name) === "home" || _ref === "proxy" || _ref === "data-system") {
    token = "test";
  } else {
    token = app.password;
  }
  env = {
    NAME: app.name,
    TOKEN: token,
    USER: app.user,
    USERNAME: app.user,
    SUDO_USER: app.user,
    HOME: app.userDir
  };
  foreverOptions = {
    fork: true,
    silent: true,
    max: 5,
    stdio: ['ipc', 'pipe', 'pipe'],
    cwd: app.dir,
    logFile: app.logFile,
    outFile: app.logFile,
    errFile: app.errFile,
    env: env,
    killTree: true,
    killTTL: 0,
    command: 'node'
  };
  if (!fs.existsSync(app.logFile)) {
    fs.openSync(app.logFile, 'w');
  }
  if (!fs.existsSync(app.errFile)) {
    fs.openSync(app.errFile, 'w');
  }
  foreverOptions.options = ['--plugin', 'net', '--plugin', 'setuid', '--setuid', app.user];
  if (app.server.slice(app.server.lastIndexOf("."), app.server.length) === ".coffee") {
    foreverOptions.options = foreverOptions.options.concat(['--plugin', 'coffee']);
  }
  fs.stat(app.startScript, (function(_this) {
    return function(err, stats) {
      if (err != null) {
        err = new Error("package.json error: can\'t find starting script: " + app.startScript);
        return callback(err);
      }
    };
  })(this));
  foreverOptions.options.push(app.startScript);
  carapaceBin = path.join(require.resolve('cozy-controller-carapace'), '..', '..', 'bin', 'carapace');
  process = new forever.Monitor(carapaceBin, foreverOptions);
  responded = false;
  onStdout = function(data) {
    return data = data.toString();
  };
  onStderr = function(data) {
    return data = data.toString();
  };
  onExit = (function(_this) {
    return function() {
      process.removeListener('error', onError);
      clearTimeout(timeout);
      console.log('callback on Exit');
      if (callback) {
        return callback(new Error("" + app.name + " CANT START"));
      } else {
        console.log("" + app.name + " HAS FAILLED TOO MUCH");
        return setTimeout((function() {
          return process.exit(1);
        }), 1);
      }
    };
  })(this);
  onError = (function(_this) {
    return function(err) {
      if (!responded) {
        err = err.toString();
        responded = true;
        callback(err);
        process.removeListener('exit', onExit);
        process.removeListener('message', onPort);
        return clearTimeout(timeout);
      }
    };
  })(this);
  onStart = (function(_this) {
    return function(monitor, data) {
      return result = {
        monitor: monitor,
        process: monitor.child,
        data: data,
        pid: monitor.childData.pid,
        pkg: app
      };
    };
  })(this);
  onRestart = function() {
    return console.log("" + app.name + ":restart");
  };
  onTimeout = (function(_this) {
    return function() {
      var err;
      process.removeListener('exit', onExit);
      process.stop();
      err = new Error('Error spawning drone');
      err.stdout = stdout.join('\n');
      err.stderr = stderr.join('\n');
      console.log('callback timeout');
      return callback(err);
    };
  })(this);
  onPort = (function(_this) {
    return function(info) {
      if (!responded && (info != null ? info.event : void 0) === 'port') {
        responded = true;
        result.port = info.data.port;
        callback(null, result);
        process.removeListener('exit', onExit);
        process.removeListener('error', onError);
        process.removeListener('message', onPort);
        return clearTimeout(timeout);
      }
    };
  })(this);
  process.start();
  timeout = setTimeout(onTimeout, 8000000);
  process.on('stdout', onStdout);
  process.on('stderr', onStderr);
  process.once('exit', onExit);
  process.once('error', onError);
  process.once('start', onStart);
  process.on('restart', onRestart);
  return process.on('message', onPort);
};
