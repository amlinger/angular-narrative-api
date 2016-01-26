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
   * @param  {NrtvArrayResource} factory The hook to construct the factory for.
   * @param  {string} path
   * @param  {NarrativeAuth} auth
   * @param  {function} transforms
   * @param  {function} itemTransforms
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
              arrayFactory, moment.path() + 'positions/', config.auth, [], []),
            photos: constructArray(
              arrayFactory, moment.path() + 'photos/', config.auth, [], [])
          });
        }

        function timelineTransform(item) {
          return item.type === 'moment' ? momentTransform(item) : item;
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
         * @name NarrativeAuth.timeline
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
        api.timeline = constructArray(
          arrayFactory, 'timeline/', config.auth, [], [timelineTransform]);

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
         *                             the Moment.
         */
        api.moment = constructItem(
          itemFactory, 'moments/:uuid/', config.auth, [momentTransform]);

        /**
         * @ngdoc method
         * @name NarrativeAuth.video
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
         *                             the Video Moment.
         */
        api.video = constructItem(
          itemFactory, 'video/:uuid/', config.auth, []);

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
          itemFactory, 'users/:uuid/', config.auth, []);

        /**
         * @ngdoc method
         * @name NarrativeAuth.favorites
         * @module api.narrative
         * @methodOf api.narrative.NarrativeApi
         *
         * @param {object=} options Options for filtrating the results.
         *
         * @description
         * A getter for the config object used to create this instance.
         *
         * @return {NrtvArrayResource} The corresponding array object for
         *                             the favorites.
         */
        api.favorites = constructArray(
          arrayFactory, 'favorites/', config.auth, [], []);

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
