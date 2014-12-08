// service for creating, modifying, and uploading a commitment
// there can only be one active commitment for any given state
(function() {
  'use strict';

  angular.module('app').factory('commitService', commitService);

  commitService.$inject = ['$q'];

  function commitService($q) {
    var commitment = null;
    var frequencies = ["1x weekly", "2x weekly", "3x weekly", "4x weekly", "5x weekly", "6x weekly", "daily"];

    var service = {
      frequencies: frequencies,
      getCommitment: getCommitment,
      getCommitmentString: getCommitmentString,
      uploadCommitment: uploadCommitment,
      setCommitment: setCommitment
    };

    return service;

    // set the commitment object
    // will modify the commitment object if it already exists
    // will create a new commitment object in mongo if a user is logged in and there is no commitment._id
    // will modify commitment object in mongo if commitment._id exists
    function setCommitment(activity, frequency, duration) {
      var defer = $q.defer();

      if(commitment){   // if commitment exists, modify commitment
        commitment.activity = activity;
        commitment.frequency = frequency;
        commitment.duration = duration;
        
        // if the commitment is in mongo, update the commitment
        if(commitment._id){
          Meteor.Commitments.update({_id: commitment._id}, {$set: {
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
        }else{
          defer.resolve(commitment);
        }
      } else {  // if the commitment doesn't exist, create it
        commitment = {
          activity: activity,
          frequency: frequency,
          duration: duration
        };
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
    }

    // return the current commitment object
    function getCommitment() {
      return commitment;
    }

    // return a human readable string that represents the commitment
    function getCommitmentString() {
      return commitment? "I vow to " + commitment.activity + " " + frequencies[commitment.frequency-1] + " for the next " + commitment.duration + " weeks": null;
    }

    // upload new commitment to mongo
    // save to user's commitments
    // modify the commitment object to include mongo _id
    function uploadCommitment() {
      var defer = $q.defer();

      if(Meteor.userId()){
        if(commitment && commitment.activity && commitment.frequency && commitment.duration){
          Meteor.Commitments.insert({
            owner: Meteor.userId(),
            activity: commitment.activity,
            frequency: commitment.frequency,
            duration: commitment.duration
          }, function(error, response){
            if(error){
              defer.reject(error);
            }else{
              Meteor.users.update({_id: Meteor.userId()}, {$push: {commitments: response}}, function(error, docs){
                if(error){
                  defer.reject(error);
                }else{
                  commitment._id = response;  // save the mongo _id of the commitment to the service variable
                  defer.resolve(response); // return the _id of the commitment
                }
              });
            }
          });
        }else{
          defer.reject("no commitment in cache");
        }
      }else{
        defer.reject("user must be logged in to create commitment");
      }
      

      return defer.promise;
    }

    // switch the current commitment object
    function switchCommitment(commitmentId){
      var defer = $q.defer;
      if(Meteor.userId()){
        Meteor.Commitments.findOne({_id: commitmentId}, function(error, response){
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
  }
})();