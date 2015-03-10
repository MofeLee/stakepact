(function() {
  angular.module('app').controller('CharitiesListCtrl', CharitiesListCtrl);

  CharitiesListCtrl.$inject = ['$log', '$meteor', '$scope', '$state', 'authService', 'adminRoles'];

  function CharitiesListCtrl($log, $meteor, $scope, $state, authService, adminRoles) {
    var vm = this;
    vm.activate = activate;
    vm.removeCharity = removeCharity;
    vm.verifyCharity = verifyCharity;
    vm.unverifyCharity = unverifyCharity;
    vm.activate();

    ///////////////////
    
    function activate(){
      // reroute user to signup if logout mid session
      $scope.$on('currentUser', function(currentUser){
        authService.getLoginStatus(adminRoles).then(
          function(user){

          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });

      // bind to Charities collection
      $scope.charities = $meteor.collection(Charities, false).subscribe("charities");
    }

    function removeCharity(charity){
      Charities.remove({_id: charity._id});
    }

    function unverifyCharity(charity){
      toggleVerification(charity, false, function(error, docs){
        if(!error){
          console.log(docs);
        }else{
          console.log(error);
        }
      });
    }

    function verifyCharity(charity){
      toggleVerification(charity, true, function(error, docs){
        if(!error){
          console.log(docs);
        }else{
          console.log(error);
        }
      });
    }

    function toggleVerification(charity, verify, callback){
      Charities.update({_id: charity._id}, {$set: {verified: verify}}, callback);
    }
  }
})();