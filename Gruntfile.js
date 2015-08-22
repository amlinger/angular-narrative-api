/*global module*/

module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    concat: {
      dist: {
        src: [
          'src/lib/*.js',
          'src/narrative.module.js',
          'src/cache.provider.js',
          'src/request-handler.provider.js',
          'src/resource.service.js',
          'src/auth.provider.js',
          'src/api.provider.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },

    connect: {
      options: {
        livereload: false,
        hostname: 'localhost'
      },
      docs: {
        options: {
          port: 9999,
          base: ['./docs']
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> ' +
                '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    ngdocs: {
      options: {
        startPage: '/reference/api.narrative',
        sourceLink: 'https://github.com/amlinger/angular-narrative-api/blob/' +
                    'master/{{file}}#L{{codeline}}',
        analytics: {
          account: 'UA-66626170-1'
        }
      },
      reference: {
        title: 'API reference',
        api: true,
        src: ['src/*.js']
      }
    },

    jshint: {
      all: ['*.js', 'src/*.js', 'test/*.js'],
      options: {
        jshintrc: true
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js'
      },
      CI: {
        singleRun: true,
        configFile: 'karma.conf.js'
      }
    },

    clean: {
      docs: ['docs'],
      dist: ['dist']
    },

    watch: {
      docs: {
        files: ['*.js', 'src/*.js'],
        tasks: ['clean:docs', 'ngdocs:reference']
      },
      jshint: {
        files: ['.jshintrc', 'src/.jshintrc', 'test/.jshintrc',
                '*.js', 'src/*.js', 'test/*.js'],
        tasks: ['jshint:all']
      },
      test: {
        files: ['.jshintrc', 'src/.jshintrc', 'test/.jshintrc',
                '*.js', 'src/*.js', 'test/*.js'],
        tasks: ['jshint:all', 'karma:CI']
      }
    }
  });

  // Testing task
  grunt.registerTask('test', 'Runs unit tests and Lints.', function(run) {
    run = run || 'repeat';

    if (run === 'CI')
      grunt.task.run(['jshint:all', 'karma:CI']);

    else if (run === 'repeat')
      grunt.task.run(['watch:test']);

    else
      throw 'No such option: "' + run + '"';
  });

  grunt.registerTask('docs', ['clean:docs', 'ngdocs:reference']);
  // Default task(s).
  grunt.registerTask('build', ['clean:dist', 'concat:dist', 'uglify']);

  grunt.registerTask('serve', 'Start a server.', function(run) {
    run = run || 'docs';

    grunt.task.run([
      'connect:' + run,
      'watch:' + run
    ]);
  });

  // Default task
  grunt.registerTask('default', ['build', 'docs']);

};
