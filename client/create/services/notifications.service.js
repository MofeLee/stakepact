(function() {
  'use strict';

  angular.module('app').factory('notificationsService', notificationsService);

  notificationsService.$inject = [];

  function notificationsService(){
    var notifactionSettings = null;
    var service = {
      getNotificationSettings: getNotificationSettings,
      setNotificationSettings: setNotificationSettings
    };

    return service;

    function getNotificationSettings(){
      return notifactionSettings;
    }

    function setNotificationSettings(settings){
      notifactionSettings = settings;
    }
  }
})();