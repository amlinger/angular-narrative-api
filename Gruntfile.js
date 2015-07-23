module.exports = function(grunt) {

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load documentation task.
  grunt.loadNpmTasks('grunt-ngdocs');

  grunt.loadNpmTasks('grunt-contrib-clean');


  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      concat: {
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
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    ngdocs: {
      all: ['src/*.js']
    },

    clean: ['docs']
  });


  grunt.registerTask('docs', ['clean', 'ngdocs']);
  // Default task(s).
  grunt.registerTask('default', ['uglify']);

};
