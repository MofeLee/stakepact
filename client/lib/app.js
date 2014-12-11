angular.module('app',['angular-meteor', 'ui.router', 'pickadate', 'angularLoad']);

Meteor.startup(function () {
  angular.bootstrap(document, ['app']);
});