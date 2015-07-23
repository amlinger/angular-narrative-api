(function () {
  'use strict';
  var toJson = angular.toJson;


  describe('NarrativeCache', function () {
    var narrativeCacheProvider, narrativeCache, $cacheFactory, store,
      PrenamedCachFactoryMock, spies = {};

    beforeEach(module('api.narrative', function (_NarrativeCacheProvider_) {
      narrativeCacheProvider = _NarrativeCacheProvider_;
    }));
    beforeEach(module('api.narrative.mocks'));

    /*
     * A localStorage mock, that with spies to each method. This can be read
     * as a key-value store from the store variable, and the spies are
     * accessible through spies.desiredMethod)=.
     */
    beforeEach(function () {
      store = localStorage;

      spies.getItem = spyOn(localStorage, 'getItem').and.callFake(
        function (key) {
          return store[key];
      });
      spies.removeItem = spyOn(localStorage, 'removeItem').and.callFake(
        function (key) {
          delete store[key];
      });
      spies.setItem = spyOn(localStorage, 'setItem').and.callFake(
        function (key, value) {
          store[key] = value;
      });
      spies.clear = spyOn(localStorage, 'clear').and.callFake(
        function () {
          store = {};
      });
    });

    beforeEach(inject(function (_$cacheFactory_, _PrenamedCachFactoryMock_) {
      $cacheFactory = _$cacheFactory_;
      PrenamedCachFactoryMock = _PrenamedCachFactoryMock_;
      narrativeCache = narrativeCacheProvider.$get[1]($cacheFactory);
    }));

    it('uses keySerializer for serializing keys on put.', function () {
      var namespace = 'circus', key = 'ball-juggler', value = 'seal',
        cache = narrativeCache(namespace),
        originalSerializer = narrativeCacheProvider.keySerializer;

      cache.put(key, value);
      expect(store[originalSerializer(namespace, key)]).toBe(toJson(value));
    });

    it('returns undefined if key is not present in get().', function () {
      var cache = narrativeCache('farm-cache');
      expect(cache.get('tigers-arent-on-farms')).toBe(undefined);
    });

    it('gets values previously put.', function () {
      var namespace = 'circus', key = 'ball-juggler', value = 'seal',
        cache = narrativeCache(namespace),
        originalSerializer = narrativeCacheProvider.keySerializer;

      cache.put(key, value);
      expect(cache.get(key)).toBe(value);
    });

    it('gets values previously put, on page refresh', function () {
      var namespace = 'circus', key = 'ball-juggler', value = 'seal',
        cache = narrativeCache(namespace), factory,
        originalSerializer = narrativeCacheProvider.keySerializer;

      cache.put(key, value);
      expect(cache.get(key)).toBe(value);
      expect(spies.getItem).not.toHaveBeenCalled();

      // Renew CacheFactory
      factory = narrativeCacheProvider.$get[1](PrenamedCachFactoryMock);
      cache = factory(namespace);

      expect(cache.get(key)).toBe(value);
      expect(spies.getItem).toHaveBeenCalled();
    });

    it('returns undefined if key is not present in remove().', function () {
      var cache = narrativeCache('farm-cache');
      expect(cache.remove('tigers-arent-on-farms')).toBe(undefined);
    });

    it('returns the value stored on remove()', function () {
      var namespace = 'circus', key = 'ball-juggler', value = 'seal',
        cache = narrativeCache(namespace), factory,
        originalSerializer = narrativeCacheProvider.keySerializer;

      cache.put(key, value);
      expect(cache.remove(key)).toBe(value);
    });

    it('removes from localStorage on remove().', function () {
      var namespace = 'circus', key = 'ball-juggler', value = 'seal',
        cache = narrativeCache(namespace), factory,
        originalSerializer = narrativeCacheProvider.keySerializer;

      cache.put(key, value);
      expect(cache.get(key)).toBe(value);
      expect(spies.setItem.calls.mostRecent().args[1]).toBe(toJson(value));

      cache.remove(key);
      expect(cache.get(key)).toBe(undefined);
      // This should be undefined and not null, as we are checking the object
      // which will return undefined if a key is not found. However, removeItem
      // should always return null if the key is not found.
      expect(store[originalSerializer(namespace, key)]).toBe(undefined);
      expect(spies.removeItem).toHaveBeenCalled();
    });

    it('removes from localStorage on removeAll().', function () {
      var namespace = 'circus', key = 'ball-juggler', value = 'seal',
        cache = narrativeCache(namespace), factory,
        originalSerializer = narrativeCacheProvider.keySerializer;

      cache.put(key, value);
      expect(cache.get(key)).toBe(value);
      expect(spies.setItem.calls.mostRecent().args[1]).toBe(toJson(value));

      cache.removeAll();
      expect(cache.get(key)).toBe(undefined);
      // This should be undefined and not null, as we are checking the object
      // which will return undefined if a key is not found. However, removeItem
      // should always return null if the key is not found.
      expect(store[originalSerializer(namespace, key)]).toBe(undefined);
      expect(spies.removeItem).toHaveBeenCalled();
    });
  });
}());
