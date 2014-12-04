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
      $scope.$on('currentUser', function(currentUser){
        authService.getLoginStatus().then(function(){}, function(){
          $state.go('create.signup', {'redirect_sref' : $state.current.name});
        });
      });
    }
  }

})();