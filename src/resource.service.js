
(function () {
  'use strict';

  angular.module('api.narrative')
    .factory('api.narrative.Resource', ['NarrativeRequest', '$q',
      function (requestHandler, $q) {
        var BaseResource = {
          setPath: function (path) {
            this.__path = path;
          },
          setAuth: function (auth) {
            this.__auth = auth;
          },
          loaded: function (isLoaded) {
            if (isLoaded !== undefined) {
              this.__loaded = isLoaded;
            }
            return !!this.__loaded;
          },
          /*
           * Angular-style getter, mainly for scope usage.
           *
           */
          get: function () {
            this.q();
            return this;
          },
          transform: function (transformation) {
            return transformation(this);
          }
        },
          ItemResource = {
            initialize: function (uuid, options) {
              this.uuid = uuid || this.uuid;
              this.__options = options || {};
              return this;
            },
            fromObject: function (object, parent, overrides) {
              var child = angular.extend(object, this);
              child.__options = parent.__options;
              child.__path = object.url || parent.__path;
              child.__auth = parent.__auth;

              return child;
            },
            getPath: function () {
              return this.__path.replace(':uuid', this.uuid);
            },
            q: function() {
              var resource = this;
              return requestHandler(
                'GET', this.getPath(), this.__options, this.__auth
              ).then(function (newResource) {
                return angular.extend(resource, newResource);
              });
            }
          },
          ArrayResource = {
            initialize: function (options) {
              this.__options = options || {};
              this.next = this.__path;
              this.previous = null;
              this.results = [];
              this.itemTransform = this.itemTransform || angular.identity;
              return this;
            },
            setItemTransform: function (transform) {
              this.itemTransform = transform;
              return this;
            },
            getPath: function () {
              return this.__path;
            },
            nextPage: function () {
              // We only have to worry about null.
              if (this.next === null) {
                throw "No more entries to get";
              }
              var resource = this;
              return requestHandler('GET', resource.next,
                resource.results.length ? null : resource.__options,
                resource.__auth
              ).then(function (page) {
                resource.next = page.next;

                page.results = page.results.map( function (newObj) {
                  return resource.itemTransform(
                    ItemResource.fromObject(newObj, resource));
                });
                resource.results.push.apply(resource.results, page.results);
                return resource;
              });
            },
            q: function () {
              return this.nextPage();
            },
            forEach: function (callback) {
              var index = 0, abort = false, defer = $q.defer(), resource = this;
              function doAbort() {
                abort = true;
              }

              function fetch() {
                while (index < this.results.length) {
                  callback(this.results[index], index++, doAbort);
                  if (abort) {
                    defer.reject("Foreach aborted.");
                    return;
                  }
                }

                if (this.next !== null) {
                  this.nextPage().then(fetch);
                } else {
                  defer.resolve(resource);
                }
              }
              fetch();
              return defer.promise;
            }
          };
        var prev = null;
        return {
          ItemFactory: function (auth, path) {
            var resource = angular.extend({}, ItemResource, BaseResource);
            resource.setAuth(auth);
            resource.setPath(path);

            return {
              create : function () {
                return function(uuid, options) {
                  return resource.initialize(uuid, options);
                };
              },
              transform : function (transform) {
                resource.transform(transform);
                return this;
              }
            };
          },
          ArrayFactory: function (auth, path) {
            var resource = angular.extend({}, ArrayResource, BaseResource);
            resource.setAuth(auth);
            resource.setPath(path);
            return {
              create : function () {
                return function(options) {
                  return resource.initialize(options);
                };
              },
              itemTransform : function (transform) {
                resource.setItemTransform(transform);
                return this;
              }
            };
          }
        };
      }]);
}());
