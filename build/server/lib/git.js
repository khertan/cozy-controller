// Generated by CoffeeScript 1.10.0
var compareVersions, conf, exec, executeUntilEmpty, log, onBadGitUrl, onWrongGitUrl, path, request;

path = require('path');

request = require('request');

compareVersions = require('mozilla-version-comparator');

exec = require('child_process').exec;

executeUntilEmpty = require('../helpers/executeUntilEmpty');

conf = require('./conf').get;

log = require('printit')({
  prefix: 'lib:git'
});


/*
    Clean up current modification if the Git URL is wrong
 */

onWrongGitUrl = function(app, done) {
  var err;
  err = new Error("Invalid Git url: " + app.repository.url);
  err.code = 0;
  return exec("rm -rf " + app.appDir, {}, function() {
    return done(err);
  });
};


/*
    Clean up current modification if the Git URL is wrong
 */

onBadGitUrl = function(app, done) {
  return request.get('https://github.com', function(err, res, body) {
    if ((res != null ? res.statusCode : void 0) !== 200) {
      err = new Error("Can't access to github");
      err.code = 1;
      return exec("rm -rf " + app.appDir, {}, function() {
        return done(err);
      });
    } else {
      err = new Error("Can't access to git url: " + app.repository.url);
      err.code = 0;
      return exec("rm -rf " + app.appDir, {}, function() {
        return done(err);
      });
    }
  });
};


/*
    Initialize repository of <app>
        * Check if git URL exist
            * URL isn't a Git URL
            * repo doesn't exist in github
        * Clone repo (with one depth)
        * Change branch if necessary
        * Init submodule
 */

module.exports.init = function(app, callback) {
  var match, url;
  url = app.repository.url;
  match = url.match(/\/([\w\-_\.]+)\.git$/);
  if (!match) {
    return onWrongGitUrl(app, callback);
  } else {
    return exec('git --version', function(err, stdout, stderr) {
      var gitVersion, repoUrl;
      gitVersion = stdout.match(/git version ([\d\.]+)/);
      repoUrl = url.substr(0, url.length - 4);
      return request.get(repoUrl, function(err, res, body) {
        var branch, commands, config;
        if ((res != null ? res.statusCode : void 0) !== 200) {
          return onBadGitUrl(app, callback);
        } else {
          commands = [];
          branch = app.repository.branch || "master";
          if ((gitVersion == null) || compareVersions("1.7.10", gitVersion[1]) === 1) {
            commands = ["git clone " + url + " " + app.name, "cd " + app.dir];
            if (branch !== 'master') {
              commands.push("git branch " + branch + " origin/" + branch);
              commands.push("git checkout " + branch);
            }
          } else {
            commands = ["git clone " + url + " --depth 1 --branch " + branch + " --single-branch " + app.name, "cd " + app.dir];
          }
          commands.push("git submodule update --init --recursive");
          config = {
            cwd: conf('dir_app_bin'),
            user: app.user
          };
          return executeUntilEmpty(commands, config, (function(_this) {
            return function(err) {
              if (err != null) {
                log.error(err);
                log.info('Retry to init repository');
                return executeUntilEmpty(commands, config, callback);
              } else {
                return callback();
              }
            };
          })(this));
        }
      });
    });
  }
};


/*
    Update repository of <app>
        * Reset current changes (due to chmod)
        * Pull changes
        * Update submodule
 */

module.exports.update = function(app, callback) {
  var branch, commands, config;
  branch = app.repository.branch || app.branch || "master";
  commands = ["git reset --hard ", "git pull origin " + branch, "git submodule update --recursive"];
  config = {
    cwd: app.dir,
    env: {
      "USER": app.user
    }
  };
  return executeUntilEmpty(commands, config, callback);
};


/*
    Change branch of <app>
 */

module.exports.changeBranch = function(app, newBranch, callback) {
  var commands, config;
  commands = ["git fetch origin " + newBranch + ":" + newBranch, "git checkout " + newBranch];
  config = {
    cwd: app.dir,
    env: {
      "USER": app.user
    }
  };
  return executeUntilEmpty(commands, config, callback);
};
