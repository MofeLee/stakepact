angular.module('app').factory('subscriptionService', subscriptionService);

subscriptionService.$inject = ['$q'];

function subscriptionService($q){
  var subscriptions = {};
  var service = {
    getSubscriptions: getSubscriptions,
    subscribe: subscribe
  };

  return service;

  function getSubscriptions(collection){
    if(collection){
      return subscriptions[collection];
    }else{
      return subscriptions;
    }
  }

  // subscribeToChannel(collection, multi, [arg1, arg2, ...])
  function subscribe(){
    var defer = $q.defer();
    console.log(arguments);
    var args = Array.prototype.slice.call(arguments);
    console.log(args);
    if(args.length > 2){
      var collection = args[0];
      var multi = args[1];
      var subscribeArgs = _.rest(args, 2);
      console.log(subscribeArgs);

      // callbacks supplied as last argument
      subscribeArgs.push({
        onReady: function () {
          defer.resolve();
        },
        onError: function (err) {
          defer.reject(err);
        }
      });

      if(!subscriptions[collection]){
        subscriptions[collection] = {};
      }
      
      if(!multi){
        _.each(subscriptions[collection], function(val, key){
          val.stop();
        });
        console.log("here");
        subscriptions[collection] = {};
      }else{
        if(subscriptions[collection][args[2]]){
          subscriptions[collection][args[2]].stop();
        }
      }

      console.log(subscribeArgs);
      subscriptions[collection][args[2]] = Meteor.subscribe.apply(this, subscribeArgs);
    }else{
      defer.reject("arguments not properly configured");
    }

    return defer.promise;
  }
}