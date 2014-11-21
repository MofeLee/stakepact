(function() {
  'use strict';

  angular.module('app').factory('stakesService', stakesService);

  stakesService.$inject = [];

  function stakesService() {
    var stakes = null;
    var service = {
      clearStakes: clearStakes,
      getStakes: getStakes,
      getStakesString: getStakesString,
      setStakes: setStakes
    };

    return service;

    function setStakes(charityId, charityType, ammount) {
      stakes = {
        charityId: charityId,
        charityType: charityType,
        ammount: ammount
      };
      return stakes;
    }

    function clearStakes() {
      stakes = null;
    }

    function getStakes() {
      return stakes;
    }

    function getStakesString() {
      return stakes? "$" + ammount + " every week": null;
    }
  }
})();