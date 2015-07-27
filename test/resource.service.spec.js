(function () {
  'use strict';

  var identity = angular.identity,
    noop = angular.noop,
    extend = angular.extend;

  describe('NarrativeItemFactory', function () {
    var $httpBackend, itemFactory, auth, $rootScope,
      basePath = "https://narrativeapp.com/api/v2/";

    beforeEach(module('api.narrative'));
    beforeEach(module('api.narrative.mocks'));

    beforeEach(inject(function (_$httpBackend_, _$rootScope_,
                                _NarrativeItemFactory_, _NarrativeAuthMock_) {
      $httpBackend = _$httpBackend_;
      itemFactory = _NarrativeItemFactory_;
      auth = _NarrativeAuthMock_();
      $rootScope = _$rootScope_;
    }));

    it('creates returns a promise with q().', function () {
      var item = itemFactory('path/:uuid', auth).construct('ID'),
        resolveSpy = jasmine.createSpy('resolveSpy');

      $httpBackend.expectGET(basePath + 'path/ID').respond(200, {data: {}});
      item.q().then(resolveSpy);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(resolveSpy).toHaveBeenCalled();
    });

    it('rejects the promise if q() is called before construct.', function () {
      var item = itemFactory('path/:uuid', auth),
        rejectSpy = jasmine.createSpy('resolveSpy');

        $httpBackend.expectGET(basePath + 'path/').respond(200, {data: []});
        item.q().then(null, rejectSpy);
        $httpBackend.flush();
        $rootScope.$digest();
        expect(rejectSpy).toHaveBeenCalledWith(
          "Need to invoke construct() before calling this method");
    });

    it('caches its promises with q().', function () {
      var item = itemFactory('path/:uuid', auth).construct('ID'),
        resolveSpy1 = jasmine.createSpy('resolveSpy1'),
        resolveSpy2 = jasmine.createSpy('resolveSpy2');

      $httpBackend.expectGET(basePath + 'path/ID').respond(200, {data: {}});
      item.q().then(resolveSpy1);
      item.q().then(resolveSpy2);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(resolveSpy1).toHaveBeenCalled();
      expect(resolveSpy2).toHaveBeenCalled();
    });

    it('uses q() in get() and returns its object.', function () {
      var item = itemFactory('path/:uuid', auth).construct('ID'),
        resolveSpy = jasmine.createSpy('resolveSpy');

      var obj = item.get();
      $httpBackend.expectGET(basePath + 'path/ID').respond(200, {data: {}});
      item.q().then(resolveSpy);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(resolveSpy).toHaveBeenCalledWith(obj);
    });

    it('creates fills uuid in path.', function () {
      var item = itemFactory('/path/:uuid', null).construct('ID');
      expect(item.path()).toBe('/path/ID');
    });

     afterEach(function() {
       $httpBackend.verifyNoOutstandingExpectation();
       $httpBackend.verifyNoOutstandingRequest();
     });

     it('chains it\'s transforms before constructing.', function () {
       var item = itemFactory('path/:uuid', auth).construct('ID'),
        transforms = {first: identity, second: identity, third: identity},
        firstSpy  = spyOn(transforms, 'first').and.callThrough(),
        secondSpy = spyOn(transforms, 'second').and.callThrough(),
        thirdSpy  = spyOn(transforms, 'third').and.callThrough();

        item
          .transform(transforms.first)
          .transform(transforms.second)
          .transform(transforms.third)
          .transform();

         expect(firstSpy).toHaveBeenCalledWith(item);
         expect(secondSpy).toHaveBeenCalledWith(item);
         expect(thirdSpy).toHaveBeenCalledWith(item);
     });

     it('Allows transform to change the item', function () {
       var item = itemFactory('path/:uuid', auth).construct('bat');

        expect(item.fangs).toBeUndefined();
        item
          .transform(function vampire(item) {
            return extend(item, {
              fangs: 'big and scary'
            });
          })
          .transform();

        expect(item.fangs).toBe('big and scary');
     });

    it('constructs objects from information.', function () {
      var item = itemFactory('path/:uuid', auth);

      item._constructFromObject('unique', {});

      expect(item.uuid).toBe('unique');
      expect(item.path()).toBe('path/unique');
    });
  });

  describe('NarrativeItemFactory', function () {
    var $httpBackend, arrayFactory, auth, $rootScope,
      basePath = "https://narrativeapp.com/api/v2/",
      defaultResp = {
        count: 2,
        results: [{uuid: "owl"}, {uuid: "bear"}],
        next: null,
        previous: null
      };

    beforeEach(module('api.narrative'));
    beforeEach(module('api.narrative.mocks'));

    beforeEach(inject(function (_$httpBackend_, _$rootScope_,
                                _NarrativeArrayFactory_, _NarrativeAuthMock_) {
      $httpBackend = _$httpBackend_;
      arrayFactory = _NarrativeArrayFactory_;
      auth = _NarrativeAuthMock_();
      $rootScope = _$rootScope_;
    }));

    it('creates returns a promise with q().', function () {
      var array = arrayFactory('path/', auth).construct(),
        resolveSpy = jasmine.createSpy('resolveSpy');

      $httpBackend.expectGET(basePath + 'path/').respond(200, defaultResp);
      array.q().then(resolveSpy);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(resolveSpy).toHaveBeenCalled();
    });

    it('rejects the promise if q() is called before construct.', function () {
      var array = arrayFactory('path/', auth),
        rejectSpy = jasmine.createSpy('resolveSpy');

        array.q().then(null, rejectSpy);
        $rootScope.$digest();
        expect(rejectSpy).toHaveBeenCalledWith(
          "Need to invoke construct() before calling this method");
    });

    it('caches its promises with q().', function () {
      var array = arrayFactory('path/', auth).construct(),
        resolveSpy1 = jasmine.createSpy('resolveSpy1'),
        resolveSpy2 = jasmine.createSpy('resolveSpy2');

      $httpBackend.expectGET(basePath + 'path/').respond(200, defaultResp);
      array.q().then(resolveSpy1);
      array.q().then(resolveSpy2);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(resolveSpy1).toHaveBeenCalled();
      expect(resolveSpy2).toHaveBeenCalled();
    });

    it('uses q() in get() and returns its object.', function () {
      var array = arrayFactory('path/', auth).construct(),
        resolveSpy = jasmine.createSpy('resolveSpy');

      var obj = array.get();
      $httpBackend.expectGET(basePath + 'path/').respond(200, defaultResp);
      array.q().then(resolveSpy);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(resolveSpy).toHaveBeenCalledWith(obj);
    });

    it('returns the path when calling path().', function () {
      var array = arrayFactory('/path/', null).construct();
      expect(array.path()).toBe('/path/');
    });

     afterEach(function() {
       $httpBackend.verifyNoOutstandingExpectation();
       $httpBackend.verifyNoOutstandingRequest();
     });

     it('chains it\'s transforms before constructing.', function () {
       var array = arrayFactory('path/', auth).construct(),
        transforms = {first: identity, second: identity, third: identity},
        firstSpy  = spyOn(transforms, 'first').and.callThrough(),
        secondSpy = spyOn(transforms, 'second').and.callThrough(),
        thirdSpy  = spyOn(transforms, 'third').and.callThrough();

        array
          .transform(transforms.first)
          .transform(transforms.second)
          .transform(transforms.third)
          .transform();

         expect(firstSpy).toHaveBeenCalledWith(array);
         expect(secondSpy).toHaveBeenCalledWith(array);
         expect(thirdSpy).toHaveBeenCalledWith(array);
     });

     it('adds itemTransform to fetched items', function () {
       var array = arrayFactory('path/', auth).construct(),
        resp = extend({}, defaultResp, {next : 'path/?page=2'});

       $httpBackend.expectGET(basePath + 'path/').respond(200, resp);
       array.itemTransform(function (animal) {
         return extend(animal, {
           legs: 'A couple'
         });
       });
       array.nextPage();
       $httpBackend.flush();
       $rootScope.$digest();
       expect(array.results[0].legs).toBe('A couple');
       expect(array.results[1].legs).toBe('A couple');
     });

     it('throws exception if nextPage called before construct.', function () {
       var array = arrayFactory('path/', auth);
       expect(function() {
         array.nextPage();
       }).toThrow();
     });

     it('throws exception if nextPage called without path.', function () {
       var array = arrayFactory(null, auth).construct();
       expect(function() {
         array.nextPage();
       }).toThrow();
     });

     it('throws exception if nextPage has no more entries.', function () {
       var array = arrayFactory('path/', auth).construct();

       $httpBackend.expectGET(basePath + 'path/').respond(200, defaultResp);
       array.nextPage();
       $httpBackend.flush();
       $rootScope.$digest();

       expect(function () {
         array.nextPage();
       }).toThrow();
     });

     it('continues if nextPage has more entries.', function () {
       var array = arrayFactory('path/', auth).construct(),
        resp = extend({}, defaultResp, {next : 'path/?page=2'});

       $httpBackend.expectGET(basePath + 'path/').respond(200, resp);
       array.nextPage();
       $httpBackend.flush();
       $rootScope.$digest();
       expect(array.results.length).toBe(resp.results.length);
       $httpBackend.expectGET(basePath + 'path/?page=2')
        .respond(200, defaultResp);

       array.nextPage();
       $httpBackend.flush();
       $rootScope.$digest();
       expect(array.results.length)
        .toBe(resp.results.length + defaultResp.results.length);
     });

     it('converts items to NrtvItemResources in nextPage().', function () {
       var array = arrayFactory('path/', auth).construct();

       $httpBackend.expectGET(basePath + 'path/').respond(200, defaultResp);
       array.nextPage();
       $httpBackend.flush();
       $rootScope.$digest();

       // Duck-type checks for attributes to check for transformation.
       expect(array.results[0].hasOwnProperty('q')).toBe(true);
       expect(array.results[0].hasOwnProperty('get')).toBe(true);
       expect(array.results[0].hasOwnProperty('path')).toBe(true);
       expect(array.results[0].hasOwnProperty('transform')).toBe(true);
     });

     it('can abort foreach iterations.', function () {
       var array = arrayFactory('path/', auth).construct(),
         rejectSpy = jasmine.createSpy('resolveSpy');

       $httpBackend.expectGET(basePath + 'path/').respond(200, defaultResp);
       array.forEach(function(c, i, abort) {
         abort();
       }).then(null, rejectSpy);
       $httpBackend.flush();
       $rootScope.$digest();

       expect(rejectSpy).toHaveBeenCalled();
     });

     it('resolves after all foreach iterations are done.', function () {
       var array = arrayFactory('path/', auth).construct(),
        resp = extend({}, defaultResp, {next : 'path/?page=2'});

       $httpBackend.expectGET(basePath + 'path/').respond(200, resp);
       $httpBackend.expectGET(basePath + 'path/?page=2')
        .respond(200, defaultResp);
       array.forEach(noop).then(function (arr) {
          expect(arr.results.length)
           .toBe(resp.results.length + defaultResp.results.length);
       });
       $httpBackend.flush();
       $rootScope.$digest();

       expect(array.results.length)
        .toBe(resp.results.length + defaultResp.results.length);
     });
  });
}());
