(function() {
  'use strict';

  angular.module('app').controller('NotificationsCtrl', NotificationsCtrl);

  NotificationsCtrl.$inject = ['$meteorSubscribe', '$meteorCollection', '$meteorObject', '$q', '$scope', '$state', 'commitment', 'stakes', 'notifications', 'authService', 'commitService', 'utilityService'];

  function NotificationsCtrl($meteorSubscribe, $meteorCollection, $meteorObject, $q, $scope, $state, commitment, stakes, notifications, authService, commitService, utilityService){
    var vm = this;
    
    vm.commitment = commitment;
    vm.contactTypes = ["text", "email"];
    vm.days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    vm.frequencies = ["daily", "weekly"];
    vm.stakes = stakes;
    vm.notifications = notifications;

    vm.activate = activate;
    vm.submit = submit;
    vm.toggleAlertsAM = toggleAlertsAM;
    vm.toggleAlertsTime = toggleAlertsTime;
    vm.toggleRemindersAM = toggleRemindersAM;
    vm.toggleRemindersTime = toggleRemindersTime;
    
    vm.activate();

    //////////////////////

    // create default notification settings if no pre-existing settings
    function activate(){
      vm.phoneNumber = Meteor.user().phone;

      if(vm.stakes && vm.stakes.charity) {
        $scope.selectedCharity = $meteorObject(Charities, vm.stakes.charity, false).subscribe('charities', 'verified');
      }

      // reroute user to signup if logout mid session
      $scope.$on('loggingIn', function(loggingIn){
        authService.getLoginStatus().then(
          function(user){
            // this should only be reached if the user is modified for some weird reason
          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });

      if(!vm.notifications){
        vm.reminders = setDefaultSettings();
        vm.alerts = setDefaultSettings();
      } else {
        prepNotificationForUI(vm.notifications.reminders).then(function(result){
          vm.reminders = result;
        });
        prepNotificationForUI(vm.notifications.alerts).then(function(result){
          vm.alerts = result;
        });
      }
    }

    function isValidPhoneNumber(num){
      return utilityService.isValidPhoneNumber(num);
    }

    function prepNotificationForUI(passed){
      var defer = $q.defer();

      var defaultReminderSettings = setDefaultSettings();

      $meteorSubscribe.subscribe('my_notifications', commitment._id).then(function(subscriptionHandle){
        notifications = $meteorCollection(function(){
          return Notifications.find({_id: {$in: passed}});
        }, false);

        var context = {};
        if(notifications.length > 0){
          context.contactType = notifications[0].contactType;
          context.frequency = (notifications.length === 7)? 'daily': 'weekly';
          context.enabled = true;
          var hours = moment(notifications[0].time).diff(moment.utc(0), 'hours');
          context.am = hours < 12;
          context.hours = hours % 12;

          context.times = [];
          for(var i = 0; i<7; i++){
            context.times[i] = {
              enabled: false,
              hour: context.hours,
              minute: 0,
              am: context.am
            };
          }


          _.each(notifications, function(obj){
            var i = moment.utc(obj.time).diff(moment.utc(0), 'days');
            var time = context.times[i];
            time.enabled = true;
          });
        }else{
          context = setDefaultSettings();
        }

        defer.resolve(context);
      });

      return defer.promise;
    }

    // modify context values to match mongo object definitions
    function prepNotificationForMongo(context){
      if(context.enabled){
        // update the model ~ a more sophisticated model should do this in a watch function
        _.each(context.times, function(obj){
          obj.hour = context.hour;
          obj.minute = 0;
          obj.am = context.am;
        });

        // translate to a notification object to be consumed by mongo
        var result = [];
        _.each(context.times, function(obj, index){
          if(obj.enabled){
            result.push({
              time: moment.utc(0).add(index, 'days').add(parseInt(obj.hour) + (obj.am? 0 : 12), 'hours').toISOString(),
              contactType: context.contactType
            });
          }
        });
        return result;
      } else {
        return null;
      }
    }

    // set default notification settings
    function setDefaultSettings(){
      var defaultTimes = [];
      for(var i = 0; i<7; i++){
        defaultTimes[i] = {
          enabled: false,
          hour: 9,
          minute: 0,
          am: true
        };
      }
      defaultTimes[0].enabled = true; // enable monday
      
      return { 
        contactType: 'email', 
        frequency: 'weekly', 
        times: defaultTimes, 
        hour: defaultTimes[0].hour, 
        am: defaultTimes[0].am,
        enabled: false
      };
    }

    // submit the notification settings
    function submit(){
      // text notifications require a phone number
      if(((vm.reminders.contactType == 'text' && vm.reminders.enabled) || (vm.alerts.contactType == 'text' && vm.alerts.enabled)) && (!vm.phoneNumber || !isValidPhoneNumber(vm.phoneNumber))){
        console.log("text notifications require a phone number");
        return;
      }

      // prep the settings for mongo entry
      var settings = {};

      settings.reminders = prepNotificationForMongo(vm.reminders);
      settings.alerts = prepNotificationForMongo(vm.alerts);
      
      // set the user's current phone number to the entry
      if(vm.phoneNumber && isValidPhoneNumber(vm.phoneNumber)){
        Meteor.users.update({_id: Meteor.userId()}, {$set: {phone: vm.phoneNumber}}, function(err, docs){
          if(err){
            console.log(err);
          }else{
            console.log(docs);
          }
        });
      }

      // set the notifications for the commitment, then redirect to the dashboard
      commitService.setNotifications(settings).then(function(){
        $state.go('dashboard');
      }, function(err){
        console.log(err);
      });
    }

    function toggleAlertsAM(){
      toggleAM(vm.alerts);
    }

    function toggleAlertsTime(index){
      vm.alerts.times[index].enabled = !vm.alerts.times[index].enabled;
    }

    function toggleRemindersAM(){
      toggleAM(vm.reminders);
    }

    function toggleRemindersTime(index){
      vm.reminders.times[index].enabled = !vm.reminders.times[index].enabled;
    }

    // change AM/PM for the context and change all the individual day reminders accordingly
    function toggleAM(context){
      context.am = !context.am;
      _.each(context.times, function(obj){
        obj.am = context.am;
      });
    }
  }

})();