(function (window, angular, undefined) {
  'use strict';

  // Import shorthands for functions.
  var isString = angular.isString,
    isUndefined = angular.isUndefined,
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
   * @name api.narrative.NarrativeAuthProvider
   * @module api.narrative
   *
   * @description
   * Use `NarrativeAuthProvider` for changing the default behaviour of
   * `NarrativeAuth`.
   */
  function NarrativeAuthProvider() {


    /**
     * @ngdoc property
     * @name NarrativeAuthProvider#defaults
     * @module api.narrative
     * @propertyOf api.narrative.NarrativeAuthProvider
     *
     * @description
     * The default attributes for the Authorization instances. Each instance
     * can be configured individually by passing a configuration object to
     * the instantiation of a `NarrativeAuth`.
     */
    this.defaults = {

      /**
       * @ngdoc property
       * @name NarrativeAuthProvider#defaults['name']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeAuthProvider
       * @type {string}
       *
       * @description
       * The default name of the global Authorization instance.
       *
       * The default value is:
       * ---
       * ```
       * 'global'
       * ```
       */
      name: 'global',

      /**
       * @ngdoc property
       * @name NarrativeAuthProvider.defaults['cacheFactoy']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeAuthProvider
       * @type {CacheFactory-like|string}
       *
       * @description
       * The default cache factory for storing information Authorization
       * instances. Accepts either a string (which will be resolved using
       * `$injector`) or some CacheFactory-like object such as
       * `$cacheFactory`.
       *
       * The default value is:
       * ---
       * ```
       * 'NarrativeCache'
       * ```
       */
      cacheFactoy: 'NarrativeCache',

      /**
       * @ngdoc property
       * @name NarrativeAuthProvider.defaults['oauthApplication']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeAuthProvider
       * @type {Object}
       *
       * @description
       * Defines the settings of the default Oauth application that is used to
       * verify the user. The required fields are:
       * * `redirectURI` - Where this app resides, which should reflect the
       *     applications base path.
       * * `clientID` - The clients ID, which can be found in Narratives Open
       *     Platform.
       * * `clientSecret` - The clients secret, which can be found in
       *     Narratives Open Platform.
       *
       * The default values are:
       * ---
       * ```js
       * {
       *   clientID: null,
       *   redirectURI: null,
       *   clientSecret: null
       * }
       * ```
       *
       * NOTE
       * ---
       * This is bad practice, a browser library should not know the Client
       * Secret, but Narrative does not support any other Grant flow at the
       * moment of writing. Use with care.
       */
      oauthApplication: {
        clientID: null,
        redirectURI: null,
        clientSecret: null
      },

      /**
       * @ngdoc property
       * @name NarrativeAuthProvider.defaults['oauthRoutes']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeAuthProvider
       * @type {Object}
       *
       * @description
       * The redirect routes used for Oauth requests. The routes being used
       * are:
       * * `authorize` - The redirect for where the client is sent on
       *     authorization.
       * * `token` - The URL where the request is sent for in the Authorization
       *     Code Grant.
       *
       * The default values are:
       * ---
       * ```js
       * {
       *   authorize: "https://narrativeapp.com/oauth2/authorize/",
       *   token: "https://narrativeapp.com/oauth2/token/"
       * }
       * ```
       */
      oauthRoutes: {
        authorize: "https://narrativeapp.com/oauth2/authorize/",
        token: "https://narrativeapp.com/oauth2/token/"
      }
    };
    var defaults = this.defaults;


    /**
     * @ngdoc service
     * @name api.narrative.NarrativeAuth
     * @module api.narrative
     * @requires $http
     * @requires $q
     * @requires $window
     * @requires $rootScope
     * @requires $injector
     *
     * @param {object|string=} config The name or configuration of the instance
     *                                to fetch or create.
     *
     * @description
     * Use `NarrativeAuthProvider` for changing the default behaviour of
     * `NarrativeAuth`.
     *
     * NOTE
     * ---
     * A NarrativeAuth with a specific name can only be created *ONCE*. It
     * does not matter if it is firstly instantiated with just a name, and
     * then referenced with a config, but this config will have not effect:
     * ```javascript
     * // Creates the instance
     * var unconfigured = NarrativeAuth('AuthorityChicken');
     *
     * // Just a reference to the created instance
     * var configured = NarrativeAuth({
     *   // A bunch of cool configurations
     *   name : 'AuthorityChicken'
     * });
     *
     * // None of the cool configurations has any effect, only defauts active!
     * unconfigured === configured; // True
     * ```
     *
     * @return {Object} The Auth object representing the created instance.
     */
    function NarrativeAuth(config, $http, $q, $window, $rootScope, $injector) {
      var defer, cacheFactoy, tempToken;

      this.$http = $http;
      this.$q = $q;
      this.$window = $window;
      this.$rootScope = $rootScope;
      this._onAuthCallbacks = [];

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
        this.token(tempToken);
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
       * @return {object} The Auth object representing this instance.
       */
      construct: function () {
        this._object = {
          getOauthToken: this.getOauthToken.bind(this),
          oauthAuthorizationCode: this.oauthAuthorizationCode.bind(this),
          oauthImplicit: this.oauthImplicit.bind(this),
          oauthClientCredentials: this.oauthClientCredentials.bind(this),
          oauthRefreshToken: this.oauthRefreshToken.bind(this),
          waitForAuth: this.waitForAuth.bind(this),
          requireAuth: this.requireAuth.bind(this),
          onAuth: this.onAuth.bind(this),
          token: this.token.bind(this),
          unauth: this.unauth.bind(this),
          config: this.config.bind(this)
        };

        return this._object;
      },

        /**
       * @name _oauthInitRedirect
       *
       * @description
       * Redirects the window location to the set Oauth server landing page.
       *
       * @param {string} grantType Which type of Grant that is desired.
       * @param {object} params Additional params which will be JSON
       *                        encoded and sent with the State URL
       *                        parameter to the outh server.
       */
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

      /**
       * @ngdoc method
       * @name NarrativeAuth.config
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @description
       * A getter for the config object used to create this instance.
       *
       * @return {object} The config object used to create this
       *                  Authorization instance.
       */
      config: function () {
        return this._config;
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.getOauthToken
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {string} code The code fetched from the URL in a redirect
       *                      call from the Oauth server.
       * @param {object=} parameters Additional parameters for the callback
       *                             after authorization to recieve.
       *
       * @description
       * Makes a POST request to the Oauth server requesting a token. This
       * is implemented supporting the Authorization Code Grant Flow, requiring
       * both a client ID and a Client secret to be set.
       *
       * This also prevents `requireAuth()` from instantly rejecting the
       * promise when not logged in, but instead makes it wait until the
       * outcome of this method is decided.
       *
       * @return {Promise} A promise that resolves when a response is recieved,
       *                     in which case it will contain the authorized
       *                     instance. If the code is not correct or the $http
       *                     fails in some way, the promise will be rejected
       *                     with an appropriate reason.
       */
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
          _auth.token(tokenData.data);

          if (_auth.token()) {
              defer.resolve(_auth.token());

              forEach(_auth._onAuthCallbacks, function (cb) {
                cb.callback.call(cb.context, _auth._object, parameters);
              });

              return _auth;
          }
          return this.$q.reject('MALFORMED_TOKEN');
        }, defer.reject);
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.oauthAuthorizationCode
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {object=} parameters Additional parameters for the callback
       *                             after authorization to recieve.
       *
       * @description
       * Redirects the window location to the set Oauth server landing page,
       * and initializes a Authorization Code Grant flow.
       */
      oauthAuthorizationCode: function (params) {
        this._oauthInitRedirect('code', params);
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.oauthImplicit
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {object=} parameters Additional parameters for the callback
       *                             after authorization to recieve.
       *
       * @description
       * *NOT IMPLEMENTED YET.*
       */
      oauthImplicit: function (params) {
        throw "Implicit Grant flow is not supported yet.";
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.oauthClientCredentials
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {object=} parameters Additional parameters for the callback
       *                             after authorization to recieve.
       *
       * @description
       * *NOT IMPLEMENTED YET.*
       */
      oauthClientCredentials: function(params) {
        throw "Client Credentials Grant flow is not supported yet.";
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.oauthRefreshToken
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {object=} parameters Additional parameters for the callback
       *                             after authorization to recieve.
       *
       * @description
       * *NOT IMPLEMENTED YET.*
       */
      oauthRefreshToken: function (params) {
        throw "Refresh Token Grant flow is not supported yet.";
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.waitForAuth
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @description
       * This creates a promise which is returned and never rejected, only
       * resolved after a successful login.
       *
       * If a reject is desired from the promise when it is not authenticated,
       * please see `requireAuth()`.
       *
       * @return {Promise} A promise that resolves when a successful login has
       *                     been made. This promise will be resolved with the
       *                     successful auth object.
       */
      waitForAuth: function () {
        var _auth = this;
        return this._initialRequest.then(function () {
          if (_auth.token()) {
            return _auth._object;
          } else {
            var defer = _auth.$q.defer();
            _auth.$rootScope.$on(eventName(_auth._config.name, 'auth'),
              function (evt, auth) {
                defer.resolve(_auth._object);
              }
            );
            return defer.promise;
          }
        });
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.requireAuth
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @description
       * This creates a promise which is returned and resolved if the Auth
       * instance has a token, and rejected if not. If a token fetch is in
       * progress, this will wait for that fetch to resolve before moving on
       * to determine the outcome of the returned promise.
       *
       * If no reject is desired when waiting for the authentication to
       * complete, please see `waitForAuth()`.
       *
       * @return {Promise} A promise that resolves with the auth object if
       *                     a successful login has been made, and rejects with
       *                     the reason `"AUTH_REQUIRED"` if not.
       */
      requireAuth: function () {
        var _auth = this;
        return this._initialRequest.then(function () {
          if (!_auth.token()) {
            return _auth.$q.reject("AUTH_REQUIRED");
          }
          return _auth._object;
        });
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.token
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {function} callback A callback function with the signature
       *                            `function(NarrativeAuth, object)` where
       *                            NarrativeAuth is the newly authenticated
       *                            object, and object is the optional state
       *                            parameters passed from the oauth initiator.
       * @param {*=} context An optional context for the callback.
       *
       * @description
       * Sets a callback for when the user is authenticated by the server.
       * **Note that this only applies for when the user is authenticated by
       * the server, not for when the token is set by the `token()` method.
       *
       * @return {NarrativeAuth} `this`is returned for chaining purposes.
       */
      onAuth: function (callback, context) {
        this._onAuthCallbacks.push({
          callback: callback,
          context: context || this
        });

        return this._object;
      },

      /**
       * @name _validateToken
       *
       * @description
       * Tests the tokenObject to see if it is valid or not. For now, this is
       * done by a naïve check for `'token_type'` and `'access_token'` among
       * the attributes.
       *
       * @param  {object} tokenObject The tokenObject to test.
       * @return {boolean}            Whether the tokenObject has the correct
       *                              attrbutes.
       */
      _validateToken: function (tokenObject) {
        return tokenObject.hasOwnProperty('token_type') &&
          tokenObject.hasOwnProperty('access_token');
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.token
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @param {object=} tokenObject A token object contining at least the the
       *                              attributes `token_type` and
       *                              `access_token`. If omitted, the method
       *                              will return any existing token.
       *
       * @description
       * `token()` provides a getter when no arguments are supplied or as a
       * setter if a token is provided. It will still return the token if used
       * as a setter.
       *
       * On a successful set of the token, an event will be emitted on the
       * $rootScope, which will be called `'[auth_name].auth'`. This will
       * contain the Auth instance as an argument.
       *
       * @throws Will throw an exception if used as a setter without a valid
       *         token.
       *
       * @return {object|null} The token object assoiciated with this Auth
       *                           instance, or `null` if not authenticeted yet.
       */
      token: function (tokenObject) {
        if (!isUndefined(tokenObject)) {
          if (!this._validateToken(tokenObject))
            throw "The given token is not valid!";

          this._cache.put('token', tokenObject);

          this._token = tokenObject;
          this.$rootScope.$emit(
            eventName(this._config.name, 'auth'), this._object);
        }

        return this._token;
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.unauth
       * @module api.narrative
       * @methodOf api.narrative.NarrativeAuth
       *
       * @description
       * Will remove the token from this instance, and from the cache as well,
       * along with all data stored in the same namespace in the cache.
       *
       * On a removel of the token, an event will be emitted on the
       * $rootScope, which will be called `'[auth_name].unauth'`. This will
       * contain the Auth instance as an argument.
       */
      unauth: function () {
        if(this._cache) {
          this._cache.removeAll();
        }
        this._token = null;

        this.$rootScope.$emit(
          eventName(this._config.name, 'unauth'), this._object);
      }
    };

    /**
     * @name $get
     * @type {Array}
     *
     * @description
     * This is the actual definition/method of which the NarrativeAuth is
     * instantiated. This keeps track of different Auths, and acts as a
     * factory only creating a single new instance of each name being passed.
     */
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
