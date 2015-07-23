/*global module*/
module.exports = function (config) {
  'use strict';

  config.set({

    files : [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'src/lib/*.js',
      'src/narrative.module.js',
      'src/*.js',
      'test/mocks.js',
      'test/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    // web server port
    port: 8888,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS'
    ],

    plugins : [
      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-junit-reporter'
    ],

    colors: true,

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    },

    logLevel: 'LOG_WARN'

  });
};
