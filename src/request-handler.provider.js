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
        proxy: "",
        baseUrl: "https://narrativeapp.com/",
        apiSuffix: "api/v2/"
      },

      /**
       * @ngdoc property
       * @name NarrativeRequestProvider#defaults['cache']
       * @module api.narrative
       * @propertyOf api.narrative.NarrativeRequestProvider
       * @type {Cache|boolean}
       *
       * @description
       * The cache to be passed on to `$http`. This could either be a cache
       * instance or a boolean value for whether a standard Cache should be
       * used or not.
       *
       * The default value is:
       * ---
       * ```
       * true
       * ```
       */
      cache: true
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
      return url.replace(api.baseUrl + api.apiSuffix, "");
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
     * @param  {string} method      [description]
     * @param  {string} url         [description]
     * @param  {Object} parameters  [description]
     * @param  {NarrativeAuth} auth [description]
     * @return {promise}            [description]
     */
    this.$get = ['$http', function ($http) {
      function request(method, url, parameters, auth) {

        // If parameters are omitted, left shift the two last arguments.
        if (isUndefined(auth)) {
          auth = parameters;
          parameters = undefined;
        }

        // The request will be constructed throughout this function, with the
        // method and url attribute being the only necessary.
        var requestConfig = {
          method: method,
          cache: defaults.cache,
          url: fullPath(defaults.api, url)
        };

        // Unauthorized requests may be allowed to some endpoints, so only add
        // headers if a valid session exists.
        if (auth.token()) {
          requestConfig.headers = authHeadersFromToken(auth.token());
        }

        if (!isUndefined(parameters)) {
          requestConfig = extend(requestConfig, {
            params: parameters,
            paramSerializer: 'NarrativeParamSerializer'
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
          parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(rhs));
        });

        return parts.join("&");
      };
    };
  }

  // Registering the providers on the module.
  angular.module('api.narrative')
    .provider('NarrativeParamSerializer', NarrativeParamSerializerProvider)
    .provider('NarrativeRequest', NarrativeRequestProvider);

  }(window, window.angular));
