Nosub Downloader
==================
[![Build Status](https://travis-ci.org/shizuku613/NosubDownloader.svg?branch=master)](https://travis-ci.org/shizuku613/NosubDownloader)
[![Build Status](https://ci.appveyor.com/api/projects/status/bydsrjf4k4abi19w/branch/master?svg=true)](https://ci.appveyor.com/project/shizuku613/nosubdownloader/branch/master)
[![devDependency Status](https://david-dm.org/shizuku613/NosubDownloader/dev-status.svg)](https://david-dm.org/shizuku613/NosubDownloader#info=devDependencies)

[English](README.md) | [日本語](README.ja.md)<br />
You can download nosub's videos if you install the extension to Google Chrome!

## Development environment
* Node.js & NPM
* Visual Studio 2013
* [TypeScript](http://www.typescriptlang.org)
* [LESS](http://lesscss.org)
* [Grunt](http://gruntjs.com)
* [Browserify](http://browserify.org)
* [Bower](http://bower.io)
* [tsd](http://definitelytyped.org/tsd/)
* [Travis CI](https://travis-ci.org)

## Used library
* [Zepto.js](http://zeptojs.com)
* [Underscore.js](http://underscorejs.org)
* [md5.js](http://labs.cybozu.co.jp/blog/mitsunari/2007/07/md5js_1.html)
* [PgwModal](http://pgwjs.com/pgwmodal/)
* [Bootstrap](http://getbootstrap.com)
* [Knockout](http://knockoutjs.com)

## How to build
You must install Node.js and NPM before to build this project.

### Install build tools
```
npm install bower -g
npm install grunt-cli -g
npm install tsd -g
```

### Install usage library
```
npm install
bower install
tsd reinstall
```

### Compile
```
grunt build
```

### Test (Not implemented)
```
grunt test
```

## Branches
* [master](https://github.com/shizuku613/NosubDownloader/tree/master)<br />
Main branch
* [master_js](https://github.com/shizuku613/NosubDownloader/tree/master_js)<br />
This is the JavaScript old branch (<= v1.3.1.2), and has being already converted to TypeScript.

## License
* GLPv3 License (>= v1.4.5.0)
* MIT License (< v1.4.5.0)
* Copyright (c) 2014 KONO Shizuku