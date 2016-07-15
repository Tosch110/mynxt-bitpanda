module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    wiredep: {
      task: {
        src: [
          'app/index.html'
        ],
        options: {}
      }
    },
    copy: {
      build: {
        cwd: 'app',
        src: ['**', '!config.js', '!config.sample.js', '!index_include.html'],
        dest: 'www',
        expand: true
      }
    },
    clean: {
      build: {
        src: ['.tmp', 'www']
      }
    },
    useminPrepare: {
      html: 'app/index.html',
      options: {
        dest: 'www'
      }
    },
    filerev: {
      options: {
        algorithm: 'md5',
        length: 8
      },
      images: {
        src: 'img/**/*.{jpg,jpeg,gif,png,webp}'
      },
      js: {
        src: 'www/*.js'
      }
    },
    usemin: {
      html: 'www/index.html',
      options: {
        assetsDirs: ['www']
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-filerev');

  grunt.registerTask('default', ['wiredep']);
  grunt.registerTask('build', [
    'wiredep',
    'useminPrepare',
    'clean',
    'copy',
    'concat:generated',
    'uglify:generated',
    'filerev',
    'usemin'
  ]);
};