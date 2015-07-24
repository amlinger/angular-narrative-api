
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
      this._options = options || {};

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
        throw "Need to invoke construct() before calling this method";
      return this._obj;
    },
    q: function () {
      throw "Abstract method q() must be overriden.";
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

  function NrtvItemResource(path, auth, config, request, $q) {
    NrtvResource.call(this, path, auth, config, request, $q);
  }
  NrtvItemResource.prototype = extend({}, NrtvResource.prototype, {
    _super: NrtvResource.prototype,
    construct: function(uuid, options) {
       this.uuid = uuid;
       return this._super.construct.call(this, options);
    },
    _constructFromObject: function(uuid, object, options) {
      this._obj = extend(this.construct(options), object);
      return this._obj;
    },
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
    path: function() {
      return this._super.path.call(this).replace(':uuid', this.uuid || "");
    }
  });
  NrtvItemResource.prototype.constructor = NrtvItemResource;


  function NrtvArrayResource(path, auth, config, request, $q) {
    NrtvResource.call(this, path, auth, config, request, $q);

    this._itemTransform = identity;
  }
  NrtvArrayResource.prototype = extend({}, NrtvResource.prototype, {
    _super: NrtvResource.prototype,
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
    itemTransform: function(itemTransform) {

      if (isUndefined(itemTransform))
        return this._itemTransform;

      this._itemTransform = chain(this._itemTransform, itemTransform);
      return this;
    },
    nextPage: function () {
      // If next us set to null, then we can return.
      if (this._object() && this._next === null) {
        throw "No more entries to get";
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
            ._constructFromObject(item.uuid, item);
        });
        resource.results.push.apply(resource.results, page.results);

        try {
          return resource._object();
        } catch (error) {
          return resource.$q.reject(error);
        }
      });
    },
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
    forEach: function (callback) {
      var index = 0, abort = false, defer = this.$q.defer(), resource = this;

      function doAbort() {
        abort = true;
      }

      function fetch() {
        while (index < resource.results.length) {
          callback(resource.results[index], index++, doAbort);
          if (abort) {
            defer.reject("FOREACH_ABORTED");
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

  function NarrativeItemFactory(NarrativeRequest, $q) {
    return function(path, auth, config) {
      return new NrtvItemResource(path, auth, config, NarrativeRequest, $q);
    };
  }

  function NarrativeArrayFactory(NarrativeRequest, $q) {
    return function(path, auth, config) {
      return new NrtvArrayResource(path, auth, config, NarrativeRequest, $q);
    };
  }

  angular.module('api.narrative')
    .factory('NarrativeItemFactory',
      ['NarrativeRequest', '$q', NarrativeItemFactory])
    .factory('NarrativeArrayFactory',
      ['NarrativeRequest', '$q', NarrativeArrayFactory]);
}(window, window.angular));
