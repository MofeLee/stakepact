(function() {
  'use strict';

  angular.module('app').controller('SignupCtrl', SignupCtrl);

  SignupCtrl.$inject = ['$rootScope', '$log', '$scope', '$location', '$state', '$stateParams', 'commitService', 'authService', 'subscriptionService'];

  function SignupCtrl($rootScope, $log, $scope, $location, $state, $stateParams, commitService, authService, subscriptionService){
    var vm = this;
    vm.activate = activate;
    vm.loginWithFacebook = loginWithFacebook;
    vm.signup = signup;

    vm.activate();
    
    function activate(){
      vm.commitmentString = commitService.getCommitmentString();

      // reroute user on login/signup
      $scope.$on('loggingIn', function(){
        authService.getLoginStatus().then(function(){
          var commitment = commitService.getCommitment();
          if($stateParams.create_commitment && commitment && !commitment._id){  // upload commitment if param is passed and commitment isn't in mongo 
            commitService.setCommitmentBasics(commitment.activity, commitment.frequency, commitment.duration).then(function(){
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
        }else{
          Meteor.users.update({_id: Meteor.userId()}, {$set: {timezone: jstz.determine().name()}}); // save the timezone for the user
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
          },
          timezone: jstz.determine().name()
        }, function(error){
          if(error) {
            console.log(error);
          }
        });
      }
    }
  }

})();