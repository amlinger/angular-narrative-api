

(function () {
  'use strict';

  var identity = angular.identity,
    noop = angular.noop,
    extend = angular.extend;

  describe('NarrativeApi', function () {
    var $httpBackend, itemFactory, arrayFactory, auth, $rootScope, apiFactory,
      narrativeApiProvider, basePath = "https://narrativeapp.com/api/v2/";

    beforeEach(module('api.narrative', function (_NarrativeApiProvider_) {
      narrativeApiProvider = _NarrativeApiProvider_;
    }));
    beforeEach(module('api.narrative.mocks'));

    beforeEach(inject(function (_$httpBackend_, _$rootScope_,
                                _NarrativeItemFactory_,_NarrativeArrayFactory_,
                                 _NarrativeAuthMock_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;

      itemFactory = _NarrativeItemFactory_;
      arrayFactory = _NarrativeArrayFactory_;
      auth = _NarrativeAuthMock_;

      apiFactory = narrativeApiProvider
        .$get[3](itemFactory, arrayFactory, auth);
    }));

    it('can be instantiated with an empty config.', function () {
      expect(function () {
        apiFactory();
      }).not.toThrow();
    });
  });
}());
