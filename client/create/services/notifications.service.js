(function() {
  'use strict';

  angular.module('app').factory('notificationsService', notificationsService);

  notificationsService.$inject = [];

  function notificationsService(){
    var notificationStettings = null;
    var service = {
      getNotificationSettings: getNotificationSettings,
      setNotificationSettings: setNotificationSettings
    };

    return service;

    function getNotificationSettings(){
      return notificationStettings;
    }

    function setNotificationSettings(settings){
      notificationStettings = settings;
      return notificationStettings;
    }
  }
})();