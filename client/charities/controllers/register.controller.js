(function() {
  angular.module('app').controller('RegisterCtrl', RegisterCtrl);

  RegisterCtrl.$inject = ['$log', '$state', '$scope', '$meteor', 'utilityService', 'authService'];

  function RegisterCtrl($log, $state, $scope, $meteor, utilityService, authService) {
    var vm = this;
    vm.activate = activate;
    vm.isValidEIN = isValidEIN;
    vm.isValidPhoneNumber = isValidPhoneNumber;
    vm.isValidState = isValidState;
    vm.submit = submit;
    vm.submitted = false;
    vm.success = false;

    vm.activate();  // activate the controller

    //////////////////

    // activate the controller
    function activate() {
      console.log("on the page");
      // reroute user to signup if logout mid session
      $scope.$on('currentUser', function(currentUser){
        authService.getLoginStatus().then(
          function(user){
            $scope.charities = $meteor.collection(Charities, false).subscribe("my_charities");
          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });
    }

    function isValidEIN(val){
      return utilityService.isValidEIN(val);
    }

    function isValidPhoneNumber(val){
      return utilityService.isValidPhoneNumber(val);
    }

    function isValidState(val){
      return val && utilityService.isValidState(val.toUpperCase());
    }

    // submit form to create charity to be reviewed by moderator for verification
    function submit(){
      vm.submitted = true;
      if($scope.registrationForm.$valid && vm.isValidPhoneNumber($scope.phone) && vm.isValidEIN($scope.ein) && vm.isValidState($scope.state.toUpperCase())){
        vm.success = true;
        var charity = {
          owner: Meteor.userId(),
          contact: {
            name: $scope.name,
            email: $scope.email,
            phone: $scope.phone
          },
          name: $scope.organization,
          website: $scope.website,
          city: $scope.city,
          state: $scope.state.toUpperCase(),
          ein: utilityService.convertToEIN($scope.ein)
        };
        console.log(charity);
        Charities.insert(charity, function(error, id){
          if(!error){
            console.log(id);
          }else{
            console.log(error);
          }
        });
        console.log($scope.charities);
      }
    }
  }
})();