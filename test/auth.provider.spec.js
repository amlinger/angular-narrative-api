(function () {
  'use strict';

  function locationSearch(windowLocation) {
    var vars = windowLocation-split('?')[0], hash = {};

    forEach((vars ? vars.split("&") : []), function (urlVar) {
      var pair = urlVar.split("=");
      // Remove trailing slashes
      hash[pair[0]] = pair[1].replace(/\/+$/, "");
    });

    return hash;
  }

  var toJson = angular.toJson;

  describe('NarrativeAuth', function () {
    var narrativeAuthProvider, narrativeAuth, $getAuth, $httpBackend,
      $window, $rootScope, spies = {};

    beforeEach(module('api.narrative', function (_NarrativeAuthProvider_) {
      narrativeAuthProvider = _NarrativeAuthProvider_;
    }));

    /*
     * A localStorage mock, that with spies to each method. This can be read
     * as a key-value store from the store variable, and the spies are
     * accessible through spies.desiredMethod)=.
     */
    beforeEach(function () {
      spies.getItem = spyOn(localStorage, 'getItem');
      spies.removeItem = spyOn(localStorage, 'removeItem');
      spies.setItem = spyOn(localStorage, 'setItem');
      spies.clear = spyOn(localStorage, 'clear');
    });

    beforeEach(inject(function (_$httpBackend_, _$http_, _$window_, _$q_,
                                _$rootScope_, _$injector_) {
      $httpBackend = _$httpBackend_;
      $getAuth = narrativeAuthProvider.$get[5];
      $window = _$window_;
      $rootScope = _$rootScope_;
      narrativeAuth = $getAuth(_$http_, _$q_, $window, $rootScope, _$injector_);
    }));

    it('sets the name when provided.', function () {
      var auth = narrativeAuth(),
        name = 'Authwl';

      expect(auth.config().name).toEqual(narrativeAuthProvider.defaults.name);

      auth = narrativeAuth(name);
      expect(auth.config().name).toEqual(name);

      auth = narrativeAuth({name: name});
      expect(auth.config().name).toEqual(name);
    });

    describe('NarrativeAuth.oauth', function () {
      var authorize, redirectURI, clientID, clientSecret, auth;

      beforeEach(function () {
        authorize = 'http://auth/';
        redirectURI = 'http://here/';
        clientID = 'anID';
        clientSecret = 'aSecret';
        auth = narrativeAuth({
          oauthApplication: {
            redirectURI: redirectURI,
            clientID: clientID,
            clientSecret: clientSecret
          },
          oauthRoutes: {
            authorize: authorize
          }
        });

        spyOn($window.location, 'replace');
      });

      it('oauthAuthorizationCode redirects to Narrative Oauth.', function () {
        auth.oauthAuthorizationCode();
        expect($window.location.replace.calls.mostRecent().args[0]).toBe(
          authorize + '?redirect_uri=' + redirectURI + '&' +
          'response_type=code&' +
          'client_id=' + clientID + '&' +
          'state=' + encodeURIComponent(toJson({config: auth.config()}))
        );
      });

      it('oauthAuthorizationCode sends parameters in url.', function () {
        var params = {
          koala: 'eucalyptus',
          panda: 'bamboo'
        };
        auth.oauthAuthorizationCode(params);
        expect($window.location.replace.calls.mostRecent().args[0]).toBe(
          authorize + '?redirect_uri=' + redirectURI + '&' +
          'response_type=code&' +
          'client_id=' + clientID + '&' +
          'state=' + encodeURIComponent(toJson({
            config: auth.config(),
            parameters: params
          }))
        );
      });

      it('does not implement Implicit Grant Flow.', function () {
        expect(function () {
          auth.oauthImplicit();
        }).toThrow();
      });

      it('does not implement Client Credential Flow.', function () {
        expect(function () {
          auth.oauthClientCredentials();
        }).toThrow();
      });

      it('does not implement Refresh Token Flow.', function () {
        expect(function () {
          auth.oauthRefreshToken();
        }).toThrow();
      });

      it('gets token and initializes the data from the object.', function () {

      });
    });

    it('is not logged in by default.', function () {
      var auth = narrativeAuth();
      expect(auth.token()).toBe(null);
    });

    it('it logs in when provided with a token.', function () {
      var auth = narrativeAuth();
      auth.token({
        access_token: 'token',
        token_type: 'Bearer'
      });
      expect(auth.token()).not.toBe(null);
    });

    it('trows on malformatted token.', function () {
      var auth = narrativeAuth();
      expect(function () {
        auth.token("Malicious Mallard Token!");
      }).toThrow();
    });

    describe('NarrativeAuth.waitForAuth', function () {
      it('is not resolved by default.', function () {
        var auth = narrativeAuth(),
          resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy');

        auth.waitForAuth().then(resolve, reject);
        $rootScope.$digest();
        expect(resolve).not.toHaveBeenCalled();
        expect(reject).not.toHaveBeenCalled();
      });

      it('is resolved with itself when logged in.', function () {
        var auth = narrativeAuth(),
          resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy');

        auth.token({
          access_token: 'token',
          token_type: 'Bearer'
        });
        auth.waitForAuth().then(resolve, reject);
        $rootScope.$digest();
        expect(resolve).toHaveBeenCalledWith(auth);
        expect(reject).not.toHaveBeenCalled();
      });

      it('is resolved with itself if login is performed after.', function () {
        var auth = narrativeAuth(),
          resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy');

        auth.waitForAuth().then(resolve, reject);
        auth.token({
          access_token: 'token',
          token_type: 'Bearer'
        });
        $rootScope.$digest();
        expect(resolve).toHaveBeenCalledWith(auth);
        expect(reject).not.toHaveBeenCalled();
      });
    });

    describe('NarrativeAuth.requireAuth', function () {
      it('is rejected by default.', function () {
        var auth = narrativeAuth(),
          resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy');

        auth.requireAuth().then(resolve, reject);
        $rootScope.$digest();
        expect(resolve).not.toHaveBeenCalled();
        expect(reject).toHaveBeenCalled();
      });

      it('is resolved with itself when logged in.', function () {
        var auth = narrativeAuth(),
          resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy');

        auth.token({
          access_token: 'token',
          token_type: 'Bearer'
        });
        auth.requireAuth().then(resolve, reject);
        $rootScope.$digest();
        expect(resolve).toHaveBeenCalledWith(auth);
        expect(reject).not.toHaveBeenCalled();
      });

      it('is not resolved when login is performed after.', function () {
        var auth = narrativeAuth(),
          resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy');

        auth.requireAuth().then(resolve, reject);
        $rootScope.$digest();
        auth.token({
          access_token: 'token',
          token_type: 'Bearer'
        });
        expect(resolve).not.toHaveBeenCalled();
        expect(reject).toHaveBeenCalled();
      });

      it('resolves with itself  when login is in process.', function () {
        var resolve = jasmine.createSpy('resolveSpy'),
          reject = jasmine.createSpy('rejectSpy'),
          token = 'http://token/',
          redirectURI = 'http://here/',
          clientID = 'anID',
          clientSecret = 'aSecret',
          auth = narrativeAuth({
            oauthApplication: {
              redirectURI: redirectURI,
              clientID: clientID,
              clientSecret: clientSecret
            },
            oauthRoutes: {
              token: token
            }
          });

        $httpBackend
          .whenPOST('http://token/?client_id=anID&code=code&' +
            'grant_type=authorization_code&redirect_uri=http:%2F%2Fhere%2F')
          .respond(200, {
            access_token: 'token',
            token_type: 'Bearer'
          });
        auth.getOauthToken('code');
        auth.requireAuth().then(resolve, reject);
        $rootScope.$digest();
        expect(resolve).not.toHaveBeenCalled();
        expect(reject).not.toHaveBeenCalled();
        $httpBackend.flush();
        expect(resolve).toHaveBeenCalledWith(auth);
        expect(reject).not.toHaveBeenCalled();
      });
    });

    describe('NarrativeAuth.onAuth', function () {
      var token, redirectURI, clientID, clientSecret, auth;

      beforeEach(function () {
        token = 'http://token/';
        redirectURI = 'http://here/';
        clientID = 'anID';
        clientSecret = 'aSecret';
        auth = narrativeAuth({
          oauthApplication: {
            redirectURI: redirectURI,
            clientID: clientID,
            clientSecret: clientSecret
          },
          oauthRoutes: {
            token: token
          }
        });

        $httpBackend
          .whenPOST('http://token/?client_id=anID&code=code&' +
            'grant_type=authorization_code&redirect_uri=http:%2F%2Fhere%2F')
          .respond(200, {
            access_token: 'token',
            token_type: 'Bearer'
          });
      });

      it('is called on login.', function () {
        var loginSpy = jasmine.createSpy('login');
        auth.onAuth(loginSpy);
        auth.getOauthToken('code');
        $httpBackend.flush();

        expect(loginSpy).toHaveBeenCalled();
      });

      it('is called on login.', function () {
        var loginSpy = jasmine.createSpy('login'),
          params = { some: 'parameters' };
        auth.onAuth(loginSpy);
        auth.getOauthToken('code', params);
        $httpBackend.flush();

        expect(loginSpy.calls.mostRecent().args[0]).toBe(auth);
        expect(loginSpy.calls.mostRecent().args[1]).toBe(params);
      });

      it('is uses the passed context.', function () {
        var context = null;
        auth.onAuth(function () {
          context = this;
        }, this);

        auth.getOauthToken('code');
        $httpBackend.flush();

        expect(context).toBe(this);
      });

      it('handles multiple callbacks.', function () {
        var loginSpy1 = jasmine.createSpy('login1'),
          loginSpy2 = jasmine.createSpy('login2'),
          loginSpy3 = jasmine.createSpy('login3');

        auth.onAuth(loginSpy3);
        auth.onAuth(loginSpy2);
        auth.onAuth(loginSpy1);

        auth.getOauthToken('code');
        $httpBackend.flush();

        expect(loginSpy1).toHaveBeenCalled();
        expect(loginSpy2).toHaveBeenCalled();
        expect(loginSpy3).toHaveBeenCalled();
      });


      it('handles multiple contexts.', function () {
        var context1 = null,
          context2 = null,
          expected1 = { firstcontext : "bear" },
          expected2 = { secondcontext : "grizzly" };

        auth.onAuth(function () {
          context1 = this;
        }, expected1);

        auth.onAuth(function () {
          context2 = this;
        }, expected2);

        auth.getOauthToken('code');
        $httpBackend.flush();

        expect(context1).toBe(expected1);
        expect(context2).toBe(expected2);
      });
    });
  });

  describe('NarrativeUrlObserverFactory', function () {
    var narrativeUrlObserverFactory, $location, $window, redirectSpy,
      authMock;

    function encodeState(obj) {
      return encodeURIComponent(toJson(obj));
    }

    beforeEach(module('api.narrative'));
    beforeEach(module('api.narrative.mocks'));

    beforeEach(module(function($provide, _StaticAuthMockProvider_) {
      redirectSpy = jasmine.createSpy('redirectSpy');
      $location = {
        $$html5: true,
        $$search: {},
        $$absUrl: "",
        absUrl: function () {
          return this.$$absUrl;
        },
        search: function (value) {
          if(value) {
            this.$$search = value;
            return this;
          }
          return this.$$search;
        },
        replace: redirectSpy
      };
      $provide.service('$location', function () {
        return $location;
      });
      authMock = _StaticAuthMockProvider_.$get();
      $provide.provider('NarrativeAuth', _StaticAuthMockProvider_);
    }));

    beforeEach(inject(function (_$window_, _NarrativeUrlObserverFactory_) {
      $window = _$window_;
      narrativeUrlObserverFactory = _NarrativeUrlObserverFactory_;
    }));

    it('does not call absUrl when html5Mode is on.', function () {
      var absUrlSpy = spyOn($location, 'absUrl'),
        searchSpy = spyOn($location, 'search').and.callThrough();
      narrativeUrlObserverFactory();
      expect(absUrlSpy).not.toHaveBeenCalled();
      expect(searchSpy).toHaveBeenCalled();
    });

    it('does call absUrl when html5Mode is off.', function () {
      var absUrlSpy = spyOn($location, 'absUrl').and.callThrough(),
        searchSpy = spyOn($location, 'search');
      $location.$$html5 = false;
      narrativeUrlObserverFactory();
      expect(absUrlSpy).toHaveBeenCalled();
      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('aborts on invalid state.', function () {
      $location.$$search = {state: "I'm not valid JSON."};
      narrativeUrlObserverFactory();
    });

    it('calls unauth on error param.', function () {
      var unauthSpy = spyOn(authMock(), 'unauth');
      $location.$$search = {
        state: "I'm not valid JSON.",
        error: "invalid_client"
      };
      narrativeUrlObserverFactory();
      expect(unauthSpy).toHaveBeenCalled();
      expect($location.$$search.state).not.toBeDefined();
      expect($location.$$search.error).not.toBeDefined();
    });

    it('keeps parameters that are not needed.', function () {
      var unauthSpy = spyOn(authMock(), 'unauth');
      $location.$$search = {
        state: 'somestate',
        error: 'invalid_client',
        grizzly: 'bear'
      };
      narrativeUrlObserverFactory();
      expect($location.$$search.grizzly).toEqual('bear');
      expect($location.$$search.state).not.toBeDefined();
      expect($location.$$search.error).not.toBeDefined();
    });
  });
}());
