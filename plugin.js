"use strict";
var dnnModule = require("./lib/module.js"),
  dnnSkin = require("./lib/skin.js"),
  dnnLibrary = require("./lib/library.js"),
  dnnPersonaBar = require("./lib/personabar.js"),
  extend = require("extend"),
  file = require("gulp-file");

var PLUGIN_NAME = "gulp-dnn-manifest";

module.exports = function(options, originalManifestFileName) {
  var defaults = {
    version: "01.00.00",
    dnn: {
      projectType: "module",
      packagesPath: "./_Packages",
      pathToAssemblies: "./bin",
      pathToScripts: "./_Installation/SQL",
      pathToSupplementaryFiles: "./_Installation",
      excludedPaths: ["node_modules", "_references"]
    }
  };
  var config = extend(true, {}, defaults, options || {});

  if (!config) {
    throw new PluginError(PLUGIN_NAME, "No configuration specified.");
  }

  var manifest = "";
  switch (config.dnn.projectType) {
    case "skin":
      manifest = dnnSkin(config);
      break;
    case "module":
      manifest = dnnModule(config, originalManifestFileName);
      break;
    case "library":
      manifest = dnnLibrary(config, originalManifestFileName);
      break;
    case "personabar":
      manifest = dnnPersonaBar(config, originalManifestFileName);
      break;
  }

  return file("version.dnn", manifest, { src: true });
};
