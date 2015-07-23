
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
        var start = keySerializer(this.name, "");
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
