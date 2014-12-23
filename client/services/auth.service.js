(function(){
  angular.module('app').service('authService', authService);

  authService.$inject = ['$rootScope', '$q'];

  function authService($rootScope, $q){
    var vm = this;
    var currentId;

    vm.getLoginStatus = function(roles){
      var defer = $q.defer();

      var watcher = $rootScope.$watch('loggingIn', function(loggingIn){
        if(!loggingIn){
          if($rootScope.currentUser){
            if(roles){
              if($rootScope.currentUser.roles && _.intersection($rootScope.currentUser.roles, roles).length > 0)
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