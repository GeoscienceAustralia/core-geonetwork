(function() {
  goog.provide('gn_commons_service');

  var module = angular.module('gn_commons_service', []);

	// define some factories that basically provide getters on JSON returned from the GN server

	// factory that gets jurisdiction information
  module.factory('Jurisdiction', function() {
    function Jurisdiction(k) {
      this.props = $.extend(true, {}, k);
    };
    Jurisdiction.prototype = {
      getKey: function() {
        return this.props.shortname;
      },
      getName: function() {
        return this.props.name;
      },
      getUrl: function() {
        return this.props.url;
      }
    };

    return Jurisdiction;
  });

	// factory that gets license information
  module.factory('License', function() {
    function License(l) {
      this.props = $.extend(true, {}, l);
    };
    License.prototype = {
      getName: function() {
        return this.props.name;
      },
      getImageUrl: function() {
        return this.props.imageUrl;
      },
      getUrl: function() {
        return this.props.url;
      }
    };
    return License;
  });

  module.provider('gnCommonsService',
      function() {
        this.$get = [
          '$q',                                // angular service for running functions asynchronously - use to retrieve data from server
          '$rootScope',                        // the application rootScope - not used
          '$http',                             // angular service for ajax calls to geonetwork server 
          'gnUrlUtils',                        // geonetwork module that does common manipulations on urls for geonetwork
          'Jurisdiction',                      // Jurisdiction Factory (see above)
					'License',                           // License Factory (see above)
          function($q, $rootScope, $http, gnUrlUtils, Jurisdiction, License) {
            return {
              /**
               * Request the XML for the mcp:MD_Commons element. 
               */
              getXML: function(juris, namespace, name, imageurl, url, attribution, derivative, commercial) {
                // http://localhost:8080/geonetwork/srv/eng/
                // creativecommons.get?type=creative_commons&jurisdiction=au&...
                var defer = $q.defer();
                var url = gnUrlUtils.append('creativecommons.get',
                    gnUrlUtils.toKeyValue({
											jurisdiction: juris,
											ns: namespace,
											licensename: name ? name : '',
											licenseurl: url ? url : '',
											licenseimageurl: imageurl ? imageurl : '',
											attribution: attribution ? attribution : '',
											derivative: derivative ? derivative : '',
											commercial: commercial ? commercial : ''
                    })
                    );
                $http.get(url, { cache: true }).
                    success(function(data, status) {
                      // TODO: could be a global constant ?
                      var xmlDeclaration =
                          '<?xml version="1.0" encoding="UTF-8"?>';
                      defer.resolve(data.replace(xmlDeclaration, ''));
                    }).
                    error(function(data, status) {
                      //                TODO handle error
                      //                defer.reject(error);
                    });
                return defer.promise;
              },
              /**
               * Get jurisdiction list.
               */
              getAllJurisdictions: function() {
                var defer = $q.defer();
                $http.get('creativecommons.jurisdictions@json', 
									{ cache: true }).
                    success(function(data, status) {
                      var listOfJurisdictions = [];
                      angular.forEach(data, function(k) {
                        listOfJurisdictions.push(new Jurisdiction(k));
                      });
                      defer.resolve(listOfJurisdictions);
                    }).
                    error(function(data, status) {
                      //                TODO handle error
                      //                defer.reject(error);
                    });
                return defer.promise;

              },
              /**
               * Get license list.
               */
              getAllLicenses: function(jurisdiction) {
                var defer = $q.defer();
                var url = gnUrlUtils.append('creativecommons.licenses@json',
									gnUrlUtils.toKeyValue({
									  jurisdiction: jurisdiction
									}));
                $http.get(url, { cache: true }).
                    success(function(data, status) {
                      var listOfLicenses = [];
                      angular.forEach(data.license, function(l) {
                        listOfLicenses.push(new License(l));
                      });
                      defer.resolve(listOfLicenses);
                    }).
                    error(function(data, status) {
                      //                TODO handle error
                      //                defer.reject(error);
                    });
                return defer.promise;

              }
            };
          }];
      });
})();
