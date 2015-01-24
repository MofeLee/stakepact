(function() {
  'use strict';

  angular.module('app').controller('CommitCtrl', CommitCtrl);
  
  CommitCtrl.$inject = ['$log', '$scope', '$timeout', '$state', '$stateParams', 'commitService', 'commitment'];

  function CommitCtrl($log, $scope, $timeout, $state, $stateParams, commitService, commitment){

    $scope.$on('transit:startingTodayTransit:end', function(e) {
      $scope.vowTransit = true;
      $scope.$apply();
    });

    $scope.$on('transit:vowTransit:end', function(e) {
      $scope.activityTransit = true;
      $scope.$apply();
    });

    // $scope.$on('transit:activityTransit:end', function(e) {
    //   $scope.activityTransit2 = true;
    //   $scope.$apply();
    // });

    var vm = this;
    vm.activate = activate;
    vm.activity = null;
    vm.commitment = commitment;
    vm.duration = null;
    vm.frequencies = commitService.frequencies;
    vm.frequency = null;
    vm.isValidDuration = isValidDuration;
    vm.loadCommitment = loadCommitment;
    vm.submit = submit;
    vm.setFrequency = setFrequency;
    vm.updateActivity = updateActivity;

    vm.activate();

    var delay = 1000;
    var timer = false;

    function activate(){
      loadCommitment();

      // start the animation
      $timeout(function(){
          /* run code*/
          $scope.startingTodayTransit=true;
      }, 1000);
    }
    
    function loadCommitment(){
      if(vm.commitment) {
        $scope.tempActivity = vm.commitment.activity;
        vm.activity = vm.commitment.activity;
        vm.frequency = vm.commitment.frequency;
        vm.duration = vm.commitment.duration;
      }
      return vm.commitment;
    }

    function setFrequency(f){
      vm.frequency = f;
    }

    // simple submit function
    function submit() {
      if($scope.commitForm.$valid && vm.frequency) {
        // save the data to the collection with an anonymous user status ~> convert to real user and tag on data
        commitService.setCommitmentBasics(vm.activity, vm.frequency, vm.duration).then(
          function(response){
            if(Meteor.user()){
              if($stateParams.modify)
                $state.go('dashboard');
              else
                $state.go('create.stakes');
            } else {
              $state.go('create.signup', {create_commitment: true});
            }
          }, function(error){
            console.log(error);
          }
        );

      }
    }

    // if no activity, delay until user stops entering activity, then submit change
    // if activity exists and is being updated, update immediately
    function updateActivity(){
      if(timer){
        $timeout.cancel(timer);
      }

      if(!vm.activity) {
        timer = $timeout(function(){
            /* run code*/
            vm.activity = $scope.tempActivity;
        }, delay);
      } else {
        vm.activity = $scope.tempActivity;
      }
    }

    function isValidDuration(val) {
      return isNumber(val) && parseInt(val) > 0 && parseInt(val) < 53;
    }

    function isNumber(n){
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
  }
})();