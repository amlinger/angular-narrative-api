# Angular Narrative API
Narrative Open Platform made easy for [AngularJS]. For now, all API hooks in
Narratives Open Platform is not supported, for a more complete overview of
what can be accomplished with this tool and with Narratives Open Platform
itself can be found using the links below.

* [Angular Narrative API reference.][APIdocs]
* [Narrative Open Platform][OpenPlatform]

## Installation
This package currently supports installation by [Bower.io](BowerIO). With Bower
installed, simply type the following in a terminal window:
```bash
$ bower install angular-narrative-api --save
```
Where the `--save` flag saves this dependency to *your* `bower.json`.

After installation through bower, make sure to include the source file in
your `index.html` or similar after your angular import.
```html
<script src="link/to/angular.js"></script>
<script src="bower_components/angular-narrative-api/dist/angular-narrative-api.min.js"></script>
```

### Usage
Register an app at [Narrative Open Platform][OpenPlatform], and the
following snippet can help you getting started.
```javascript
angular.module('app', ['api.narrative'])
  .config(function (NarrativeAuthProvider , NarrativeRequestProvider) {
    NarrativeAuthProvider.defaults.oauthApplication = {
      clientID: "my-client-id",
      redirectURI: "my-root-uri",
      clientSecret: "my-client-secret"
    };
    // For now, Narrative does not support CORS on all URLS, so therefore a
    // proxy is usually necessary.
    NarrativeRequestProvider.defaults.api.proxy = 'http://cors.proxy/';
  })
  .controller('Controller', function (NarrativeAuth,  NarrativeApi) {
    // Go right ahead and use the Auth and the API!
  });
```

### Manual installation
Simply download the [angular-narrative-api.min.js](minDist) (or
[angular-narrative-api.js](dist) for a unminified version) and include it in a
similar fashion as above in your html.

## Requirements
The only dependency for this module is, quite naturally, [AngularJS] version
1.4 or higher. For more information about development dependencies, please
see [`package.json`](package.json) (and to some extent,
[`bower.json`](bower.json)).

## Contribute
1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request!

<!---
The links below are used for referencing above.
-->
[AngularJS]: https://angularjs.org/
[APIdocs]: http://amlinger.github.io/angular-narrative-api/
[BowerIO]: http://bower.io/
[OpenPlatform]: http://open-staging.getnarrative.com/
[minDist]: dist/angular-narrative-api.min.js
[dist]: dist/angular-narrative-api.js
