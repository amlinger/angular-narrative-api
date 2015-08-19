
(function (window, angular, undefined) {
  'use strict';

  var identity = angular.identity,
    bind = angular.bind,
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
        q: bind(this, this.q),
        get: bind(this, this.get),
        path: bind(this, this.path),
        transform: bind(this, this.transform)
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
        nextPage: bind(this, this.nextPage),
        forEach: bind(this, this.forEach),
        itemTransform: bind(this, this.itemTransform),
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
          var obj = new NrtvItemResource(resource.path() + ':uuid/',
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
