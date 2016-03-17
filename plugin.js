'use strict';
var dnnModule = require('./lib/module.js'),
    dnnSkin = require('./lib/skin.js'),
    extend = require('extend'),
    gutil = require('gulp-util');

var PLUGIN_NAME = 'gulp-dnn-manifest';

module.exports = function(options, originalManifestFileName) {

    var defaults = {
        version: '01.00.00',
        dnn: {
            packagesPath: "./_Packages",
            pathToAssemblies: './bin',
            pathToScripts: './_Installation/SQL',
            pathToSupplementaryFiles: './_Installation',
            excludedPaths: ['node_modules', '_references']
        }
    }
    var config = extend(true, {}, defaults, options || {});

    if (!config) {
        throw new PluginError(PLUGIN_NAME, 'No configuration specified.');
    }

    var manifest = "";
    switch (config.dnn.projectType) {
        case "skin":
            manifest = dnnSkin(config);
            break;
        case "module":
            manifest = dnnModule(config, originalManifestFileName);
            break;
    }

    return string_src("version.dnn", manifest);

}

function string_src(filename, string) {
    var src = require('stream').Readable({ objectMode: true })
    src._read = function() {
        this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
        this.push(null)
    }
    return src
}
