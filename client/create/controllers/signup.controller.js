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

      // reroute user on login/signup
      $scope.$on('loggedIn', function(){
        authService.getLoginStatus().then(
        function(){
          console.log("here");
          console.log(authService.getLoginStatus());
          var commitment = commitService.getCommitment();
          if($stateParams.create_commitment && commitment && !commitment._id){  // upload commitment if parm is passed and commitment isn't in mongo 
            console.log("uploading here");
            commitService.uploadCommitment().then(function(){
              proceed();
            }, function(error){
              console.log(error);
            });
          }else{
            proceed();
          }
        }, 
        function(){
          // user logged out -- this should never happen on this page
          console.log("user logged out on the signup page");
        });
      });
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

    // logic for proceeding to next page
    function proceed(){
      if($stateParams.redirect_uri){
        $location.path($stateParams.redirect_uri);
      }else{
        $state.go('create.stakes');
      }
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
  }

})();