# gulp-dnn-manifest
Gulp task to create a DNN manifest based on an existing manifest and files in the project directory

## Install

```
$ npm install donker/gulp-dnn-manifest
```

## Usage

```js
var manifest = require('./node_modules/gulp-dnn-manifest/plugin.js'),
    config = require('./package.json');

gulp.src('path/to/original/manifest.dnn')
    .pipe(manifest(config))
```

The config is taken from the package.json in the code segment above, but you could use an alternative method.
In any case it is expected to contain the following segment:

```
  "dnnModule": {
    "fullName": "Connect.Map",
    "friendlyName": "Map Module",
    "packageName": "Connect_Map",
    "owner": {
      "name": "Peter Donker",
      "organization": "DNN Connect",
      "url": "http://dnn-connect.org",
      "email": "peter@bring2mind.net"
    },
    "module": {
      "packageName": "Connect_Map",
      "folderName": "Connect/Map",
      "azureCompatible": "true",
      "iconFile": "DesktopModules\\Connect\\Map\\map.png"
    },
    "tempPath": "./package",
    "packagesPath": "./_Packages",
    "pathToAssemblies": "./bin",
    "pathToScripts": "./_Installation/SQL",
    "pathToSupplementaryFiles": "./_Installation",
    "excludeFilter": [
     "node_modules",
     "bin",
     "obj"
    ]
  },
```

## Description
This plugin will take your original DNN manifest and only use the module definition section to generate a new one. 
It will use the supplied configuration and what it finds in the various directories to compile a valid and updated manifest.
Specifically it will:

1. Look for license.txt and releasenotes.txt in the "pathToSupplementaryFiles"
2. Check the dlls in the "pathToAssemblies" folder and find the maximum DotNetNuke.dll dependency
3. Check the dlls in the "pathToAssemblies" folder and compile an assembly list with correct version numbers
4. Check the "pathToScripts" for SqlDataProvider files and add the scripts component

## FAQ
*Why do you need an original manifest to work from?*
Because the module definition part cannot be auto generated and it includes so many features that recreating this in JSON didn't make sense to me. In my own development work I keep a minimal manifest with at least the module definition section in it. And whenever I make changes to the module definition I do it there. The other components (assembly, scripts, etc) can be auto generated from the project. That is what this plugin does.

## License

MIT © [Peter Donker](http://www.bring2mind.net)


