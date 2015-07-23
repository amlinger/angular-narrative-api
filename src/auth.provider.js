(function (window, angular, undefined) {
  'use strict';

  // Import shorthands for functions.
  var isString = angular.isString,
    extend = angular.extend,
    toJson = angular.toJson,
    forEach = angular.forEach,
    fromJson = angular.toJson;

  /**
   * @name eventName
   * @description
   * Based on an event string and a the name of a Auth Service, it resolves
   * a name for an event specific for that named Auth Service.
   *
   * @param  {string} event The name of the event.
   * @param  {string} name  The name of the Auth.
   * @return {string}       The name of the event.
   */
  function eventName(event, name) {
    return name + '.' + event;
  }


  /**
   * @ngdoc service
   * @name NarrativeAuthProvider
   * @module api.narrative
   *
   * @description
   * Describe
   */
  function NarrativeAuthProvider() {

    this.defaults = {

      /**
       * @name NarrativeAuthProvider.defaults.name
       * @type {String} The default name of the global Auth.
       */
      name: 'global',

      /**
       * @name NarrativeAuthProvider.defaults.cacheFactoy
       * @type {CacheFactory-like}
       */
      cacheFactoy: 'NarrativeCache',

      /**
       * @name oauthApplication
       * @type {Object}
       *
       * @description
       * Defines the settings of the default oauth application that is used to
       * verify the user. The required fields are:
       * * redirectURI - Where this app resides, which should reflect the
       *     applications base path.
       * * cliendID - The clients ID, which can be found in Narratives Open
       *     Platform.
       * * clientSecret - The clients secret, which can be found in Narratives
       *     Open Platform.
       *
       * *NOTE*
       * This is bad practice, a browser library should not know the Client
       * Secret, but Narrative does not support any other Grant flow at the
       * moment of writing. Use with care.
       *
       * TODO: Attempt to use Implicit Grant Flow instead of the current flow.
       *
       */
      oauthApplication: {
        clientID: null,
        redirectURI: null,
        clientSecret: null
      },

      /**
       * @name oauthRoutes
       * @type {Object}
       *
       * @description
       * The redirect routes used for the oauth requests.
       */
      oauthRoutes: {
        authorize: "https://narrativeapp.com/oauth2/authorize/",
        token: "https://narrativeapp.com/oauth2/token/"
      }
    };
    var defaults = this.defaults;

    function NarrativeAuth(config, $http, $q, $window, $rootScope, $injector) {
      var defer, cacheFactoy, tempToken;

      this.$http = $http;
      this.$q = $q;
      this.$window = $window;
      this.$rootScope = $rootScope;

      // Config can be passed as only a string, in which case it should be
      // set as the name of the `NarrativeAuth`.
      config = isString(config) ? {name: config} : (config || {});
      this._config = extend(defaults, config);

      // This is the initial promise that is
      defer = this.$q.defer();
      defer.resolve(this);
      this._initialRequest = defer.promise;

      // Fetching the cache factory.
      cacheFactoy = this._config.cacheFactoy;
      if (isString(cacheFactoy)) {
        cacheFactoy = $injector.get(cacheFactoy);
      }
      this._cache = cacheFactoy(this._config.name);

      // Initially, the token is set to null, which indicates that we are not
      // logged in.
      this._token = null;

      tempToken = this._cache.get('token');
      if (tempToken) {
        this.fromTokenObject(tempToken);
      }
    }
    NarrativeAuth.prototype = {

      /**
       * @name construct
       *
       * @description
       * Returns an Auth object that represents the Authorization, which does
       * not expose more methods than necessary.
       *
       * @return {Object} The Auth object representing this instance.
       */
      construct: function () {
        this._object = {
          getOauthToken: this.getOauthToken.bind(this),
          oauthAuthorizationCode: this.oauthAuthorizationCode.bind(this),
          oauthImplicit: this.oauthImplicit.bind(this),
          oauthClientCredentials: this.oauthClientCredentials.bind(this),
          oauthRefreshToken: this.oauthRefreshToken.bind(this),
          isLoggedIn: this.isLoggedIn.bind(this),
          waitForAuth: this.waitForAuth.bind(this),
          requireAuth: this.requireAuth.bind(this),
          token: this.token.bind(this),
          fromTokenObject: this.fromTokenObject.bind(this),
          authorizationHeaders: this.authorizationHeaders.bind(this),
          unauth: this.unauth.bind(this),
          config: this.config.bind(this)
        };

        return this._object;
      },
      /**
       * @
       * @name config
       * @return {[type]} [description]
       */
      config: function () {
        return this._config;
      },
      _oauthInitRedirect: function (grantType, params) {

        var state = {config: this._config},
          oauthApplication = this._config.oauthApplication;
        if (params) state.parameters = params;

        this.$window.location.replace(
          this._config.oauthRoutes.authorize + '?' +
            'redirect_uri=' + oauthApplication.redirectURI + '&' +
            'response_type=' + grantType + '&' +
            'client_id=' + oauthApplication.clientID + '&' +
            'state=' + encodeURIComponent(toJson(state))
        );
      },
      getOauthToken: function (code, parameters) {
        var _auth = this,
          defer = this.$q.defer();

        this._initialRequest = defer.promise;

        return this.$http({
          url: this._config.oauthRoutes.token,
          method: 'POST',
          params: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: this._config.oauthApplication.redirectURI,
            client_id: this._config.oauthApplication.clientID
          },
          headers : {
            Authorization : "Basic " + window.btoa(
              this._config.oauthApplication.clientID + ":" +
                this._config.oauthApplication.clientSecret)
            }
        }).then(function (tokenData) {
          defer.resolve(_auth.fromTokenObject(tokenData.data));
          return _auth;
        });
      },
      oauthAuthorizationCode: function (params) {
        this._oauthInitRedirect('code', params);
      },
      oauthImplicit: function (params) {
        throw "Implicit Grant flow is not supported yet.";
      },
      oauthClientCredentials: function(params) {
        throw "Client Credentials Grant flow is not supported yet.";
      },
      oauthRefreshToken: function (params) {
        throw "Refresh Token Grant flow is not supported yet.";
      },
      isLoggedIn: function () {
        return this._token !== null;
      },
      waitForAuth: function () {
        var _auth = this;
        return this._initialRequest.then(function () {
          if (_auth.isLoggedIn()) {
            return _auth;
          } else {
            var defer = _auth.$q.defer();
            _auth.$rootScope.$on(eventName(_auth._config.name, 'onlogin'),
              function (evt, auth) {
                defer.resolve(auth);
              }
            );
            return defer.promise;
          }
        });
      },
      requireAuth: function () {
        var _auth = this;
        return this._initialRequest.then(function () {
          if (!_auth.isLoggedIn()) {
            return _auth.$q.reject("AUTH_REQUIRED");
          }
          return _auth;
        });
      },
      _validateToken: function (token) {
        return true;
      },
      token: function () {
        return this._token;
      },
      fromTokenObject: function (tokenObject) {
        if (!this._validateToken(tokenObject)) return this;

        if (this._cache) this._cache.put('token', tokenObject);

        this._token = tokenObject;
        this.$rootScope.$broadcast(eventName(this._config.name, 'onlogin'),
                                        this);

        // Here we should emit some event that one might listen to.
        return this;
      },
      authorizationHeaders : function () {
        return {
          Authorization : this._token.token_type + " " +
            this._token.access_token
        };
      },
      unauth: function () {
        // Log out
        if(this._cache) {
          this._cache.removeAll();
        }
        this._token = null;
      }
    };

    this.$get = ['$http', '$q', '$window', '$rootScope', '$injector',
      function (  $http ,  $q ,  $window ,  $rootScope ,  $injector) {

        // This is the map used for all the instantiated authorizations.
        var authorizations = {};

        return function(config) {
          var auth, _conf = (config || {}),
            name = isString(_conf) ? _conf : (_conf.name || defaults.name);

          if (!authorizations.hasOwnProperty(name)) {
            auth = new NarrativeAuth(config, $http, $q, $window, $rootScope,
              $injector);
            authorizations[name] = auth.construct();
          }

          return authorizations[name];
        };
      }];
  }

  angular.module('api.narrative')
    .provider('NarrativeAuth', NarrativeAuthProvider)
    .factory('NarrativeUrlObserverFactory', [
               'NarrativeAuth', '$location', '$window',
      function (narrativeAuth ,  $location ,  $window) {

        function redirectToHash(params) {
          var absUrl = $location.absUrl(),
            base = absUrl.substring(0, absUrl.indexOf('?')),
            hash = absUrl.substring(0, absUrl.lastIndexOf('#') + 1),
            parts = [];

          forEach(params, function(value, key) {
            parts.push(key + '=' + value);
          });

          $window.location.href = base;
          if (parts) {
            $window.location.search = parts.join('&');
          }
          $window.location.hash = hash;
          $window.location.replace();
        }

        function cleanUpAndRedirect(params) {
          delete params.state;
          if ($location.$$html5) {
              $location.search(params).replace();
          } else {
            redirectToHash(params);
          }
        }

        /**
         * @name locationSearch
         * @description
         *
         *
         * @return {Object} [description]
         */
        this.locationSearch = function() {
          var vars, url = $location.absUrl(), idx = url.indexOf('?'), hash = {};

          if (idx !== -1) {
            vars = url.substring(idx + 1).split('#')[0];

            forEach((vars ? vars.split("&") : []), function (urlVar) {
              var pair = urlVar.split("=");
              // Remove trailing slashes
              hash[pair[0]] = pair[1].replace(/\/+$/, "");
            });
          }
          return hash;
        };
        var locationSearch = this.locationSearch;

        return function () {
          var hash = $location.$$html5 ? $location.search()
                                       : locationSearch($location.absUrl()),
            state = null;

          if(!hash.hasOwnProperty('state'))
            return;

          state = fromJson(decodeURIComponent(hash['state']));

          if (hash.hasOwnProperty('error')) {
            narrativeAuth(state.config).unauth();
            delete hash.error;
            cleanUpAndRedirect(hash);
          } else if (hash.hasOwnProperty('code')) {
            narrativeAuth(state.config)
              .getOauthToken(hash.code, state.parameters);
            delete hash.code;
            cleanUpAndRedirect(hash);
          }
        };
      }])
    .run(['NarrativeUrlObserverFactory',
      function (narrativeUrlObserverFactory) {
        narrativeUrlObserverFactory();
      }]);
}(window, window.angular));
