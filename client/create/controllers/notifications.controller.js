(function() {
  'use strict';

  angular.module('app').controller('NotificationsCtrl', NotificationsCtrl);

  NotificationsCtrl.$inject = ['$collection', '$scope', '$state', 'commitment', 'stakes', 'notifications', 'authService', 'commitService', 'subscriptionService', 'utilityService'];

  function NotificationsCtrl($collection, $scope, $state, commitment, stakes, notifications, authService, commitService, subscriptionService, utilityService){
    var vm = this;
    
    vm.commitment = commitment;
    vm.contactTypes = ["text", "email"];
    vm.days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    vm.frequencies = ["daily", "weekly"];
    console.log(stakes);
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
      subscriptionService.subscribe('users', false, 'my_data').then(function(){
        vm.phoneNumber = Meteor.user().phone;
      });

      if(vm.stakes && vm.stakes.charity) {
        subscriptionService.subscribe("charities", true, "charities", "verified").then(function(){
          $collection(Charities).bindOne($scope, 'selectedCharity', vm.stakes.charity, false, false);
          console.log($scope.selectedCharity);
        });
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
        vm.reminders.times[0].enabled = true; // enable monday

        vm.alerts = setDefaultSettings();
        vm.alerts.times[0].enabled = true;  // enable monday
      } else {
        vm.reminders = prepNotificationForUI(vm.notifications.reminders);
        vm.alerts = prepNotificationForUI(vm.notifications.alerts);
      }
    }

    function isValidPhoneNumber(num){
      return utilityService.isValidPhoneNumber(num);
    }

    function prepNotificationForUI(passed){
      var defaultReminderSettings = setDefaultSettings();
      var context = {
        contactType: passed.contactType,
        frequency: passed.frequency,
        times: defaultReminderSettings.times,
        hour: defaultReminderSettings.hour,
        am: defaultReminderSettings.am,
        enabled: passed.enabled
      };
      if(passed.times){
        context.hour = (passed.times[0].hour < 12)? passed.times[0].hour: passed.times[0].hour - 12;
        _.each(passed.times, function(obj){
          context.times[obj.day].enabled = true;
        });
        context.am = passed.times[0].hour <= 12;
      }
      return context;
    }

    // modify context values to match mongo object definitions
    function prepNotificationForMongo(context){
      var result = {};

      result.enabled = context.enabled;
      result.frequency = context.frequency;
      result.contactType = context.contactType;

      if(context.frequency === 'daily'){
        _.each(context.times, function(obj){
          obj.enabled = true;
        });
      }

      // update the model ~ a more sophisticated model should do this in a watch function
      _.each(context.times, function(obj){
        obj.hour = context.hour;
        obj.minute = 0;
        obj.am = context.am;
      });

      // translate to a notification object to be consumed by mongo
      result.times = [];
      _.each(context.times, function(obj, index){
        if(obj.enabled){
          result.times.push({
            hour: parseInt(obj.hour) + (obj.am? 0 : 12),
            minute: 0,
            day: index
          });
        }
      });

      return result;
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
      var settings = {};

      // prep the settings for mongo entry
      settings.reminders = prepNotificationForMongo(vm.reminders);
      settings.alerts = prepNotificationForMongo(vm.alerts);

      // text notifications require a phone number
      if(((settings.reminders.contactType == 'text' && settings.reminders.enabled) || 
        (settings.alerts.contactType == 'text' && settings.alerts.enabled)) && !vm.phoneNumber){
        console.log("text notifications require a phone number");
        return;
      }

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
      console.log(settings);
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