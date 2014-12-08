(function() {
  'use strict';

  angular.module('app').controller('SignupCtrl', SignupCtrl);

  SignupCtrl.$inject = ['$log', '$scope', '$location', '$state', '$stateParams', 'commitService', 'authService'];

  function SignupCtrl($log, $scope, $location, $state, $stateParams, commitService, authService){
    var vm = this;
    vm.activate = activate;
    vm.loginWithFacebook = loginWithFacebook;
    vm.signup = signup;

    vm.activate();
    
    function activate(){
      vm.commitmentString = commitService.getCommitmentString();
      console.log($state);
      console.log($stateParams);

      // reroute user on login/signup
      $scope.$on('currentUser', function(){
        authService.getLoginStatus().then(
        function(){
          if($stateParams.create_commitment && commitment){
            commitService.uploadCommitment();
          }

          if($stateParams.redirect_uri){
            $location.path($stateParams.redirect_uri);
          }else{
            $state.go('create.stakes');
          }
        }, 
        function(){
          // user logged out -- this should never happen on this page
        });
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