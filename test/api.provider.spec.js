

(function () {
  'use strict';

  var identity = angular.identity,
    noop = angular.noop,
    extend = angular.extend,
    emptyResponse = {
      count: 0,
      next: null,
      previous: null,
      results: []
    },
    singleMomentResponse = {
      count: 1,
      next: null,
      previous: null,
      results: [{
        uuid: 'someveryuniqueuuid'
      }]
    };

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

    it('can fetch an empty set of moments.', function () {
      var api = apiFactory(), moments;

      $httpBackend.expectGET(basePath + 'moments/')
        .respond(200, emptyResponse);
      moments = api.moments().get();

      $httpBackend.flush();
      $rootScope.$digest();

      expect(moments.results.length).toBe(0);
    });

    it('can fetch an empty set of photos.', function () {
      var api = apiFactory(), photos;

      $httpBackend.expectGET(basePath + 'photos/')
        .respond(200, emptyResponse);
      photos = api.photos().get();

      $httpBackend.flush();
      $rootScope.$digest();

      expect(photos.results.length).toBe(0);
    });
  });
}());
