// service for creating, modifying, and uploading a commitment
// there can only be one active commitment for any given state
(function() {
  'use strict';

  angular.module('app').factory('commitService', commitService);

  commitService.$inject = ['$q', '$subscribe'];

  function commitService($q, $subscribe) {
    var commitment = null;
    var subscriptions = {};
    var frequencies = ["1x weekly", "2x weekly", "3x weekly", "4x weekly", "5x weekly", "6x weekly", "daily"];

    var service = {
      frequencies: frequencies,
      clearCommitment: clearCommitment,
      clearStakes: clearStakes,
      getCommitment: getCommitment,
      getCommitmentString: getCommitmentString,
      getStakes: getStakes,
      getStakesString: getStakesString,
      setCommitment: setCommitment,
      setStakes: setStakes,
      subscribeToCommitments: subscribeToCommitments,
      uploadCommitment: uploadCommitment
    };

    return service;

    ////////////////

    // clear the commitment ~ remove if stored in mongo, and remove from user commitments
    function clearCommitment(){
      var defer = $q.defer();
      if(commitment._id && commitment.owner){
        Commitments.remove({_id: commitment._id}, function(error, response){
          if(!error){
            Meteor.users.update({_id: commitment.owner}, {$pull: {commitment: commitment._id}}, function(e, res){
              if(!e){
                defer.resolve(res);
              }else{
                defer.reject(e);
              }
            });
          }else{
            defer.reject(error);
          }
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
        subscribeToCommitments('my_commitments').then(function(){
          Commitments.update({_id: commitment._id}, {$unset: {
            stakes: ''
          }}, function(err, docs){
            if(err){
              defer.reject(err);
            }else{
              commitment.stakes = null;
              defer.resolve(docs);
            }
          });
        }, function(error){
          defer.reject(error);
        });
      } else {
        commitment.stakes = null;
        defer.resolve();
      }

      return defer.promise;
    }

    // return the current commitment object
    function getCommitment() {
      return commitment;
    }

    // return a human readable string that represents the commitment
    function getCommitmentString() {
      return commitment? "I vow to " + commitment.activity + " " + frequencies[commitment.frequency-1] + " for the next " + commitment.duration + " weeks": null;
    }

    function getStakes() {
      return commitment? commitment.stakes: null;
    }

    function getStakesString() {
      return commitment? (commitment.stakes? "$" + commitment.stakes.ammount + " every week": null): null;
    }

    // set the commitment object
    // will modify the commitment object if it already exists
    // will create a new commitment object in mongo if a user is logged in and there is no commitment._id
    // will modify commitment object in mongo if commitment._id exists
    function setCommitment(activity, frequency, duration) {
      console.log("setting commitment");
      var defer = $q.defer();

      if(commitment){   // if commitment exists, modify commitment
        console.log("commitment exists");
        commitment.activity = activity;
        commitment.frequency = frequency;
        commitment.duration = duration;
        
        // if the commitment is in mongo, update the commitment
        if(commitment._id){
          subscribeToCommitments('my_commitments').then(function(){
            Commitments.update({_id: commitment._id}, {$set: {
              activity: commitment.activity, 
              frequency: commitment.frequency,
              duration: commitment.duration
            }}, function(error, docs){
              if(error){
                defer.reject(docs);
              } else{
                console.log(docs);
                defer.resolve(docs);
              }
            });
          },
          function(error){
            defer.reject(error);
          });
        }else{
          defer.resolve(commitment);
        }
      } else {  // if the commitment doesn't exist, create it
        console.log("commitment doesn't exist");
        commitment = {
          activity: activity,
          frequency: frequency,
          duration: duration
        };
        console.log(commitment);
        if(Meteor.userId()){  // if user exists, push new commitment to mongo and add to user commitments
          uploadCommitment().then(function(response){
            defer.resolve(response);
          },function(error){
            defer.reject(error);
          });
        }else{  // if not logged in, don't push to mongo
          defer.resolve(commitment);
        } 
      }

      return defer.promise;
    }

    function setStakes(stakes){
      var defer = $q.defer();

      if(stakes && stakes.charity && stakes.charityType && stakes.ammount){
        if(commitment._id){
          subscribeToCommitments('my_commitments').then(function(){
            Commitments.update({_id: commitment._id}, {$set: {
              stakes: stakes
            }}, function(err, docs){
              if(err){
                defer.reject(err);
              }else{
                commitment.stakes = stakes;
                defer.resolve(docs);
              }
            });
          }, function(error){
            defer.reject(error);
          });
        }
      }else{
        defer.reject("stakes not properly configured");
      }

      return defer.promise;
    }

    // subscribe user to commitments for a given commitmentChannel
    // toggle multi to subscribe to multiple channels or stop all channels and replace with commitmentChannel
    function subscribeToCommitments(commitmentChannel, multi){
      var defer = $q.defer();

      if(subscriptions.commitmentChannel){  // if already subscribed, resolve
        console.log(subscriptions);
        defer.resolve();
      }else{
        // if not multi-subscription, remove all commitment subscriptions
        if(!multi && !_.isEmpty(subscriptions)){
          _.each(subscriptions, function(val, key){
            val.stop();
          });
          subscriptions = {};
        }

        // subscribe
        subscriptions[commitmentChannel] = Meteor.subscribe(commitmentChannel, {
          onError: function(error) {
            defer.reject(error);
          },
          onReady: function(subscription) {
            defer.resolve();
          }
        });
      }

      return defer.promise;
    }

    // switch the current commitment object
    function switchCommitment(commitmentId){
      var defer = $q.defer;
      if(Meteor.userId()){
        Commitments.findOne({_id: commitmentId}, function(error, response){
          if(error){
            defer.reject(error);
          }else{
            commitment = response;
            defer.resolve(response);
          }
        });
      }else{
        defer.reject("user must be logged in to switch commitments");
      }

      return defer.promise;
    }

    // upload new commitment to mongo
    // save to user's commitments
    // modify the commitment object to include mongo _id
    function uploadCommitment() {
      console.log("uploading commitment");
      var defer = $q.defer();

      if(Meteor.userId()){
        if(commitment && commitment.activity && commitment.frequency && commitment.duration){
          subscribeToCommitments('my_commitments').then(function(){
            console.log("inserting commitment");
            Commitments.insert({
              owner: Meteor.userId(),
              activity: commitment.activity,
              frequency: commitment.frequency,
              duration: commitment.duration
            }, function(error, response){
              if(error){
                console.log(error);
                defer.reject(error);
              }else{
                Meteor.users.update({_id: Meteor.userId()}, {$push: {commitments: response}}, function(error, docs){
                  if(error){
                    console.log(error);
                    defer.reject(error);
                  }else{
                    commitment._id = response;  // save the mongo _id of the commitment to the service variable
                    defer.resolve(response); // return the _id of the commitment
                  }
                });
              }
            });
          },
          function(error){
            console.log(error);
            defer.reject(error);
          });
        }else{
          defer.reject("no commitment in cache");
        }
      }else{
        defer.reject("user must be logged in to create commitment");
      }

      return defer.promise;
    }
  }
})();