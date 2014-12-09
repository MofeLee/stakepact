(function() {
  'use strict';

  angular.module('app').controller('DashboardCtrl', DashboardCtrl);

  DashboardCtrl.$inject = ['$scope', '$state', 'authService'];

  function DashboardCtrl($scope, $state, authService){
    var vm = this;
    vm.activate = activate;

    vm.activate();

    ////////////

    function activate(){
      // reroute user to signup if logout mid session
      $scope.$on('loggedIn', function(loggedIn){
        authService.getLoginStatus().then(
          function(user){

          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });
    }
  }

})();