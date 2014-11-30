angular.module('app',['angular-meteor', 'ui.router', 'pickadate']);

Meteor.startup(function () {
  angular.bootstrap(document, ['app']);
});