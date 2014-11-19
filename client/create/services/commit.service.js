(function() {
  'use strict';

  angular.module('app').factory('commitService', commitService);

  commitService.$inject = [];

  function commitService() {
    var commitment = null;
    var service = {
      getCommitment: getCommitment,
      getCommitmentString: getCommitmentString,
      setCommitment: setCommitment
    };

    return service;

    function setCommitment(activity, frequency, duration) {
      commitment = {
        activity: activity,
        frequency: frequency,
        duration: duration
      };
      return commitment;
    }

    function getCommitment() {
      return commitment;
    }

    function getCommitmentString() {
      return commitment? "i vow to " + commitment.activity + " " + commitment.frequency + " for the next " + commitment.duration + " weeks": null;
    }
  }
})();