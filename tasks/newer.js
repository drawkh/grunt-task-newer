/*
 * grunt-task-newer
 * https://github.com/drawk/grunt-task-newer
 *
 * Copyright (c) 2013 Gilles G.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    /**
     * @type {Object}
     */
    var fs = require('fs');
   
    /**
     * @param {string} file
     * 
     * @return {Object}
     */
    var getStatFile = function(file) {
        var stat;

        try {
            stat = fs.statSync(file);
        } catch (exception) {
            stat = null;
        }

        return stat;
    };

    /**
     * @param {Object} stat
     * 
     * @return {number}
     */
    var getModifiedTime = function(stat) {
        var mtime;

        try {
            mtime = stat.mtime.getTime();
        } catch (exception) {
            mtime = 0;
        }

        return mtime;
    };

    /**
     * @param {string}          target
     * @param {Array.<string>}  files
     * 
     * @return {boolean}
     */
    var hasNewerFiles = function(target, files) {
        var targetStat = getStatFile(target);

        if (!targetStat) {
            return true;
        }

        var targetModifiedTime = getModifiedTime(targetStat);

        if (!targetModifiedTime) {
            return true;
        }

        for (var i = 0, iCount = files.length; i < iCount; i++) {
            var fileStat = getStatFile(files[i]);

            if (fileStat === null) {
                continue;
            }

            if (getModifiedTime(fileStat) > targetModifiedTime) {
                return true;
            }
        }

        return false;
    };


    grunt.registerTask('newer', 'Run grunt task only if source files are newer.', function(name, target) {
        var prefix = this.name;

        if (!target) {
            var tasks = [];
            
            Object.keys(grunt.config(name)).forEach(function(target) {
                if (!/^_|^options$/.test(target)) {
                    tasks.push(prefix + ':' + name + ':' + target);
                }
            });

            return grunt.task.run(tasks);
        }

        var args        = Array.prototype.slice.call(arguments, 2).join(':'),
            config      = grunt.util._.clone(grunt.config.get([name, target])),
            newerFiles  = grunt.task.normalizeMultiTaskFiles(config, target)
                            .filter(function(f) {
                                return hasNewerFiles(f.dest, f.src);
                            });

        if (!newerFiles.length) {
            return;
        }

        config.files = newerFiles;

        delete config.src;
        delete config.dest;          

        grunt.config.set([name, target], config);

        grunt.task.run(name + ':' + target + (args ? ':' + args : ''));
    });
};