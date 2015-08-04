
(function (window, angular, undefined) {
  'use strict';

  angular.module('api.narrative.mocks', []);

  var extend = angular.extend,
    copy = angular.copy,
    isUndefined = angular.isUndefined,
    mocks = angular.module('api.narrative.mocks'),
    alwaysTrue  = function () { return true; },
    Auth = {
      _name: 'global',
      _token: {
        token_type: 'Bearer',
        access_token: ':bear_arms'
      },
      config: function () {
        return {name: this._name};
      },
      unauth: alwaysTrue,
      getOauthToken: function(code, parameters) {
        return parameters;
      },
      token: function (token) {
        if(!isUndefined(token))
          this.token = token;
        return this._token;
      }
    };

  mocks.provider('NarrativeAuthMock', function () {
    this.$get = function () {
      return function (config) {
        return extend(copy(Auth), config || {});
      };
    };
  });

  mocks.provider('StaticAuthMock', function () {
    var local = copy(Auth);
    this.$get = function () {
      return function () {
        return local;
      };
    };
  });

  mocks.factory('PrenamedCachFactoryMock', function ($cacheFactory) {
    return function () {
      return $cacheFactory('thisIsAlreadyPreNamed');
    };
  });

}(window, window.angular));
