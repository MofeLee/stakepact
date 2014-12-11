angular.module('app').factory('scriptLoaderService', scriptLoaderService);

scriptLoaderService.$inject = ['$q'];

function scriptLoaderService($q){
  var urls = [];
  var service = {
    loadScript: loadScript
  };

  return service;

  ////////////////

  function loadScript(url){
    // var defer = $q.defer();

    // if(_.contains(urls, url)){  // if the service is already loaded, don't reload
    //   defer.resolve();
    // }else{
    //   angularLoad.loadScript(url).then(function() {
    //     urls.push(url);
    //     defer.resolve();
    //   }.catch(function(error) {
    //     // There was some error loading the script. Meh
    //     defer.reject({status: "script-load-error" , description: "there was an error loading the script", details: error});
    //   }));
    // }

    // return defer.promise;
  }
}