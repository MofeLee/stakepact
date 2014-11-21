(function() {
  'use strict';

  angular.module('app').controller('StakesCtrl', StakesCtrl);

  StakesCtrl.$inject = ['$scope', '$collection', '$state','$log', 'commitmentString', 'stakesService', 'stakes'];

  function StakesCtrl($scope, $collection, $state, $log, commitmentString, stakesService, stakes){
    var vm = this;
    vm.activate = activate;
    vm.clearStakes = clearStakes;
    vm.commitmentString = commitmentString;
    vm.isValidAmmount = isValidAmmount;
    vm.selectCharity = selectCharity;
    vm.stakes = stakes? stakes:{};
    vm.submit = submit;

    vm.activate();

    function activate(){
      $collection(Charities).bind($scope, 'charities', false, false);
      if(vm.stakes && vm.stakes.charityId) {
        vm.showStakes = true;
        $collection(Charities, {_id: vm.stakes.charityId}).bindOne($scope, 'selectedCharity', false, false);
        $collection(Charities).bindOne($scope, 'selectedCharity', vm.stakes.charityId, false, false);
      }
    }

    function clearStakes() {
      stakesService.clearStakes();
      $state.go('create.notifications');
    }

    function isValidAmmount(val) {
      return isNumber(val) && parseFloat(val) >= 1;
    }

    function isNumber(n){
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function selectCharity(charity){
      $scope.selectedCharity = charity;
    }

    // If ever you get a huge mammoth list of charities, maybe better to go the search route rather than load everything
    // function searchCharities(q) {
    //   $collection(Charities, {name: {$regex : ".*"+q+".*"}}).bind($scope, 'searchResults', false, false);
    // }

    function submit(){
      if(vm.stakes.ammount && vm.acceptConditions && isValidAmmount(vm.stakes.ammount) && $scope.selectedCharity && vm.stakes.charityType){
        stakesService.setStakes($scope.selectedCharity._id, vm.stakes.charityType, vm.stakes.ammount);
        $state.go('create.notifications');
      }
    }
  }
})();