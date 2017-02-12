'use strict';
var fs = require('fs'),
    edge = require('edge'),
    path = require('path');

module.exports = {

    addLicenseAndReleaseNotes: function (config, manifest) {
        if (this.fileExists(config.dnn.pathToSupplementaryFiles + '/License.txt')) {
            manifest.package[0].license = [{
                "$": {
                    "src": "License.txt"
                }
            }];
        }
        if (this.fileExists(config.dnn.pathToSupplementaryFiles + '/ReleaseNotes.txt') | this.fileExists(config.dnn.pathToSupplementaryFiles + '/ReleaseNotes.md')) {
            manifest.package[0].releaseNotes = [{
                "$": {
                    "src": "ReleaseNotes.txt"
                }
            }];
        }
        return manifest;
    },

    addDependencyNode: function (config, manifest) {
        var version = config.dnn.dnnDependency;
        if (version == undefined) {
            version = this.toNormalizedVersionString(this.getCoreReferenceVersion(config));
        }
        if (version !== '00.00.00') {
            manifest.package[0].dependencies = [{
                "dependency": [{
                    "_": version,
                    "$": {
                        "type": "CoreVersion"
                    }
                }]
            }];
        }
        return manifest;
    },

    addResourceComponent: function (config, manifest, basePath, fileName) {
        if (basePath == undefined) { basePath = "DesktopModules/" + config.dnn.folder }
        if (fileName == undefined) { fileName = "resources.zip" }
        manifest.package[0].components[0].component.push({
            "$": {
                "type": "ResourceFile"
            },
            "resourceFiles": [{
                "basePath": [
                    basePath
                ],
                "resourceFile": [{
                    "name": [
                        fileName
                    ]
                }]
            }]
        });
        return manifest;
    },

    addAssemblyComponent: function (config, manifest) {

        var files = fs.readdirSync(config.dnn.pathToAssemblies);

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
                            this.getAssemblyVersion(config.dnn.pathToAssemblies + '/' + files[i], true)
                        ]
                    };
                    component.assemblies[0].assembly.push(assembly);
                }
            }

            manifest.package[0].components[0].component.push(component);
        }

        return manifest;

    },

    addScriptComponent: function (config, manifest) {

        var files = fs.readdirSync(config.dnn.pathToScripts);

        if (files.length > 0) {
            var component = {
                "$": {
                    "type": "Script"
                },
                "scripts": [{
                    "basePath": ["DesktopModules/" + config.dnn.folder],
                    "script": []
                }]
            }

            var rgx = /(Install\.)?(\d\d)\.(\d\d)\.(\d\d)\.SqlDataProvider/;

            files.forEach(function (el, i, arr) {
                var m = rgx.exec(el);
                if (m) {
                    var script = {
                        "$": {
                            "type": "Install"
                        },
                        "name": [el],
                        "version": [m[2] + '.' + m[3] + '.' + m[4]]
                    };
                    component.scripts[0].script.push(script);
                }
                if (el == 'Uninstall.SqlDataProvider') {
                    component.scripts[0].script.push({
                        "$": {
                            "type": "UnInstall"
                        },
                        "name": [el],
                        "version": [config.version]
                    });
                }
            });
            manifest.package[0].components[0].component.push(component);
        }

        return manifest;

    },

    addCleanupComponents: function (config, manifest) {

        var files = fs.readdirSync(config.dnn.pathToSupplementaryFiles);

        if (files.length > 0) {

            var rgx = /(\d\d)\.(\d\d)\.(\d\d)\.txt/;

            files.forEach(function (el, i, arr) {
                var m = rgx.exec(el);
                if (m) {
                    var component = {
                        "$": {
                            "type": "Cleanup",
                            "version": [m[2] + '.' + m[3] + '.' + m[4]],
                            "fileName": [el]
                        }
                    }
                    manifest.package[0].components[0].component.push(component);
                }
            });
        }

        return manifest;

    },


    getCoreReferenceVersion: function (config) {
        var refVersion = {
            major: 0,
            minor: 0,
            build: 0
        };
        var files = fs.readdirSync(config.dnn.pathToAssemblies);
        for (var i in files) {
            if (path.extname(files[i]) === ".dll") {
                var refs = this.getReferences(config.dnn.pathToAssemblies + '/' + files[i], true);
                if (refs.DotNetNuke !== undefined) {
                    refVersion = this.getLargestVersion(refVersion, refs.DotNetNuke);
                }
            }
        }
        return refVersion;
    },

    getLargestVersion: function (baseVersion, testVersion) {
        if (typeof testVersion === 'string') {
            return this.getLargestVersion(baseVersion, this.getVersionObject(testVersion));
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
    },

    getVersionObject: function (versionString) {
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
    },

    toNormalizedVersionString: function (version) {
        return this.pad(version.major, 2) + '.' + this.pad(version.minor, 2) + '.' + this.pad(version.build, 2);
    },

    pad: function (num, size) {
        var s = "000000000" + num;
        return s.substr(s.length - size);
    },

    getReferences: edge.func({
        source: function (aFile) {
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
    }),

    getAssemblyVersion: edge.func({
        source: function (aFile) {
            /*
              using System.Diagnostics;

              async(aFile) => {
                return FileVersionInfo.GetVersionInfo((string) aFile).FileVersion;
              }
            */
        }
    }),

    fileExists: function (path) {
        try {
            var stats = fs.lstatSync(path);
            return true;
        } catch (e) {
            return false;
        }
    },

    fileDelete: function (path) {
        if (this.fileExists(path)) {
            fs.unlinkSync(path);
        }
    }

}
