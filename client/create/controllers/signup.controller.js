(function() {
  'use strict';

  angular.module('app').controller('SignupCtrl', SignupCtrl);

  SignupCtrl.$inject = ['$log', '$scope', '$state', 'commitService', '$rootScope'];

  function SignupCtrl($log, $scope, $state, commitService, $rootScope){
    var vm = this;
    vm.activate = activate;
    vm.commitment = null;
    vm.loginWithFacebook = loginWithFacebook;
    vm.signup = signup;

    vm.activate();
    
    function activate(){
      vm.commitmentString = commitService.getCommitmentString();
    }

    // simple form validation
    // create new user
    function signup(){
      if($scope.signupForm.$valid) {
        Accounts.createUser(
        {
          email: vm.email,
          password: vm.password,
          profile: {
            name: vm.name
          } 
        }, function(error){
          if(error) {
            console.log(error);
          }
        });
      }
    }

    function loginWithFacebook(){
      Meteor.loginWithFacebook({
        requestPermissions: ['public_profile', 'email', 'user_friends'],
        loginStyle: 'popup'
      }, function(error) {
        if(error) {
          console.log(error);
        }
      });
    }

    $rootScope.$watch('currentUser', function(currentUser){
      if(currentUser) {
        $state.go('create.stakes');
      }
    });
  }

})();