angular.module('app').factory('subscriptionService', subscriptionService);

subscriptionService.$inject = ['$q'];

function subscriptionService($q){
  var subscriptions = {};
  var service = {
    clearSubscriptions: clearSubscriptions,
    getSubscriptions: getSubscriptions,
    subscribe: subscribe
  };

  return service;

  function clearSubscriptions(collection){
    if(collection){
      _.each(subscriptionService[collection], function(obj){
        obj.stop();
      });
      subscriptions[collection] = {};
    }
  }

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
    var args = Array.prototype.slice.call(arguments);
    if(args.length > 2){
      var collection = args[0];
      var multi = args[1];
      var subscribeArgs = _.rest(args, 2);

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
        subscriptions[collection] = {};
      }else{
        if(subscriptions[collection][args[2]]){
          subscriptions[collection][args[2]].stop();
        }
      }
      
      console.log(args);
      subscriptions[collection][args[2]] = Meteor.subscribe.apply(this, subscribeArgs);
    }else{
      defer.reject("arguments not properly configured");
    }

    return defer.promise;
  }
}