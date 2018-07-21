'use strict';
var xml = require('xml2js'),
    extend = require('extend'),
    common = require('./common.js');

module.exports = function(config) {

    // Get existing manifest (used for module template)

    // Initialize manifest to write
    var manifest = {
        "dotnetnuke": {
            "$": {
                "version": "5.0",
                "type": "Package",
                "xmlns:fo": "http://www.w3.org/1999/XSL/Format"
            },
            "packages": []
        }
    };

    var packageTemplate = {
        "package": [{
            "$": {
                "name": config.dnn.name,
                "type": "Skin",
                "version": config.version
            },
            "friendlyName": [
                config.dnn.friendlyName
            ],
            "description": [
                config.description
            ],
            "owner": [{
                "name": [
                    config.dnn.owner.name
                ],
                "organization": [
                    config.dnn.owner.organization
                ],
                "url": [
                    config.dnn.owner.url
                ],
                "email": [
                    config.dnn.owner.email
                ]
            }]
        }]
    };
    packageTemplate = common.addLicenseAndReleaseNotes(config, packageTemplate);
    packageTemplate = common.addDependencyNode(config, packageTemplate);

    var skinPackage = extend(true, {}, packageTemplate);
    skinPackage.package[0].$.name = skinPackage.package[0].$.name + ".Skin";
    skinPackage.package[0].friendlyName = skinPackage.package[0].friendlyName + " Skin";
    skinPackage.package[0].description = skinPackage.package[0].description + " (Skin Package)";
    skinPackage.package[0].components = [{
        "component": [{
            "$": {
                "type": "Skin"
            },
            "skinFiles": [{
                "skinName": [config.dnn.friendlyName]
            }]
        }]
    }];
    skinPackage = common.addResourceComponent(config, skinPackage, "portals/_default/Skins/" + config.dnn.folder, "skin.resources");
    manifest.dotnetnuke.packages.push(skinPackage);

    var containerPackage = extend(true, {}, packageTemplate);
    containerPackage.package[0].$.name = containerPackage.package[0].$.name + ".Container";
    containerPackage.package[0].$.type = "Container";
    containerPackage.package[0].friendlyName = containerPackage.package[0].friendlyName + " Container";
    containerPackage.package[0].description = containerPackage.package[0].description + " (Container Package)";
    containerPackage.package[0].components = [{
        "component": [{
            "$": {
                "type": "Container"
            },
            "containerFiles": [{
                "containerName": [config.dnn.friendlyName]
            }]
        }]
    }];
    containerPackage = common.addResourceComponent(config, containerPackage, "portals/_default/Containers/" + config.dnn.folder, "containers.resources");
    manifest.dotnetnuke.packages.push(containerPackage);

    // Convert back to XML
    var builder = new xml.Builder();
    var x = builder.buildObject(manifest);
    return x;

}
