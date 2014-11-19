(function() {
  'use strict';

  angular.module('app').directive('dashboardNotificationDirective', dashboardNotificationDirective);

  dashboardNotificationDirective.$inject = ['$log'];

  function dashboardNotificationDirective($log){
    return {
      restrict: 'E, A',
      templateUrl: 'dashboard-notification.html',
      scope: true,
      controller: function($scope, $element, $attrs) {

      },
      link: function(scope, element, attrs) {

      }
    };
  }
})();