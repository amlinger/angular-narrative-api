
(function (window, angular, undefined) {
  'use strict';

  angular.module('api.narrative.mocks', []);

  var extend = angular.extend,
    copy = angular.copy,
    mocks = angular.module('api.narrative.mocks'),
    alwaysTrue  = function () { return true; },
    alwaysFalse = function () { return false; },
    Auth = {
      isLoggedIn: alwaysTrue,
      unauth: alwaysTrue,
      authorizationHeaders: function () {
        return { Authorization: 'Bearer :access_token' };
      }
    };

  mocks.provider('NarrativeAuthMock', function () {
    this.$get = function () {
      return function (config) {
        return extend(copy(Auth), config || {});
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
    return function (name) {
      return $cacheFactory('thisIsAlreadyPreNamed');
    };
  });

}(window, window.angular));
