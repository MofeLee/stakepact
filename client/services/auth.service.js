(function(){
  angular.module('app').service('authService', authService);

  authService.$inject = ['$rootScope', '$q', '$meteorObject', '$meteorSubscribe'];

  function authService($rootScope, $q, $meteorObject, $meteorSubscribe){
    var vm = this;
    var currentId;

    vm.getLoginStatus = function(roles){
      var defer = $q.defer();

      var watcher = $rootScope.$watch('loggingIn', function(loggingIn){
        if(!loggingIn){
          if($rootScope.currentUser){
            if(roles){
              if($rootScope.currentUser.roles && $rootScope.currentUser.roles.__global_roles__ && _.intersection($rootScope.currentUser.roles.__global_roles__, roles).length > 0)
              {
                defer.resolve($rootScope.currentUser);
              }else{
                defer.reject({status: 401, description: 'unauthorized'});
              }
            }else{
              defer.resolve($rootScope.currentUser);
            }
          }else{
            currentId = null;
            defer.reject({status: 401, description: 'unauthorized'});
          }
          watcher();  // end the watcher if not loggingIn
        }
      });

      return defer.promise;
    };
  }
})();