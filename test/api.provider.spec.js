

(function () {
  'use strict';

  var emptyResponse = {
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
        uuid: 'unique',
        type: 'moment'
      }]
    };

  describe('NarrativeApi', function () {
    var $httpBackend, itemFactory, arrayFactory, auth, $rootScope, apiFactory,
      narrativeApiProvider, basePath = 'https://narrativeapp.com/api/v2/';

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

    it('transforms single moment-hook to enable nested queries', function () {
      var api = apiFactory(), photos, positions;

      $httpBackend.expectGET(basePath + 'moments/unique/photos/')
        .respond(200, emptyResponse);
      $httpBackend.expectGET(basePath + 'moments/unique/positions/')
        .respond(200, emptyResponse);
      photos = api.moment('unique').photos().get();
      positions = api.moment('unique').positions().get();
      $httpBackend.flush();
      $rootScope.$digest();

      expect(photos.results.length).toBe(0);
      expect(positions.results.length).toBe(0);
    });

    it('transforms moments-hook to enable further queries', function () {
      var api = apiFactory(), moments, photos, positions;

      $httpBackend.expectGET(basePath + 'moments/')
        .respond(200, singleMomentResponse);
      moments = api.moments().get();
      $httpBackend.flush();
      $rootScope.$digest();
      expect(moments.results.length).toBe(1);

      $httpBackend.expectGET(basePath + 'moments/unique/photos/')
        .respond(200, emptyResponse);
      $httpBackend.expectGET(basePath + 'moments/unique/positions/')
        .respond(200, emptyResponse);
      photos = moments.results[0].photos().get();
      positions = moments.results[0].positions().get();
      $httpBackend.flush();
      $rootScope.$digest();

      expect(photos.results.length).toBe(0);
      expect(positions.results.length).toBe(0);
    });

    it('creates new item instances for different uuids', function () {
      var api = apiFactory(), first, second;

      first = api.moment('first');
      second = api.moment('second');

      expect(first.path()).not.toBe(second.path());
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
