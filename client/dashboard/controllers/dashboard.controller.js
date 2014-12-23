(function() {
  'use strict';

  angular.module('app').controller('DashboardCtrl', DashboardCtrl);

  DashboardCtrl.$inject = ['$collection', '$scope', '$state', 'authService', 'commitService', 'utilityService'];

  function DashboardCtrl($collection, $scope, $state, authService, commitService, utilityService){
    var vm = this;
    vm.activate = activate;
    vm.dateModel = {
      maxDate: getLastDay()
    };
    vm.frequencies = commitService.frequencies;
    vm.todayDateString = utilityService.toISODate(new Date());
    vm.toggleToday = toggleToday;

    vm.activate();

    ////////////

    function activate(){
      commitService.subscribeToCommitments('my_commitments').then(function(){
        $collection(Commitments).bind($scope, 'commitments', false, true).then(function(){
          console.log($scope.commitments);

          $collection(Commitments).bindOne($scope, 'commitment', $scope.commitments[0]._id, false, true);

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
        });
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

    function getLastDay(){
      var lastDay = new Date();

      // // for last day of month
      // lastDay.setDate(1);
      // lastDay.setMonth(lastDay.getMonth() + 1);
      // lastDay.setDate(lastDay.getDate() - 1);

      return lastDay;
    }

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