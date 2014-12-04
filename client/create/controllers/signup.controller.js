(function() {
  'use strict';

  angular.module('app').controller('SignupCtrl', SignupCtrl);

  SignupCtrl.$inject = ['$log', '$scope', '$rootScope', '$state', '$stateParams', 'commitService'];

  function SignupCtrl($log, $scope, $rootScope, $state, $stateParams, commitService){
    var vm = this;
    vm.activate = activate;
    vm.commitment = null;
    vm.loginWithFacebook = loginWithFacebook;
    vm.signup = signup;

    vm.activate();
    
    function activate(){
      vm.commitmentString = commitService.getCommitmentString();

      // reroute user on login/signup
      $scope.$on('currentUser', function(){
        if($rootScope.currentUser) {
          console.log($stateParams);
          if($stateParams.redirect_sref){
            $state.go($stateParams.redirect_sref);
          }else
            $state.go('create.stakes');
        }
      });
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
  }

})();