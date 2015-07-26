module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-contrib-clean');


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

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },

    ngdocs: {
      options: {
        startPage: '/reference',
        sourceLink: 'https://github.com/amlinger/angular-narrative-api/blob/master/{{file}}#L{{codeline}}'
      },
      reference: {
        title: 'API reference',
        api: true,
        src: ['src/*.js']
      }
    },

    clean: {
      docs: ['docs'],
      dist: ['dist']
    }
  });


  grunt.registerTask('docs', ['clean:docs', 'ngdocs:reference']);
  // Default task(s).
  grunt.registerTask('build', ['clean:dist', 'concat:dist', 'uglify']);
  // Default task
  grunt.registerTask('default', ['build', 'docs']);

};
