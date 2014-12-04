angular.module('app').service('authService', authService);

authService.$inject = ['$rootScope', '$q'];

function authService($rootScope, $q){

  this.getLoginStatus = function(){
    var defer = $q.defer();

    $rootScope.$watch('loggingIn', function(loggingIn){
      if(!loggingIn){
        if($rootScope.currentUser){
          defer.resolve($rootScope.currentUser);
        }else{
          defer.reject({status: 401, description: 'unauthorized'});
        }
      }
    });

    return defer.promise;
  };
}