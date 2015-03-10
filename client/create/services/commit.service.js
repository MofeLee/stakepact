// service for creating, modifying, and uploading a commitment
// there can only be one active commitment for any given state
(function() {

  angular.module('app').factory('commitService', commitService);

  commitService.$inject = ['$q', 'utilityService', '$meteor'];

  function commitService($q, utilityService, $meteor) {
    
    var commitment, commitments;
    $meteor.subscribe('my_commitments').then(function(subscriptionHandle){
      commitments = $meteor.collection(Commitments, false).subscribe('my_commitments');
    }); // there is a delay if you do $meteorCollection.subscribe, so use $meteorSubscribe.then instead
    var frequencies = ["1x weekly", "2x weekly", "3x weekly", "4x weekly", "5x weekly", "6x weekly", "daily"];

    var service = {
      frequencies: frequencies,
      clearCommitment: clearCommitment,
      clearStakes: clearStakes,
      getCommitment: getCommitment,
      getAllCommitments: getAllCommitments,
      getCommitmentString: getCommitmentString,
      getNotifications: getNotifications,
      getStakes: getStakes,
      getStakesString: getStakesString,
      setCheckins: setCheckins,
      setCommitment: setCommitment,
      setCommitmentBasics: setCommitmentBasics,
      setNotifications: setNotifications,
      setStakes: setStakes
    };

    return service;

    ////////////////

    // clear the commitment ~ remove if stored in mongo, and remove from user commitments
    function clearCommitment(){
      var defer = $q.defer();
      if(commitment._id){
        commitments.remove(commitment._id).then(function(result){
          
          var user = $meteor.object(Meteor.users, Meteor.userId(), false).subscribe('my_data');
          user.commitments = _.without(user.commitments, commitment._id);
          user.save();

          commitment = null;
          defer.resolve(result);
        }, function(error){
          defer.reject(error);
        });
      }else{
        commitment = null;
        defer.resolve();
      }
      return defer.promise;
    }

    // clear stakes from commitment and mongo if applicable
    function clearStakes(){
      var defer = $q.defer();

      if(commitment.stakes && commitment._id){
        commitment.stakes = null;
        commitment.save();
        defer.resolve();
      } else {
        commitment.stakes = null;
        defer.resolve();
      }
      return defer.promise;
    }

    function getAllCommitments(){
      return commitments;
    }

    // return the current commitment object
    function getCommitment() {
      return commitment;
    }

    // return a human readable string that represents the commitment
    function getCommitmentString(c) {
      c = c? c: commitment;
      return c? "I vow to " + c.activity + " " + frequencies[c.frequency-1] + " for the next " + c.duration + " weeks": null;
    }

    function getNotifications() {
      return commitment? commitment.notifications : null;
    }

    function getStakes() {
      return commitment? commitment.stakes: null;
    }

    function getStakesString() {
      return commitment? (commitment.stakes? "$" + commitment.stakes.ammount + " every week": null): null;
    }

    function setCheckins(commitmentId, dates){
      console.log("this is when it happens");
      var currentCommitment = $meteor.object(Commitments, commitmentId, false);
      currentCommitment.dates = dates;
      return currentCommitment.save();
    }

    function setCommitment(id){
      var defer = $q.defer();
      commitment = $meteor.subscribe('my_commitments').then(function(subscriptionHandle){
        commitment = $meteor.object(Commitments, id, false);
        defer.resolve(commitment);
      });
      return defer.promise;
    }

    // set the commitment object
    // will modify the commitment object if it already exists
    // will create a new commitment object in mongo if a user is logged in and there is no commitment._id
    // will modify commitment object in mongo if commitment._id exists
    function setCommitmentBasics(activity, frequency, duration) {
      var defer = $q.defer();

      commitment = commitment? commitment: {};

      commitment.activity = activity;
      commitment.frequency = frequency;
      commitment.duration = duration;

      if(commitment._id){
        commitment.save();
        defer.resolve(commitment);
      }else{

        if(Meteor.userId()){  // if user exists, push new commitment to mongo and add to user commitments
          var user = $meteor.object(Meteor.users, Meteor.userId(), false).subscribe('my_data');
          commitment.owner = Meteor.userId();
          commitment.timezone = user.timezone? user.timezone : jstz.determine().name();
          commitments.save(commitment).then(function(result){
            commitment = $meteor.object(Commitments, result[0]._id, false);
            if(user.commitments){
              user.commitments.push(commitment._id);
            } else {
              user.commitments = [commitment._id];
            }
            user.save();
            defer.resolve(commitment);
          }, function(error){
            console.log(error);
            defer.reject(error);
          });
        }else{  // if not logged in, don't push to mongo
          defer.resolve(commitment);
        } 

      }

      return defer.promise;
    }

    // set notifications for the commitment
    function setNotifications(notifications){
      var d = $q.defer();
      
      console.log(notifications);

      if(commitment._id){
        if(notifications){
          return $meteor.call('updateNotifications', commitment._id, notifications);
          // commitment.notifications = notifications;
          // return commitment.save();
        } else {
          commitment.notifications = null;
          return commitment.save();
        }
      }else{
        d.reject('notifications cannot be stored until commitment is in database');
        return d.promise;
      }
    }

    // set stakes for the commitment
    function setStakes(stakes){
      var defer = $q.defer();
      if(stakes && stakes.charity && stakes.charityType && stakes.ammount){
        if(commitment._id){
          stakes.startDate = new Date();  // create a startDate for enforcement
          commitment.stakes = stakes;
          commitment.save();
          defer.resolve();
        } else {
          defer.reject("stakes cannot be stored until commitment is in database");
        }
      }else{
        defer.reject("stakes not properly configured");
      }
      return defer.promise;
    }

    // switch the current commitment object
    function switchCommitment(commitmentId){
      var defer = $q.defer;
      if(Meteor.userId()){
        commitment = $meteor.object(Commitments, commitmentId, false);
        defer.resolve();
      }else{
        defer.reject("user must be logged in to switch commitments");
      }
      return defer.promise;
    }
  }
})();