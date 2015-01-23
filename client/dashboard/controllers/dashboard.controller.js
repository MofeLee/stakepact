(function() {
  'use strict';

  angular.module('app').controller('DashboardCtrl', DashboardCtrl);

  DashboardCtrl.$inject = ['$meteorCollection', '$meteorObject', '$scope', '$state', 'authService', 'commitService', 'utilityService', 'commitments'];

  function DashboardCtrl($meteorCollection, $meteorObject, $scope, $state, authService, commitService, utilityService, commitments){
    var vm = this;
    vm.activate = activate;
    vm.dateModel = {
      maxDate: new Date()
    };
    vm.frequencies = commitService.frequencies;
    vm.todayDateString = moment().format('YYYY-MM-DD');
    vm.toggleToday = toggleToday;
    vm.settings = {
      commitment: 'create.commit',
      stakes: 'create.stakes',
      notifications: 'create.notifications',
    };
    vm.activate();

    ////////////

    function activate(){
      $scope.commitments = commitments;
      $scope.commitment = $meteorObject(Commitments, $scope.commitments[0], false);
      $scope.commitmentString = commitService.getCommitmentString($scope.commitment);
      $scope.stakes = {
        charityName: "NRA TEST",
        ammount: "50"
      };

      // watch for changes to dates
      // if someone toggles today's checkin, change selectToday
      $scope.$watchCollection('commitment.checkins', function(dates){
        commitService.setCheckins($scope.commitment._id, dates);
        if(_.contains(dates, vm.todayDateString)){
          $scope.selectToday = true;
        } else {
          $scope.selectToday = false;
        }
      });

      // reroute user to signup if logout mid session
      $scope.$on('loggingIn', function(loggedIn){
        authService.getLoginStatus().then(
          function(user){

          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });
    }

    // for clicking the big checkin button
    function toggleToday(){
      $scope.selectToday = !$scope.selectToday;
      if($scope.selectToday){
        $scope.commitment.checkins.push(vm.todayDateString);
      } else {
        $scope.commitment.checkins = _.without($scope.commitment.checkins, vm.todayDateString);
      }
    }
  }

})();