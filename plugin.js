'use strict';
var through = require('through2'),
  gulp = require('gulp-util'),
  PluginError = gulp.PluginError,
  xml = require('xml2js'),
  fs = require('fs'),
  extend = require('extend'),
  edge = require('edge'),
  path = require('path');

var PLUGIN_NAME = 'gulp-dnn-manifest';

module.exports = function (options) {

  // The config is taken from some defaults specified below with options supplied to this method which should be the package.json
  var defaults = {
    version: '01.00.00',
    dnnModule: {
      pathToScripts: './_Installation/SQL',
      pathToSupplementaryFiles: './_Installation',
      excludedPaths: ['node_modules', '_references']
    }
  }
  var config = extend({}, defaults, options || {});

  if (!config) {
    throw new PluginError(PLUGIN_NAME, 'No configuration specified.');
  }

  var stream = through.obj(function(file, enc, cb) {

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    if (file.isBuffer()) {

      // Get existing manifest (used for module template)
      gulp.log('Creating manifest from \'' + file.path + '\'...');
      var oldManifestXml = file.contents.toString();
      var parser = new xml.Parser();
      var oldManifest;
      parser.parseString(oldManifestXml, function(err, result) {
        oldManifest = result;
      });

      // Initialize manifest to write
      var manifest = {
        "dotnetnuke": {
          "$": {
            "version": "5.0",
            "type": "Package",
            "xmlns:fo": "http://www.w3.org/1999/XSL/Format"
          },
          "packages": [{
            "package": [{
              "$": {
                "name": config.dnnModule.packageName || oldManifest.dotnetnuke.packages[0].package[0].$.name,
                "type": "Module",
                "version": config.version || oldManifest.dotnetnuke.packages[0].package[0].$.version
              },
              "friendlyName": [
                config.dnnModule.friendlyName || oldManifest.dotnetnuke.packages[0].package[0].friendlyName[0]
              ],
              "description": [
                config.description || oldManifest.dotnetnuke.packages[0].package[0].description[0]
              ],
              "iconFile": [
                config.dnnModule.module.iconFile || oldManifest.dotnetnuke.packages[0].package[0].iconFile[0]
              ],
              "owner": [{
                "name": [
                  config.dnnModule.owner.name || oldManifest.dotnetnuke.packages[0].package[0].owner[0].name[0]
                ],
                "organization": [
                  config.dnnModule.owner.organization || oldManifest.dotnetnuke.packages[0].package[0].owner[0].organization[0]
                ],
                "url": [
                  config.dnnModule.owner.url || oldManifest.dotnetnuke.packages[0].package[0].owner[0].url[0]
                ],
                "email": [
                  config.dnnModule.owner.email || oldManifest.dotnetnuke.packages[0].package[0].owner[0].email[0]
                ]
              }],
              "azureCompatible": [
                config.dnnModule.module.azureCompatible || oldManifest.dotnetnuke.packages[0].package[0].azureCompatible[0]
              ]
            }]
          }]
        }
      };

      manifest = addDependencyNode(config, manifest);
      manifest = addLicenseAndReleaseNotes(config, manifest);

      // Components section
      manifest.dotnetnuke.packages[0].package[0].components = [];
      for (var i = 0; i < oldManifest.dotnetnuke.packages[0].package[0].components[0].component.length; i++) {
        var cType = oldManifest.dotnetnuke.packages[0].package[0].components[0].component[i].$.type;
        if (cType === "Module") {
          manifest.dotnetnuke.packages[0].package[0].components.push(oldManifest.dotnetnuke.packages[0].package[0].components[0].component[i])
        }
      }
      manifest = addResourceComponent(config, manifest);
      manifest = addAssemblyComponent(config, manifest);
      manifest = addScriptComponent(config, manifest);

      // Convert back to XML
      var builder = new xml.Builder();
      var x = builder.buildObject(manifest);
      file.contents = new Buffer(x);
    }

    this.push(file);
    cb();

  });

  return stream;
}

function addLicenseAndReleaseNotes(config, manifest) {
  if (fileExists(config.dnnModule.pathToSupplementaryFiles + '/License.txt')) {
    manifest.dotnetnuke.packages[0].package[0].license = [{
      "$": {
        "src": "License.txt"
      }
    }];
  }
  if (fileExists(config.dnnModule.pathToSupplementaryFiles + '/ReleaseNotes.txt')) {
    manifest.dotnetnuke.packages[0].package[0].releaseNotes = [{
      "$": {
        "src": "ReleaseNotes.txt"
      }
    }];
  }
  return manifest;
}

function fileExists(path) {
  try {
    stats = fs.lstatSync(path);
    return true;
  } catch (e) {
    return false;
  }
}

function addResourceComponent(config, manifest) {
  manifest.dotnetnuke.packages[0].package[0].components.push({
    "$": {
      "type": "ResourceFile"
    },
    "resourceFiles": [{
      "basePath": [
        "DesktopModules/" + config.dnnModule.module.folderName
      ],
      "resourceFile": [{
        "name": [
          "resources.zip"
        ]
      }]
    }]
  });
  return manifest;
}

function addDependencyNode(config, manifest) {
  var version = toNormalizedVersionString(getCoreReferenceVersion(config));
  if (version !== '00.00.00') {
    manifest.dotnetnuke.packages[0].package[0].dependencies = [{
      "dependency": [{
        "_": version,
        "$": {
          "type": "CoreVersion"
        }
      }]
    }];
  }
  return manifest;
}

function getCoreReferenceVersion(config) {
  var refVersion = {
    major: 0,
    minor: 0,
    build: 0
  };
  var files = fs.readdirSync("./bin");
  for (var i in files) {
    if (path.extname(files[i]) === ".dll") {
      var refs = getReferences('./bin/' + files[i], true);
      if (refs.DotNetNuke !== undefined) {
        refVersion = getLargestVersion(refVersion, refs.DotNetNuke);
      }
    }
  }
  return refVersion;
}

function getLargestVersion(baseVersion, testVersion) {
  if (typeof testVersion === 'string') {
    return getLargestVersion(baseVersion, getVersionObject(testVersion));
  } else {
    if (baseVersion.major > testVersion.major) {
      return baseVersion;
    } else if (baseVersion.major < testVersion.major) {
      return testVersion;
    } else {
      if (baseVersion.minor > testVersion.minor) {
        return baseVersion;
      } else if (baseVersion.minor < testVersion.minor) {
        return testVersion;
      } else {
        if (baseVersion.build > testVersion.build) {
          return baseVersion;
        } else if (baseVersion.build < testVersion.build) {
          return testVersion;
        } else {
          return baseVersion;
        }
      }
    }
  }
}

function getVersionObject(versionString) {
  var rgx = /(\d+)\.(\d+)\.(\d+)(\.\d+)?/;
  var m = rgx.exec(versionString);
  if (m) {
    return {
      major: parseInt(m[1]),
      minor: parseInt(m[2]),
      build: parseInt(m[3])
    }
  } else {
    return null;
  }
}

function toNormalizedVersionString(version) {
  return pad(version.major, 2) + '.' + pad(version.minor, 2) + '.' + pad(version.build, 2);
}

function pad(num, size) {
  var s = "000000000" + num;
  return s.substr(s.length - size);
}

var getReferences = edge.func({
  source: function(aFile) {
    /*
    using System.Reflection;
    using System.Linq;
    using System.Collections.Generic;

    async(aFile) => {
      var res = new Dictionary<string, string>();
      var ass = Assembly.LoadFrom((string) aFile);
      foreach (var an in ass.GetReferencedAssemblies() )
        {
          res.Add(an.Name, an.Version.ToString());
        }
      return res;
    }
  */
  }
});

var getAssemblyVersion = edge.func({
  source: function(aFile) {
    /*
      using System.Diagnostics;

      async(aFile) => {
        return FileVersionInfo.GetVersionInfo((string) aFile).FileVersion;
      }
    */
  }
});

function addAssemblyComponent(config, manifest) {

  var files = fs.readdirSync("./bin");

  if (files.length > 0) {
    var component = {
      "$": {
        "type": "Assembly"
      },
      "assemblies": [{
        "assembly": []
      }]
    }


    for (var i in files) {
      if (path.extname(files[i]) === ".dll") {
        var assembly = {
          "name": [
            files[i]
          ],
          "sourceFileName": [
            files[i]
          ],
          "version": [
            getAssemblyVersion('./bin/' + files[i], true)
          ]
        };
        component.assemblies[0].assembly.push(assembly);
      }
    }

    manifest.dotnetnuke.packages[0].package[0].components.push(component);
  }

  return manifest;

}

function addScriptComponent(config, manifest) {

  var files = fs.readdirSync(config.dnnModule.pathToScripts);

  if (files.length > 0) {
    var component = {
      "$": {
        "type": "Script"
      },
      "scripts": [{
        "basePath": ["DesktopModules/" + config.dnnModule.module.folderName],
        "script": []
      }]
    }

    var rgx = /(Install\.)?(\d\d)\.(\d\d)\.(\d\d)\.SqlDataProvider/;

    files.forEach(function(el, i, arr) {
      var m = rgx.exec(el);
      if (m) {
        var script = {
          "$": {
            "type": "Install"
          },
          "name": [el],
          "version": [m[2] + '.' + m[3] + '.' + m[4]]
        };
        component.scripts.push(script);
      }
      if (el == 'Uninstall.SqlDataProvider') {
        component.scripts.push({
          "$": {
            "type": "UnInstall"
          },
          "name": [el],
          "version": [config.version]
        });
      }
    });
    manifest.dotnetnuke.packages[0].package[0].components.push(component);
  }

  return manifest;

}

