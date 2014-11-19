(function() {
  'use strict';

  angular.module('app').directive('searchDirective', searchDirective);

  searchDirective.$inject = ['$log'];

  function searchDirective($log) {
    return {
      restrict: 'E',
      templateUrl: 'search.html',
      scope: true,
      controller: function($scope, $element, $attrs) {

      },
      link: function(scope, element, attrs) {

      }
    };
  }
})();