(function() {
  angular.module('app').controller('CharitiesListCtrl', CharitiesListCtrl);

  CharitiesListCtrl.$inject = ['$log', '$collection', '$scope', '$rootScope'];

  function CharitiesListCtrl($log, $collection, $scope, $rootScope) {
    $collection(Charities).bind($scope, 'charities', false, true);

    $scope.removeCharity = function(charity){
      Charities.remove({_id: charity._id});
      //$scope.charities.splice($scope.charities.indexOf(charity), 1 );
    };

    $scope.testLogin = function(){
      // $collection(Meteor.users).bind($scope, 'users', true, true);
      // console.log($rootScope.currentUser);
      //$rootScope.currentUser.profile = {test: "test"};
      //$collection(Meteor.users).bindOne($scope, 'user', Meteor.user()._id, true, true);
      // Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile":"dog"}});
      // var email = "asdf@asdf.com";
      // var password = "fdsafdsa";
      // Meteor.loginWithPassword(email, password, function(err){
      //   if (err) {
      //     console.log(err);
      //   } else {
      //     console.log(Meteor);
      //   }
      // });
    };
  }
})();