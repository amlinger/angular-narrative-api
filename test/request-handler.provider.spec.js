(function () {
  'use strict';

  describe('NarrativeParamSerializer', function () {
    var narrativeParamSerializer;

    beforeEach(module('api.narrative'));

    beforeEach(inject(function (_NarrativeParamSerializer_) {
      narrativeParamSerializer = _NarrativeParamSerializer_;
    }));

    it('returns an empty string without params given.', function () {
      expect(narrativeParamSerializer()).toBe('');
    });

    it('converts arrays to JSON encoding.', function () {
      var converted = narrativeParamSerializer({
        dotted: ['jaguar']
      });
      expect(converted).toBe('dotted=%5B%22jaguar%22%5D');

      converted = narrativeParamSerializer({
        striped: ['zebra', "tiger"]
      });
      expect(converted).toBe('striped=%5B%22zebra%22%2C%22tiger%22%5D');
    });

    it('joins multiple parameters with ampersand.', function () {
      var converted = narrativeParamSerializer({
        penguin: "tuxedo",
        kangaroo: "fanny-pack"
      });
      expect(converted).toBe("penguin=tuxedo&kangaroo=fanny-pack");
    });
  });

  describe('NarrativeRequest', function () {
    var narrativeRequestProvider, narrativeRequest, $httpBackend, newAuth, path;

    beforeEach(module('api.narrative', function (_NarrativeRequestProvider_) {
      narrativeRequestProvider = _NarrativeRequestProvider_;
    }));
    beforeEach(module('api.narrative.mocks'));

    beforeEach(inject(function (_$httpBackend_,  _NarrativeAuthMock_,
                                _$http_, _$injector_) {
      $httpBackend = _$httpBackend_;
      newAuth = _NarrativeAuthMock_;
      narrativeRequestProvider.defaults.api = {
        proxy: "http://proxy/",
        baseUrl: "https://narrative.com/",
        apiSuffix: "api/v75/"
      };
      path = "http://proxy/https://narrative.com/api/v75/";
      narrativeRequest = narrativeRequestProvider.$get.pop()(
        _$http_, _NarrativeAuthMock_, _$injector_);
    }));

    it('adds a new Auth if none is supplied.', function () {
      var headerSpy = jasmine.createSpy('headerSpy');

      $httpBackend.expectGET(path + 'monkeys/')
        .respond(function (method, url, data, headers) {
          expect(headers.Authorization).toBeDefined();
          return { data: 'Curious George' };
        });
      narrativeRequest('GET', 'monkeys/');
      $httpBackend.flush();
    });

    it('does not add headers to unauthorized requests.', function () {
      var headerSpy = jasmine.createSpy('headerSpy'),
        auth = newAuth({
          token: function () { return null; }
        });

      $httpBackend.expectGET(path + 'monkeys/')
        .respond(function (method, url, data, headers) {
          expect(headers.Authorization).not.toBeDefined();
          return { data: 'Curious George' };
        });
      narrativeRequest('GET', 'monkeys/', {}, auth);
      $httpBackend.flush();
    });

    it('does adds headers to authorized requests.', function () {
      var key = 'Bearer :bear_arms',
        auth = newAuth();

      $httpBackend.expectGET(path + 'sheep/')
        .respond(function (method, url, data, headers) {
          expect(headers.Authorization).toEqual(key);
          return { data: "Dolly, Dolly, Dolly" };
      });

      narrativeRequest('GET', 'sheep/', {}, auth);
      $httpBackend.flush();
    });

    it('does adds parameters to url if passed.', function () {
      var key = 'Bearer :bear',
        auth = newAuth({isLoggedIn: function () { return false; }});

      $httpBackend.expectGET(path + 'sheep/?clones=false')
        .respond(200, { data: "Dolly" });

      narrativeRequest('GET', 'sheep/', { clones: false }, auth);
      $httpBackend.flush();
    });

     afterEach(function() {
       $httpBackend.verifyNoOutstandingExpectation();
       $httpBackend.verifyNoOutstandingRequest();
     });
  });
}());
