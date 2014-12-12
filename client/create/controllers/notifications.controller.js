(function() {
  'use strict';

  angular.module('app').controller('NotificationsCtrl', NotificationsCtrl);

  NotificationsCtrl.$inject = ['$log', '$scope', '$collection', '$state', 'commitment', 'stakes', 'notifications', 'commitService'];

  function NotificationsCtrl($log, $scope, $state, $collection, commitment, stakes, notifications, commitService){
    var vm = this;
    vm.activate = activate;
    vm.commitment = commitment;
    vm.contactTypes = ["text", "email"];
    vm.defaultSettings = { contactType: 'email', frequency: 'weekly' };
    vm.frequencies = ["daily", "weekly"];
    vm.notifications = notifications;
    vm.stakes = stakes;
    
    vm.activate();

    //////////////////////

    function activate(){
      if(!vm.notifications){
        vm.reminders = {
          contactType: vm.defaultSettings.contactType,
          frequency: vm.defaultSettings.frequency
        };
        vm.alerts = {
          contactType: vm.defaultSettings.contactType,
          frequency: vm.defaultSettings.frequency
        };
      } else {
        vm.reminders = vm.notifications.reminders;
        vm.alerts = vm.notifications.alerts;
        vm.phoneNumber = vm.notifications.phoneNumber;

        if(vm.reminders){
          vm.setReminders = true;
        }

        if(vm.alerts){
          vm.setAlerts = true;
        }
      }
    }

    function submit(){
      var notificationSettings = {};

      if(vm.setReminders){
        notificationSettings.reminders = vm.reminders;
      }

      if(vm.setAlerts){
        notificationSettings.alerts = vm.alerts;
      }

      if(vm.phoneNumber){
        notificationSettings.phoneNumber = vm.phoneNumber;
      }

      commitService.setNotifications(notificationSettings).then(function(){
        $state.go('dashboard');
      }, function(err){
        console.log(err);
      });
    }
  }

})();