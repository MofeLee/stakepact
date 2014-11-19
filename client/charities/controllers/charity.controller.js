(function() {
  angular.module('app').controller('CharityCtrl', CharityCtrl);

  CharityCtrl.$inject = ['$log', '$stateParams', '$collection', '$scope'];

  function CharityCtrl($log, $stateParams, $collection, $scope) {
    var vm = this;
    
    $collection(Charities).bindOne($scope, 'charity', $stateParams.charityId, false, true);
  }
})();