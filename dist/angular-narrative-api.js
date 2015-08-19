(function () {
  'use strict';
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError(
        "Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {},
      fBound = function () {
        return fToBind.apply(this instanceof fNOP && oThis
            ? this
            : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
}());


(function (window, angular, undefined) {
  'use strict';

  /**
   * @ngdoc overview
   * @name api.narrative
   * @module api.narrative
   * @description
   * # Narrative API
   * This is the module container for `angular-narrative-api`, which can be
   * used for interacting with Narratives Open Platform.
   *
   * @example
   * ```javascript
   * angular.module('app', ['api.narrative'])
   *   .config(function (NarrativeAuthProvider , NarrativeRequestProvider) {
   *     NarrativeAuthProvider.defaults.oauthApplication = {
   *       clientID: "my-client-id",
   *       redirectURI: "my-root-uri",
   *       clientSecret: "my-client-secret"
   *     };
   *     // For now, Narrative does not support CORS on all URLS, so therefore
   *     // a proxy is usually necessary.
   *     NarrativeRequestProvider.defaults.api.proxy = 'http://cors.proxy/';
   *   })
   *   .controller('Controller', function (NarrativeAuth,  NarrativeApi) {
   *     var api = NarrativeApi(NarrativeAuth());
   *     // Go right ahead and use the Auth and the API!
   *   });
   * ```
   */
  angular.module('api.narrative', []);

}(window, window.angular));


(function (window, angular, undefined) {
  'use strict';

  var copy = angular.copy,
    toJson = angular.toJson,
    fromJson = angular.fromJson,
    forEach = angular.forEach,
    isUndefined = angular.isUndefined,
    localStorage = window.localStorage;

  /**
   * @ngdoc service
   * @module api.narrative
   * @name api.narrative.NarrativeCacheProvider
   *
   * @description
   * You can use `NarrativeCacheProvider` as a factory for creating named
   * caches with fallback to angulars `$cacheFactory`.
   */
  function NarrativeCacheProvider() {

    this.keySerializer = function (namespace, key) {
      return 'narrative.' + namespace + '.' + key;
    };
    var keySerializer = this.keySerializer, cache;

    /**
      * @ngdoc service
      * @module api.narrative
      * @name api.narrative.NarrativeCache.Cache
      *
      * @description
      * A cache object used to store and retrieve data.
      */
    cache = {
      initialize: function(name, $cache) {
        this.name = name;
        this.$cache = $cache;
      },

      /**
       * @ngdoc method
       * @name NarrativeCache.Cache#put
       * @methodOf api.narrative.NarrativeCache.Cache
       * @kind function
       *
       * @description
       * Adds entries in the cache.
       *
       * @param {string} key the key under which the cached data is stored.
       * @param {*} value the value to store alongside the key. If it is null
       *                  or undefined, the key will not be stored.
       * @returns {*} the value stored.
       */
      put: function(key, value) {
        localStorage.setItem(keySerializer(this.name, key), toJson(value));
        return this.$cache.put(key, value);
      },

      /**
       * @ngdoc method
       * @name NarrativeCache.Cache#get
       * @methodOf api.narrative.NarrativeCache.Cache
       * @kind function
       *
       * @description
       * Gets and entry from the cache.
       *
       * @param {string} key the key under which the cached data is stored.
       * @returns {*} the value stored, or `null`if the value does not exist.
       */
      get: function(key) {
        var hit = this.$cache.get(key);
        if (!hit) {
          hit = fromJson(localStorage.getItem(keySerializer(this.name, key)));
          if (hit) {
            this.$cache.put(key, hit);
          }
        }
        return hit === null ? undefined : hit;
      },

      /**
       * @ngdoc method
       * @name NarrativeCache.Cache#remove
       * @methodOf api.narrative.NarrativeCache.Cache
       * @kind function
       *
       * @description
       * Removes an entry from the cache.
       *
       * @param {string} key the key under which the cached data is stored.
       * @returns {*} the value stored.
       */
      remove: function (key) {
        var item = this.get(key);
        localStorage.removeItem(keySerializer(this.name, key));
        this.$cache.remove(key);
        return item;
      },

      /**
       * @ngdoc method
       * @name NarrativeCache.Cache#removeAll
       * @methodOf api.narrative.NarrativeCache.Cache
       * @kind function
       *
       * @description
       * Removes all entries from the cache.
       */
      removeAll: function () {
        var start = keySerializer(this.name, '');
        forEach(localStorage, function (value, key) {
          if (key.indexOf(start) === 0) {
            localStorage.removeItem(key);
          }
        });
        return this.$cache.removeAll();
      }
    };

    /**
     * @ngdoc service
     * @module api.narrative
     * @kind function
     * @name api.narrative.NarrativeCache
     * @requires $cacheFactory
     *
     * @description
     * Use the `NarrativeCache` as a factoy for creating a cache with similar
     * properties as a drop in replacement for `$cacheFactory` but that persists
     * to localStorage as well. If localStorage is not present, it will
     * fall back to `$cacheFactory`.
     *
     * @param {string} namespace Name or ID of the newly created cache.
     *
     * @returns {object} Newly created cache object with the following set
     *                         of methods:
     *
     * - `{object}` `info()` — Returns id, size, and options of cache.
     * - `{{*}}` `put({string} key, {*} value)` — Puts a new key-value pair
     *                        into the cache and returns it.
     * - `{{*}}` `get({string} key)` — Returns cached value for `key` or
     *                        undefined for cache miss.
     * - `{void}` `remove({string} key)` — Removes a key-value pair from the
     *                        cache.
     * - `{void}` `removeAll()` — Removes all cached values.
     * - `{void}` `destroy()` — Removes references to this cache from
     *                        $cacheFactory.
     */
    this.$get = ['$cacheFactory', function getCache($cacheFactory) {
      var cacheHash = {};

      // For now, local storage is required for this factory. If it is not
      // present, it will fall back on angulars $cacheFactory.
      if (isUndefined(localStorage)) {
        return $cacheFactory;
      }

      return function getCache(namespace) {
          var instance = cacheHash[namespace];
          if (!instance) {
            instance = copy(cache);
            instance.initialize(namespace, $cacheFactory(namespace));
            cacheHash[namespace] = instance;
          }
          return instance;
      };
    }];
  }

  // Registering the provider on the module.
  angular.module('api.narrative')
    .provider('NarrativeCache', NarrativeCacheProvider);

}(window, window.angular));

(function (window, angular, undefined) {
  'use strict';

  // Storing some shorthand functions that are used in this page.
  var forEach = angular.forEach,
    extend = angular.extend,
    toJson = angular.toJson,
    isUndefined = angular.isUndefined,
    isArray = angular.isArray,
    isString = angular.isString;

  function authHeadersFromToken(token) {
    return { Authorization: token.token_type + ' ' + token.access_token };
  }

  function isAuth(potentialAuth) {
    return potentialAuth.hasOwnProperty('token') &&
      potentialAuth.hasOwnProperty('getOauthToken');
  }

  /**
   * @ngdoc service
   * @module.api.narrative
   * @name api.narrative.NarrativeRequestProvider
   *
   * @description
   * `NarrativeRequestProvider` provides a request method that can be used
   * for fetching resources from Narratives API on Narratives Open Platform.
   */
  function NarrativeRequestProvider() {

    /**
     * @ngdoc property
     * @name NarrativeRequestProvider#defaults
     * @module api.narrative
     * @propertyOf api.narrative.NarrativeRequestProvider
     * @type {object}
     *
     * @description
     * The default settings for NarrativeRequest instances.
     */
    this.defaults = {

      /**
       * @ngdoc property
       * @name NarrativeRequestProvider#defaults['api']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeRequestProvider
       * @type {object}
       *
       * @description
       * The API paths used for communicating with the backend API.
       *
       * The default value is:
       * ---
       * ```
       * {
       *   proxy: "",
       *   baseUrl: "https://narrativeapp.com/",
       *   apiSuffix: "api/v2/"
       * }
       * ```
       */
      api: {
        proxy: '',
        baseUrl: 'https://narrativeapp.com/',
        apiSuffix: 'api/v2/'
      },

      /**
       * @ngdoc property
       * @name NarrativeRequestProvider#defaults['cacheFactory']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeRequestProvider
       * @type {Cache|boolean}
       *
       * @description
       * The cacheFactory producing the cache to be passed on to `$http`.
       * This could either be a cache instance or a boolean value for whether
       * a standard cacheFactory should be used or not.
       *
       * The default value is:
       * ---
       * ```
       * true
       * ```
       */
      cacheFactory: '$cacheFactory',

      paramSerializer: 'NarrativeParamSerializer'
    };
    var defaults = this.defaults;

    /**
     * A builder that combines the URLs provided in the API path along with
     * the passed URL to create a combined URL to make a request to.
     * @param  {string} url The relative URL to append to the base path.
     * @return {string}     The combined URL.
     */
    function fullPath(api, url) {
      return api.proxy + api.baseUrl + api.apiSuffix + url;
    }

    /**
     * Strips the base of the url in the passed parameter, the base being
     * the path to Narratives API.
     *
     * @param  {string} url The absolute URL to strip.
     * @return {string}     The relative, stripped URL.
     */
    function stripApiBase(api, url) {
      return url.replace(api.baseUrl + api.apiSuffix, '');
    }

    /**
     * @ngdoc service
     * @name api.narrative.NarrativeRequest
     * @module api.narrative
     * @requires $http
     *
     * @description
     * A method for making authorized requests with parameters to Narratives
     * API on Narratives Open Platform.
     *
     * @param  {string} method The HTTP method to be used for the reqest.
     * @param  {string} url The URL relative to the supplied full API URL.
     * @param  {object=} parameters Optional URL parameters to add to the
     *                              request.
     * @param  {NarrativeAuth|object=} authOrConfig Either a NarrativeAuth
     *                                              or a configuration object
     *                                              for this particular request.
     *                                              The configuraiton object
     *                                              accepts the same attributes
     *                                              as the default selection for
     *                                              `NarrativeCacheProvider`s
     *                                              `default` values.
     * @return {promise} Returns the promise produced by the `$http` service.
     */
    this.$get = [
      '$http', 'NarrativeAuth', '$injector',
      function ($http, narrativeAuth, $injector) {
      function request(method, url, parameters, authOrConfig) {
        var config, requestConfig, cacheFactory, cacheId,
          _tempConfig = authOrConfig || {};

        // If parameters are omitted, left shift the two last arguments.
        if (isAuth(_tempConfig)) {
          _tempConfig = {auth: _tempConfig};
        }

        // The request will be constructed throughout this function, with the
        // method and url attribute being the only necessary.
        config = extend({}, defaults, _tempConfig);

        if (!config.auth)
          config.auth = narrativeAuth();

        // Fetching the cache factory.
        if (isUndefined(config.cache)) {
          if(config.cacheFactory) {
            cacheFactory = config.cacheFactory;
            if (isString(cacheFactory)) {
              cacheFactory = $injector.get(cacheFactory);
            }
            cacheId = config.auth.config().name;
            config.cache = cacheFactory.get(cacheId) || cacheFactory(cacheId);
          } else {
            config.cache = false;
          }
        }

        requestConfig = {
          method: method,
          cache: config.cache,
          url: fullPath(config.api, url)
        };

        // Unauthorized requests may be allowed to some endpoints, so only add
        // headers if a valid session exists.
        if (config.auth.token()) {
          requestConfig.headers = authHeadersFromToken(config.auth.token());
        }

        if (!isUndefined(parameters)) {
          requestConfig = extend(requestConfig, {
            params: parameters,
            paramSerializer: config.paramSerializer
          });
        }

        return $http(requestConfig).then(function (result) {
          var data = result.data;

          // TODO: This should perhaps be relocated, it might not be the
          // responsibility for the Request service.
          if (data.next) {
            data.next = stripApiBase(defaults.api, data.next);
          }
          return data;
        });
      }

      return request;
    }];
  }

  /**
   * @ngdoc service
   * @name api.narrative.NarrativeParamSerializerProvider
   * @module api.narrative
   *
   * @description
   * `NarrativeParamSerializerProvider` provides a serializer for URL
   * parameters that should be passed to Narratives API on Narratives Open
   * Platform.
   */
  function NarrativeParamSerializerProvider() {

    /**
     * @ngdoc service
     * @name api.narrative.NarrativeParamSerializer
     * @module api.narrative
     *
     * @description
     * When called, it serializes the provided parameters provided according to
     * Narrative API:s needs. Arrays are converted into JSON format.
     *
     * @param {Object=} params The parameters that the serializer will turn
     *                         into a URL-friendly string.
     */
    this.$get = function () {
      return function NarrativeParamSerializer(params) {
        if (!params) return '';
        var parts = [];

        forEach(params, function (value, key) {
          // Ignore Parameters that are either null or undefined, but keeping
          // in mind that other falsy values are valid.
          if (value === null || isUndefined(value)) return;

          var rhs = value;
          if (isArray(value)) {
            rhs = toJson(value);
          }
          parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(rhs));
        });

        return parts.join('&');
      };
    };
  }

  // Registering the providers on the module.
  angular.module('api.narrative')
    .provider('NarrativeParamSerializer', NarrativeParamSerializerProvider)
    .provider('NarrativeRequest', NarrativeRequestProvider);

  }(window, window.angular));


(function (window, angular, undefined) {
  'use strict';

  var identity = angular.identity,
    extend = angular.extend,
    isUndefined = angular.isUndefined;

  function chain(callFirst, callSecond) {
    return function (argument) {
      return callSecond(callFirst(argument));
    };
  }

  function NrtvResource(path, auth, config, request, $q) {
    this._path = path;
    this._auth = auth;
    this._config = config || {};
    this._request = request;
    this.$q = $q;

    this._transform = identity;
  }
  NrtvResource.prototype = {

    construct: function (options) {
      this._options = options || {};

      this._obj = {
        q: this.q.bind(this),
        get: this.get.bind(this),
        path: this.path.bind(this),
        transform: this.transform.bind(this)
      };

      return this._obj;
    },
    _constructFromObject: function(options, object) {
      this._obj = extend(this.construct(options), object);
      return this._obj;
    },
    _object: function() {
      if(!this._obj)
        throw 'Need to invoke construct() before calling this method';
      return this._obj;
    },
    q: function () {
      throw 'Abstract method q() must be overriden.';
    },
    path: function () {
      return this._path;
    },
    get: function () {
      this.q();
      return this._obj;
    },
    transform: function(transform) {
      if (isUndefined(transform))
        return this._transform(this._object());
      this._transform = chain(this._transform, transform);
      return this;
    }
  };

  /**
   * @ngdoc service
   * @name api.narrative.NarrativeItemFactory
   * @module api.narrative
   * @requires NarrativeRequest
   * @requires $q
   *
   * @param {string} path    The path to the resource on top of the API URL.
   *                         This is expected to contain a segment :uuid which
   *                         can be swapped at `path()` requests for the actual
   *                         uuid.
   * @param {Auth}   auth    The authorization instance to use for fetching
   *                         data from the API.
   * @param {object=} config Used for configuring the defaults of this
   *                         resource.
   *
   * @description
   * Use `NarrativeItemFactory` for getting a resource specific for an API
   * hook.
   */
  function NrtvItemResource(path, auth, config, request, $q) {
    NrtvResource.call(this, path, auth, config, request, $q);
  }
  NrtvItemResource.prototype = extend({}, NrtvResource.prototype, {
    _super: NrtvResource.prototype,

    /**
     * @ngdoc method
     * @name construct
     * @module api.narrative
     * @methodOf api.narrative.NarrativeItemFactory
     *
     * @description
     * This constructs the object that can be used for API interaction, which
     * cleans up the object for being able to attach attributes to it. The
     * resulting object contains the following methods:
     * * `q` a promise for getting the data from Narrative.
     * * `get` Angular-style getter for inserting the ready object in the scope.
     * * `path` returns the path from the API URL to this object.
     * * `transform` adds a transform to the resorce.
     *
     * These are the same methods that are specified for this object.
     *
     * @param  {string} uuid    The uuid for this item.
     * @param  {object=} options Options which will be passed onto Narratives
     *                           API when retrieving this data.
     * @return {object}          An object containing a subset of methods that
     *                             are made public for the API user.
     */
    construct: function(uuid, options) {
       this.uuid = uuid;
       return this._super.construct.call(this, options);
    },

    /**
     * @ngdoc method
     * @name _constructFromObject
     * @module api.narrative
     * @methodOf api.narrative.NarrativeItemFactory
     *
     * @param  {string} uuid     The unique identifier for pointing out the
     *                           resource in Narrative API.
     * @param  {object} object   The object information that constructs this
     *                           instance.
     * @param  {object=} options Any options that should be passed on to
     *                           requests about this object.
     *
     * @description
     * Same as the `construct()` method but with an object parameter that
     * contains the object information. This is mostly used internally.
     *
     * @return {object}         The constructed object, see `construct()`.
     */
    _constructFromObject: function(uuid, object, options) {
      this._obj = extend(this.construct(uuid, options), object);
      return this._obj;
    },

    /**
     * @ngdoc method
     * @name transform
     * @module api.narrative
     * @methodOf api.narrative.NarrativeItemFactory
     *
     * @param  {transform=} transform The optional transform to be applied to
     *                                the transform chain.
     *
     * @description
     * Could be used as a getter if the transform argument is omitted, for
     * the transformed created() object.  If used as a setter by supplying the
     * transform argument, it adds the transform last in the chain of
     * transforms-
     *
     * @return {object|NrtvItemResource} Returns the transformed object if used
     *                                   as a getter, or `this` if used as a
     *                                   setter (for method chaining).
     */
    // transform

    /**
     * @ngdoc method
     * @name q
     * @module api.narrative
     * @methodOf api.narrative.NarrativeItemFactory
     *
     * @description
     * Returns a promise which is resolved when data is back from the server.
     * This promise is cached, and calling `q()` again will return the same
     * promise.
     *
     * @return {promise} A promise object that is resolved when the data is
     *                     fetched from Narratives API. It is rejected if
     *                     something goes wrong, or if `construct()` has not
     *                     been called yet.`
     */
    q: function () {
      if (!this._qPromise) {
        var item = this;
        this._qPromise = this
          ._request('GET', this.path(), this._options, this._auth)
          .then(function (data) {
            try {
              return extend(item._object(), data);
            } catch (error) {
              return item.$q.reject(error);
            }
          });
      }
      return this._qPromise;
    },

    /**
     * @ngdoc method
     * @name path
     * @module api.narrative
     * @methodOf api.narrative.NarrativeItemFactory
     *
     * @description
     * Builds the relative path to this object from the API root, by replacing
     * the string `':uuid'` with the actual uuid.
     *
     * @return {string} The path relative from the API root to this resource.
     */
    path: function() {
      return this._super.path.call(this).replace(':uuid', this.uuid || '');
    }
  });
  NrtvItemResource.prototype.constructor = NrtvItemResource;

  /**
   * @ngdoc service
   * @name api.narrative.NarrativeArrayFactory
   * @module api.narrative
   * @requires NarrativeRequest
   * @requires $q
   *
   * @param {string} path    The path to the resource on top of the API URL.
   *                         This is expected to contain a segment :uuid which
   *                         can be swapped at `path()` requests for the actual
   *                         uuid.
   * @param {Auth}   auth    The authorization instance to use for fetching
   *                         data from the API.
   * @param {object=} config Used for configuring the defaults of this
   *                         resource.
   *
   * @description
   * Use `NarrativeItemFactory` for getting a resource specific for an API
   * hook.
   */
  function NrtvArrayResource(path, auth, config, request, $q) {
    NrtvResource.call(this, path, auth, config, request, $q);

    this._itemTransform = identity;
  }
  NrtvArrayResource.prototype = extend({}, NrtvResource.prototype, {
    _super: NrtvResource.prototype,

    /**
     * @ngdoc method
     * @name construct
     * @module api.narrative
     * @methodOf api.narrative.NarrativeArrayFactory
     *
     * @description
     * This constructs the object that can be used for API interaction, which
     * cleans up the object for being able to attach attributes to it. The
     * resulting object contains the following methods:
     * * `q` a promise for getting the data from Narrative.
     * * `get` Angular-style getter for inserting the ready object in the scope.
     * * `path` returns the path from the API URL to this object.
     * * `transform` adds a transform to the resorce.
     * * `nextPage` fetches the next page in a paginated array. Initially
     *   equivalent of `q()`.
     * * `forEach` with a callback that is called for each iteration, and
     *   and can be aborted. This will run over all pages until aborted
     *   or no more items exist.
     * * `itemTransform` adds a transform to all elements that are to be
     *   fetched.
     * * `results` the array of results from the server.
     *
     * These are the same methods that are specified for this object.
     *
     * @param  {string} uuid    The uuid for this item.
     * @param  {object=} options Options which will be passed onto Narratives
     *                           API when retrieving this data.
     * @return {object}          An object containing a subset of methods that
     *                             are made public for the API user.
     */
    construct: function(options) {
      // TODO: Might need to rethink about previous, if a page number is in
      // the options list.
      this._next = this.path();
      this._previous = null;
      this._count = 0;
      this.results = [];

      return extend(this._super.construct.call(this, options), {
        nextPage: this.nextPage.bind(this),
        forEach: this.forEach.bind(this),
        itemTransform: this.itemTransform.bind(this),
        results: this.results
      });
    },


    /**
     * @ngdoc method
     * @name transform
     * @module api.narrative
     * @methodOf api.narrative.NarrativeArrayFactory
     *
     * @param  {transform=} transform The optional transform to be applied to
     *                                the transform chain.
     *
     * @description
     * Could be used as a getter if the transform argument is omitted, for
     * the transformed created() object.  If used as a setter by supplying the
     * transform argument, it adds the transform last in the chain of
     * transforms-
     *
     * @return {object|ArrayItemResource} Returns the transformed object if
     *                                   used as a getter, or `this` if used as
     *                                   a setter (for method chaining).
     */
    // transform

    /**
     * @ngdoc method
     * @name itemTransform
     * @module api.narrative
     * @methodOf api.narrative.NarrativeArrayFactory
     *
     * @param  {transform=} itemTransform The optional transform to be applied
     *                                to the itemTransform chain.
     *
     * @description
     * Could be used as a getter if the itemTransform argument is omitted, for
     * the transformed created() object when using `nextPage()` or similar
     * method for obtaining items.. If used as a setter by supplying the
     * transform argument, it adds the transform last in the chain of
     * itemTransform-
     *
     * @return {object|NrtvArrayResource} Returns the transformed object if used
     *                                   as a getter, or `this` if used as a
     *                                   setter (for method chaining).
     */
    itemTransform: function(itemTransform) {

      if (isUndefined(itemTransform))
        return this._itemTransform;

      this._itemTransform = chain(this._itemTransform, itemTransform);
      return this;
    },

    /**
     * @ngdoc method
     * @name q
     * @module api.narrative
     * @methodOf api.narrative.NarrativeArrayFactory
     *
     * @description
     * Returns a promise which is resolved when data is back from the server.
     * This promise is cached, and calling `q()` again will return the same
     * promise.
     *
     * This is essentially the same as calling nextPage(), but it will only do
     * the server request for the first page of the response.
     *
     * @return {promise} A promise object that is resolved when the data is
     *                     fetched from Narratives API. It is rejected if
     *                     something goes wrong, or if `construct()` has not
     *                     been called yet.`
     */
    q: function () {
      if (isUndefined(this._qPromise)) {
        try {
          this._qPromise = this.nextPage();
        } catch (error) {
          return this.$q.reject(error);
        }
      }
      return this._qPromise;
    },


    /**
     * @ngdoc method
     * @name nextPage
     * @module api.narrative
     * @methodOf api.narrative.NarrativeArrayFactory
     *
     * @description
     * Fetches the next page in a paginated response from Narratives server
     * endpoint. This is returned as a promise which is resolved when data is
     * back from the server.
     *
     * The response will contain *ALL* the results from the server, not only
     * from the next page.
     *
     * @return {promise} A promise object that is resolved when the data is
     *                     fetched from Narratives API. It is rejected if
     *                     something goes wrong, or if `construct()` has not
     *                     been called yet.`
     */
    nextPage: function () {
      // If next us set to null, then we can return.
      if (this._object() && this._next === null) {
        throw 'No more entries to get';
      }

      var resource = this;
      return this._request('GET', resource._next,
        resource.results.length ? null : resource._options,
        resource._auth
      ).then(function (page) {
        resource._next = page.next;
        resource._count = page.count;

        page.results = page.results.map(function (item) {
          var obj = new NrtvItemResource(resource.path() + ':uuid',
                                         resource._auth, {}, resource._request,
                                         resource._$q);

          return obj
            .transform(resource.itemTransform())
            ._constructFromObject(item.uuid, item)
            .transform();
        });
        resource.results.push.apply(resource.results, page.results);

        try {
          return resource._object();
        } catch (error) {
          return resource.$q.reject(error);
        }
      });
    },


    /**
     * @ngdoc method
     * @name forEach
     * @module api.narrative
     * @methodOf api.narrative.NarrativeArrayFactory
     *
     * @description
     * A lazy way of iterating through all pages in a paginated request. When
     * looping through the collection, new requests to the server will be made
     * as long as the iteration is not aborted.
     *
     * This returns a promise that is resolved when all pages have been
     * fetched.
     *
     * @param {function} callback The callback method for each iteration. This
     *                            should have the signature
     *                            `function(resource, index, abort)` where
     *                            `abort` is a method that can be called for
     *                            stopping the iterations and preventing
     *                            additional server requests.
     *
     * @return {promise} A promise object that is resolved when the all data is
     *                     fetched from Narratives API. It is rejected if
     *                     something goes wrong, or if the looping is
     *                     prevented.
     */
    forEach: function (callback) {
      var index = 0, abort = false, defer = this.$q.defer(), resource = this;

      function doAbort() {
        abort = true;
      }

      function fetch() {
        while (index < resource.results.length) {
          callback(resource.results[index], index++, doAbort);
          if (abort) {
            defer.reject('FOREACH_ABORTED');
            return;
          }
        }

        if (resource._next !== null) {
          resource.nextPage().then(fetch);
        } else {
          defer.resolve(resource);
        }
      }
      fetch();
      return defer.promise;
    }
  });
  NrtvArrayResource.prototype.constructor = NrtvArrayResource;


  /**
   * @name NarrativeItemFactory
   *
   * @description
   * The actual factory for NrtvItemResource.
   *
   * Resolves the dependencies for NrtvItemResource and instanciates it.
   *
   * @param {NarrativeRequst} NarrativeRequest NarrativeRequst dependency.
   * @param {$q} $q $q dependency.
   */
  function NarrativeItemFactory(NarrativeRequest, $q) {
    return function(path, auth, config) {
      return new NrtvItemResource(path, auth, config, NarrativeRequest, $q);
    };
  }

  /**
   * @name NarrativeArrayFactory
   *
   * @description
   * The actual factory for NrtvArrayResource.
   *
   * Resolves the dependencies for NrtvArrayResource and instanciates it.
   *
   * @param {NarrativeRequst} NarrativeRequest NarrativeRequst dependency.
   * @param {$q} $q $q dependency.
   */
  function NarrativeArrayFactory(NarrativeRequest, $q) {
    return function(path, auth, config) {
      return new NrtvArrayResource(path, auth, config, NarrativeRequest, $q);
    };
  }

  // Registers the factories on the module.
  angular.module('api.narrative')
    .factory('NarrativeItemFactory',
      ['NarrativeRequest', '$q', NarrativeItemFactory])
    .factory('NarrativeArrayFactory',
      ['NarrativeRequest', '$q', NarrativeArrayFactory]);
}(window, window.angular));

(function (window, angular, undefined) {
  'use strict';

  // Import shorthands for functions.
  var isString = angular.isString,
    isUndefined = angular.isUndefined,
    extend = angular.extend,
    toJson = angular.toJson,
    forEach = angular.forEach,
    fromJson = angular.fromJson;

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
       * @name NarrativeAuthProvider.defaults['cacheFactory']
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
      cacheFactory: 'NarrativeCache',

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
        authorize: 'https://narrativeapp.com/oauth2/authorize/',
        token: 'https://narrativeapp.com/oauth2/token/'
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
      var defer, cacheFactory, tempToken;

      this.$http = $http;
      this.$q = $q;
      this.$window = $window;
      this.$rootScope = $rootScope;
      this._onAuthCallbacks = [];

      // Config can be passed as only a string, in which case it should be
      // set as the name of the `NarrativeAuth`.
      config = isString(config) ? {name: config} : (config || {});
      this._config = extend({}, defaults, config);

      // This is the initial promise that is
      defer = this.$q.defer();
      defer.resolve(this);
      this._initialRequest = defer.promise;

      // Fetching the cache factory.
      cacheFactory = this._config.cacheFactory;
      if (isString(cacheFactory)) {
        cacheFactory = $injector.get(cacheFactory);
      }
      this._cache = cacheFactory(this._config.name);

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
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this._config.oauthApplication.redirectURI,
            client_id: this._config.oauthApplication.clientID
          },
          headers : {
            Authorization : 'Basic ' + window.btoa(
              this._config.oauthApplication.clientID + ':' +
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
      oauthImplicit: function (/*params*/) {
        throw 'Implicit Grant flow is not supported yet.';
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
      oauthClientCredentials: function(/*params*/) {
        throw 'Client Credentials Grant flow is not supported yet.';
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
      oauthRefreshToken: function (/*params*/) {
        throw 'Refresh Token Grant flow is not supported yet.';
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
              function (/*evt, auth*/) {
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
       *                     the reason `'AUTH_REQUIRED'` if not.
       */
      requireAuth: function () {
        var _auth = this;
        return this._initialRequest.then(function () {
          if (!_auth.token()) {
            return _auth.$q.reject('AUTH_REQUIRED');
          }
          return _auth._object;
        });
      },

      /**
       * @ngdoc method
       * @name NarrativeAuth.onAuth
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
            throw 'The given token is not valid!';

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

    /**
     * @ngdoc service
     * @name api.narrative.NarrativeUrlObserverFactory
     * @module api.narrative
     * @requires api.narrative.NarrativeAuth
     * @requires ng.$location
     * @requires ng.$window
     *
     * @description
     * Creates an instance that observes the URL for Oauth2 response
     * parameters. This is used internally for instanciating and triggers
     * the login flow when the URL search parameters corresponds to what a
     * Oauth login response looks like.
     *
     * @return {function} The factory function that creates the URL observer
     *                    instance.
     */
    .factory('NarrativeUrlObserverFactory', [
               'NarrativeAuth', '$location', '$window',
      function (narrativeAuth ,  $location ,  $window) {

        /**
         * @name rewriteSearchParams
         *
         * @description
         * Rewrites the search param field of a given URL to the given params.
         *
         * @param  {string} url    The original URL to be rewritten.
         * @param  {object} params Key/value pairs that will be parameters.
         * @return {string}        The rewritten URL.
         */
        this.rewriteSearchParams = function (url, params) {
          var qm = url.indexOf('?'), num = url.lastIndexOf('#'),
            parts = [],
            href = qm >= 0 ? url.substring(0, qm)
                           : ( num >= 0 ? url.substring(0, num) : url),
            hash = num >= 0 ? url.substring(num) : '';

          forEach(params, function(value, key) {
            parts.push(key + '=' + value);
          });

          return href + (parts.length ? '?' + parts.join('&') : '') + hash;
        };
        var rewriteSearchParams = this.rewriteSearchParams;

        /**
         * @name locationSearch
         *
         * @description
         *
         *
         * @param {string} url The URL to find the parameters in.
         * @return {object} The search parameters of the URL as key/value
         *                  pairs.
         */
        this.locationSearch = function(url) {
          var vars, idx = url.indexOf('?'), hash = {};

          if (idx !== -1) {
            vars = url.substring(idx + 1).split('#')[0];

            forEach((vars ? vars.split('&') : []), function (urlVar) {
              var pair = urlVar.split('=');
              // Remove trailing slashes
              hash[pair[0]] = pair[1].replace(/\/+$/, '');
            });
          }
          return hash;
        };
        var locationSearch = this.locationSearch;

        /**
         * @name cleanUpAndRedirectAfterPromise
         *
         * @description
         * Removes the state parameter and rewrites the current URL to match
         * the passed params object, minus the state parameter.
         *
         * @param  {object} params An object of the new paramters of the URL.
         *                         If a state parameter is present, it will
         *                         be removed from the object.
         * @param  {promise=} promise If included, and not in html5Mode, The
         *                            redirect will wait until after the
         *                            promise is resolved.
         */
        function cleanUpAndRedirectAfterPromise(params, promise) {
          delete params.state;

          if ($location.$$html5) {
            $location.search(params).replace();
          } else if (!isUndefined(promise)){
            promise.finally(function () {
              $window.location.replace(rewriteSearchParams(
                $location.absUrl(), params));
            });
          } else {
            $window.location.replace(rewriteSearchParams(
              $location.absUrl(), params));
          }
        }

        return function () {
          var hash = $location.$$html5 ? $location.search()
                                       : locationSearch($location.absUrl()),
            state = null;

          if(!hash.hasOwnProperty('state'))
            return;

          // If the state cannot be decoded, it was not NarrativeAuth that
          // sent the original request.
          try {
            state = fromJson(decodeURIComponent(hash.state));
          } catch (e) {
            return;
          }

          // For now, errors are just handled by logging out the Auth object,
          // cleaning up the parameters and mocing on.
          if (hash.hasOwnProperty('error')) {
            narrativeAuth(state.config).unauth();
            delete hash.error;
            cleanUpAndRedirectAfterPromise(hash);
          } else if (hash.hasOwnProperty('code')) {

            // The promise is added to the redirect function, as the redirect
            // cannot be performed until the token is fetched, since This
            // trigger a page reload.
            cleanUpAndRedirectAfterPromise(hash,
                narrativeAuth(state.config)
                  .getOauthToken(hash.code, state.parameters));
            delete hash.code;
          }
        };
      }])
    .run(['NarrativeUrlObserverFactory',
      function (narrativeUrlObserverFactory) {
        narrativeUrlObserverFactory();
      }]);
}(window, window.angular));

(function (window, angular, undefined) {
  'use strict';

  /**
   * @name constructItem
   *
   * @description
   * Returns a handler for constructing an item object.
   *
   * @param  {NrtvItemResource} hook The hook to construct for.
   * @return {function} A function with the signature(uuid, options).
   */
  function constructItem(factory, path, auth, transforms) {
    return function (uuid, options) {
      var hook = factory(path, auth, options);
      angular.forEach(transforms, function (transform) {
        hook.transform(transform);
      });
      return hook.construct(uuid, options).transform();
    };
  }

  /**
   * @name constructArray
   *
   * @description
   * Returns a handler for constructing an array object.
   *
   * @param  {NrtvArrayResource} hook The hook to construct for.
   * @return {function} A function with the signature(uuid, options).
   */
  function constructArray(factory, path, auth, transforms, itemTransforms) {
    return function (options) {
      var hook = factory(path, auth, options);
      angular.forEach(transforms, function (transform) {
        hook.transform(transform);
      });
      angular.forEach(itemTransforms, function (itemTransform) {
        hook.itemTransform(itemTransform);
      });
      return hook.construct(options).transform();
    };
  }

  /**
   * @ngdoc service
   * @name api.narrative.NarrativeApiProvider
   * @module api.narrative
   *
   * @description
   * Use `NarrativeApiProvider` to configure the defaults for `NarrativeApi`.
   */
  function NarrativeApiProvider() {

    /**
     * @ngdoc property
     * @name NarrativeApiProvider.defaults['auth']
     * @module api.narrative
     * @propertyOf api.narrative.NarrativeApiProvider
     * @type {NarrativeAuth}
     *
     * @description
     * The default Auth to use for the instances.
     */
    this.defaults = {
      auth : null
    };
    var defaults = this.defaults;

    /**
     * @ngdoc service
     * @name api.narrative.NarrativeApi
     * @module api.narrative
     * @requires api.narrative.NarrativeItemFactory
     * @requires api.narrative.NarrativeArrayFactory
     * @requires api.narrative.NarrativeAuth
     *
     * @param {object=} config The name or configuration of the instance to
     *                         fetch or create.
     * @description
     * Returns the Api instance.
     *
     * @return {Object} The Auth object representing the created instance.
     */
    function getAPI (itemFactory, arrayFactory, auth) {

      return function (config) {
        var api = {};

        config = angular.extend(defaults, config || {});
        if (!config.auth) {
          config.auth = auth();
        }

        function momentTransform(moment) {
          return angular.extend(moment, {
            positions: constructArray(
              arrayFactory, moment.path() + '/positions/', config.auth, [], []),
            photos: constructArray(
              arrayFactory, moment.path() + '/photos/', config.auth, [], [])
          });
        }

        /**
         * @ngdoc method
         * @name NarrativeAuth.moments
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvArrayResource} The corresponding array object for
         *                             the moments.
         */
        api.moments = constructArray(
          arrayFactory, 'moments/', config.auth, [], [momentTransform]);

        /**
         * @ngdoc method
         * @name NarrativeAuth.moment
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {string=} uuid The corresponding uuid for the resource.
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvItemResource} The corresponding item object for
         *                             the moment.
         */
        api.moment = constructItem(
          itemFactory, 'moments/:uuid', config.auth, [momentTransform]);

        /**
         * @ngdoc method
         * @name NarrativeAuth.photos
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvArrayResource} The corresponding array object for
         *                             the photos.
         */
        api.photos = constructArray(
          arrayFactory, 'photos/', config.auth, [], []);

        /**
         * @ngdoc method
         * @name NarrativeAuth.users
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvArrayResource} The corresponding array object for
         *                             the users.
         */
        api.users = constructArray(
          arrayFactory, 'users/', config.auth, [], []);

        /**
         * @ngdoc method
         * @name NarrativeAuth.user
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {string=} uuid The corresponding uuid for the resource.
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvItemResource} The corresponding item object for
         *                             the user.
         */
        api.user = constructItem(
          itemFactory, 'users/:uuid', config.auth, []);

        /**
         * @ngdoc method
         * @name NarrativeAuth.me
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvItemResource} The corresponding item object for
         *                             the user.
         */
        api.me = function (options) {
          return api.user('me', options);
        };

        return api;
      };
    }
    this.$get = ['NarrativeItemFactory', 'NarrativeArrayFactory',
      'NarrativeAuth', getAPI];
  }

  angular.module('api.narrative')
    .provider('NarrativeApi', NarrativeApiProvider);
}(window, window.angular));
