(function() {
  angular.module('app').controller('CharitiesListCtrl', CharitiesListCtrl);

  CharitiesListCtrl.$inject = ['$log', '$collection', '$scope', '$state', 'authService'];

  function CharitiesListCtrl($log, $collection, $scope, $state, authService) {
    var vm = this;
    vm.activate = activate;
    vm.removeCharity = removeCharity;

    function activate(){
      // reroute user to signup if logout mid session
      $scope.$on('currentUser', function(currentUser){
        authService.getLoginStatus().then(
          function(user){

          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });

      // bind to Charities collection
      $collection(Charities).bind($scope, 'charities', false, true);
    }

    function removeCharity(charity){
      Charities.remove({_id: charity._id});
    }
  }
})();