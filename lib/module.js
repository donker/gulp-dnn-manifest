'use strict';
var through = require('through2'),
    fs = require('fs'),
    gulp = require('gulp-util'),
    PluginError = gulp.PluginError,
    xml = require('xml2js'),
    extend = require('extend'),
    common = require('./common.js');

module.exports = function(config, originalManifestFileName) {

    // Get existing manifest (used for module template)
    gulp.log('Creating manifest from \'' + originalManifestFileName + '\'...');
    var oldManifestXml = fs.readFileSync(originalManifestFileName);
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
                        "name": config.dnn.packageName || oldManifest.dotnetnuke.packages[0].package[0].$.name,
                        "type": "Module",
                        "version": config.version || oldManifest.dotnetnuke.packages[0].package[0].$.version
                    },
                    "friendlyName": [
                        config.dnn.friendlyName || oldManifest.dotnetnuke.packages[0].package[0].friendlyName[0]
                    ],
                    "description": [
                        config.description || oldManifest.dotnetnuke.packages[0].package[0].description[0]
                    ],
                    "iconFile": [
                        config.dnn.iconFile || oldManifest.dotnetnuke.packages[0].package[0].iconFile[0]
                    ],
                    "owner": [{
                        "name": [
                            config.dnn.owner.name || oldManifest.dotnetnuke.packages[0].package[0].owner[0].name[0]
                        ],
                        "organization": [
                            config.dnn.owner.organization || oldManifest.dotnetnuke.packages[0].package[0].owner[0].organization[0]
                        ],
                        "url": [
                            config.dnn.owner.url || oldManifest.dotnetnuke.packages[0].package[0].owner[0].url[0]
                        ],
                        "email": [
                            config.dnn.owner.email || oldManifest.dotnetnuke.packages[0].package[0].owner[0].email[0]
                        ]
                    }],
                    "azureCompatible": [
                        config.dnn.module.azureCompatible || oldManifest.dotnetnuke.packages[0].package[0].azureCompatible[0]
                    ]
                }]
            }]
        }
    };

    manifest.dotnetnuke.packages[0] = common.addDependencyNode(config, manifest.dotnetnuke.packages[0]);
    manifest.dotnetnuke.packages[0] = common.addLicenseAndReleaseNotes(config, manifest.dotnetnuke.packages[0]);

    // Components section
    manifest.dotnetnuke.packages[0].package[0].components = [{ component: [] }];
    for (var i = 0; i < oldManifest.dotnetnuke.packages[0].package[0].components[0].component.length; i++) {
        var cType = oldManifest.dotnetnuke.packages[0].package[0].components[0].component[i].$.type;
        if (cType === "Module") {
            manifest.dotnetnuke.packages[0].package[0].components[0].component.push(oldManifest.dotnetnuke.packages[0].package[0].components[0].component[i])
        }
    }
    manifest.dotnetnuke.packages[0] = common.addResourceComponent(config, manifest.dotnetnuke.packages[0]);
    manifest.dotnetnuke.packages[0] = common.addAssemblyComponent(config, manifest.dotnetnuke.packages[0]);
    manifest.dotnetnuke.packages[0] = common.addScriptComponent(config, manifest.dotnetnuke.packages[0]);

    // Convert back to XML
    var builder = new xml.Builder();
    var x = builder.buildObject(manifest);
    return x;

}
