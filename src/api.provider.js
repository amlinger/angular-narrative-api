/*global NarrativeApiProvider, getApi*/
function NarrativeApiProvider() {
  'use strict';

  this.defaults = {
    auth : null
  };
  var defaults = this.defaults, getApi;



  getApi = function(Resource, NarrativeAuth) {
    return function (config) {
      var api = {};

      config = angular.extend(defaults, config);
      if (!config.auth) {
        config.auth = NarrativeAuth();
      }

      function momentTransformation(moment) {
        return angular.extend(moment, {
          positions : Resource
            .ArrayFactory(config.auth, moment.getPath() + 'positions/')
            .create(),
          photos : Resource
            .ArrayFactory(config.auth, moment.getPath() + 'photos/')
            .create()
        });
      }

      api.moments = Resource.ArrayFactory(config.auth, 'moments/')
        .itemTransform(momentTransformation)
        .create();

      api.moment = Resource.ItemFactory(config.auth, 'moments/:uuid')
        .transform(momentTransformation)
        .create();

      api.photos = Resource.ArrayFactory(config.auth, 'photos/')
        .create();

      api.user = Resource.ItemFactory(config.auth, 'users/:uuid/')
        .create();

      api.me = function (options) {
        return api.user('me', options);
      };

      return api;
    };
  };

  getApi.$inject = ['api.narrative.Resource', 'NarrativeAuth'];
  this.$get = getApi;
}

angular.module('api.narrative')
  .provider('NarrativeApi', NarrativeApiProvider);
