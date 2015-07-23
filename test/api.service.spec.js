

(function () {
  'use strict';
/*
  describe('NarrativeAPIService', function () {
    var Auth, API, $httpBackend, $rootScope, successSpy, failureSpy, isAuth,
      $window, $timeout,
      backend = {
        proxy: "http://thisisasecret/",
        baseURL: "https://narrativebase.com/",
        APIsuffix: "api/v1337/",
        oauth: {
          authorize: 'https://narrativebase.com/oauth2/authorize/',
          token: 'https://narrativebase.com/oauth2/token/'
        }
      }, API_URL = backend.proxy + backend.baseURL + backend.APIsuffix;

    function starts(str) {
      var escaped = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      return new RegExp('^' + escaped + '?.*');
    }

    // We need to override with a mock that is easier to control.
    beforeEach(module('narrativeResearch'));

    beforeEach(module(function ($provide) {
      $provide.service('Auth', function () {
        return {
          narrative: {
            token: function () {
              return { token_type: "token", access_token: "token" };
            }
          },
          isLoggedIn: function () {
            return isAuth;
          }
        };
      });
      $window = {location: {replace: jasmine.createSpy('location.replace') }};
      $provide.value('$window', $window);
      $provide.constant('NARRATIVE_BACKEND', backend);
    }));

    beforeEach(inject(function (_narrativeAPI_, _$rootScope_, _$httpBackend_,
                                _$timeout_) {
      API = _narrativeAPI_;
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      $timeout = _$timeout_;
      successSpy = jasmine.createSpy("APIsuccessSpy");
      failureSpy = jasmine.createSpy("APIfailureSpy");
      isAuth = true;
    }));

    describe('_request', function () {

      it('rejects unauthorized attempts.', function () {
        isAuth = false;
        API._request('GET', 'moments').then(successSpy, failureSpy);
        $rootScope.$digest();
        expect(successSpy).not.toHaveBeenCalled();
        expect(failureSpy).toHaveBeenCalled();
      });

      it('accepts authorized attempts.', function () {
        $httpBackend.when('GET', API_URL + 'moments').respond([]);
        $httpBackend.expectGET(API_URL + 'moments');
        API._request('GET', 'moments').then(successSpy, failureSpy);
        $rootScope.$digest();
        $httpBackend.flush();
        expect(successSpy).toHaveBeenCalled();
        expect(failureSpy).not.toHaveBeenCalled();
      });
    });

    describe('oauthInit', function () {

      it('transfers to Narratives Oauth landing page.', function () {
        API.oauthInit();
        expect($window.location.replace.calls.mostRecent().args[0]).toMatch(
          backend.oauth.authorize + "*" 
        );
      });
    });

    describe('getAuthToken', function () {

      it('performs a token request to the oauth server.', function (done) {
        var tokenSpy = jasmine.createSpy("tokenSpy"),
          url = starts(backend.oauth.token);
        $httpBackend.whenPOST(url).respond("some_token");
        $httpBackend.expectPOST(url);

        API.getAuthToken("some_code").then(tokenSpy)['finally'](function () {
          expect(tokenSpy).toHaveBeenCalledWith(jasmine.objectContaining({
            data: "some_token"
          }));
          done();
        });
        $rootScope.$digest();
        $httpBackend.flush();
      });

      it('performs a token request to the oauth server.', function (done) {
        var url = starts(backend.oauth.token);
        $httpBackend.whenPOST(url).respond(401, '');
        $httpBackend.expectPOST(url);

        API.getAuthToken("some_code").then(successSpy, failureSpy)['finally'](
          function () {
            expect(successSpy).not.toHaveBeenCalled();
            expect(failureSpy).toHaveBeenCalled();
            done();
          }
        );
        $rootScope.$digest();
        $httpBackend.flush();
      });
    });
    describe('me', function () {
      it('responds to request', function (done) {
        var userSpy = jasmine.createSpy("userSpy");
        $httpBackend.whenGET(API_URL + 'users/me/').respond({});
        $httpBackend.expectGET(API_URL + 'users/me/');

        API.me().then(userSpy)['finally'](function () {
          expect(userSpy).toHaveBeenCalled();
          done();
        });
        $rootScope.$digest();
        $httpBackend.flush();
      });
    });
    describe('getUsersByName', function () {

    });
    describe('moments', function () {
      it('responds to request', function (done) {
        var momentSpy = jasmine.createSpy("momentSpy");
        $httpBackend.whenGET(API_URL + 'moments/').respond({
          count: 0,
          previous: null,
          next: null,
          results: []
        });
        $httpBackend.expectGET(API_URL + 'moments/');

        API.moments().then(momentSpy)['finally'](function () {
          expect(momentSpy).toHaveBeenCalled();
          done();
        });
        $rootScope.$digest();
        $httpBackend.flush();
      });
    });
  });*/
}());
