(function() {
  'use strict';

  angular.module('app').controller('NotificationsCtrl', NotificationsCtrl);

  NotificationsCtrl.$inject = ['$scope', '$state', 'commitment', 'stakes', 'notifications', 'commitService', 'utilityService'];

  function NotificationsCtrl($scope, $state, commitment, stakes, notifications, commitService, utilityService){
    var vm = this;
    
    vm.commitment = commitment;
    vm.stakes = stakes;
    vm.notifications = notifications;

    vm.activate = activate;
    vm.contactTypes = ["text", "email"];
    vm.toggleAlertsAM = toggleAlertsAM;
    vm.toggleAlertsTime = toggleAlertsTime;
    vm.toggleRemindersAM = toggleRemindersAM;
    vm.toggleRemindersTime = toggleRemindersTime;
    
    var defaultTimes = [];
    for(var i = 0; i<7; i++){
      defaultTimes[i] = {
        enabled: false,
        hour: 9,
        minute: 0,
        am: true
      };
    }
    defaultTimes[0].enabled = true; // set default weekly reminder as Monday
    
    vm.defaultSettings = { 
      contactType: 'email', 
      frequency: 'weekly', 
      times: defaultTimes, 
      hour: defaultTimes[0].hour, 
      am: defaultTimes[0].am,
      enabled: false
    };

    vm.frequencies = ["daily", "weekly"];
    vm.days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    // vm.notifications = notifications;
    // vm.stakes = stakes;
    
    vm.activate();

    //////////////////////

    // create default notification settings if no pre-existing settings
    function activate(){
      if(!vm.notifications){
        vm.reminders = {
          contactType: vm.defaultSettings.contactType,
          frequency: vm.defaultSettings.frequency,
          times: vm.defaultSettings.times,
          hour: vm.defaultSettings.hour,
          am: vm.defaultSettings.am,
          enabled: vm.defaultSettings.enabled
        };
        vm.alerts = {
          contactType: vm.defaultSettings.contactType,
          frequency: vm.defaultSettings.frequency,
          times: vm.defaultSettings.times,
          hour: vm.defaultSettings.hour,
          am: vm.defaultSettings.am,
          enabled: vm.defaultSettings.enabled
        };
      } else {
        vm.reminders = vm.notifications.reminders;
        vm.alerts = vm.notifications.alerts;
        vm.phoneNumber = vm.notifications.phoneNumber;
      }
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
      commitService.setNotifications(settings).then(function(){
        $state.go('dashboard');
      }, function(err){
        console.log(err);
      });
    }

    function prepNotificationForMongo(context){
      var result = {};
      if(context.enabled){

        result.enabled = context.enabled;
        result.frequency = context.frequency;
        result.contactType = context.contactType;

        if(context.frequency === 'daily'){
          _.each(context.times, function(obj){
            obj.enabled = true;
          });
        }

        // update the model ~ a more sophisticated model should do this in a watch function
        _.each(_.where(context.times, {enabled: true}), function(obj){
          obj.hour = context.hour;
          obj.minute = 0;
          obj.am = context.am;
        });

        // translate to a notification object to be consumed by mongo
        result.times = [];
        _.each(_.where(context.times, {enabled: true}), function(obj, index){
          settings.reminders.push({
            hour: obj.hour + (obj.am? 0 : 12),
            minute: 0,
            day: index
          });
        });
      }
      return result;
    }
  }

})();