
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
   *     // Go right ahead and use the Auth and the API!
   *   });
   * ```
   */
  angular.module('api.narrative', []);

}(window, window.angular));
