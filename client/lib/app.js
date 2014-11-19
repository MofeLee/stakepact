angular.module('app',['angular-meteor', 'ui.router']);

Meteor.startup(function () {
  angular.bootstrap(document, ['app']);
});