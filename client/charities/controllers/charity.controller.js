(function() {
  angular.module('app').controller('CharityCtrl', CharityCtrl);

  CharityCtrl.$inject = ['$window', '$state', '$stateParams', '$meteorObject', '$scope', 'angularLoad', 'wepayClientId', 'charity', 'authService'];

  function CharityCtrl($window, $state, $stateParams, $meteorObject, $scope, angularLoad, wepayClientId, charity, authService) {
    var vm = this;
    vm.activate = activate;
    vm.buttonTriggered = false;
    vm.setWepayUpdate = setWepayUpdate;

    vm.activate();

    /////////////////////

    function activate(){
      $scope.$on('loggingIn', function(loggedIn){
        authService.getLoginStatus().then(
          function(user){
            // confirm user can still view charity -- should never reach here, but just in case
            if(!$scope.charity || $scope.charity.owner === user._id){
              $state.go('create.signup', {'redirect_uri' : $state.current.url});
            }
          },
          function(error){
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });

      $scope.charity = $meteorObject(Charities, $stateParams.charityId, false);

      // watch for changes to charity
      // if no wepay account, set the wepay oauth2 button when the charity loads
      // if wepay account, set withdrawal button
      $scope.$watch('charity', function() {
        if($scope.charity && !vm.buttonTriggered) {
          setWepayCreateButton();
        }
      });
    }

    function setWepayCreateButton(){
      // load wepay script
      angularLoad.loadScript('https://static.wepay.com/min/js/wepay.v2.js').then(function() {
        // Script loaded succesfully.
        // We can now start using the functions from wepay
        WePay.set_endpoint("stage"); // stage or production

        buttonTriggered = true;

        console.log({
            "client_id": wepayClientId,
            "scope":["manage_accounts","collect_payments","view_user","send_money","preapprove_payments"],
            "user_name": $scope.charity.name,
            "user_email": $scope.charity.contact.email,
            "redirect_uri": document.URL,
            "top": 0, // control the positioning of the popup with the top and left params
            "left": 0,
            "state":"robot"});

        WePay.OAuth2.button_init(
          document.getElementById('start_oauth2'), {
            "client_id": wepayClientId,
            "scope":["manage_accounts","collect_payments","view_user","send_money","preapprove_payments"],
            "user_name": $scope.charity.name,
            "user_email": $scope.charity.contact.email,
            "redirect_uri": document.URL,
            "top": 0, // control the positioning of the popup with the top and left params
            "left": 0,
            "state":"robot", // this is an optional parameter that lets you persist some state value through the flow
            "callback":function(data) {
              /** This callback gets fired after the user clicks "grant access" in the popup and the popup closes. The data object will include the code which you can pass to your server to make the /oauth2/token call **/
              if (data.code.length !== 0) {
                // send the data to the server
                data.redirect_uri = document.URL;
                Meteor.call('createWePayAccount', $scope.charity._id, data, function (error, result) {
                  console.log(error);
                  console.log(result);
                });
              } else {
                // an error has occurred and will be in data.error
                console.log(data);
              }
            }
          }
        );
      }).catch(function(error) {
        // There was some error loading the script. Meh
        console.log(error);
      });
    }

    function setWepayUpdate(){
      Meteor.call('getWePayUpdateURI', $scope.charity._id, document.URL, function(error, result){
        if(error){
          console.log(error);
        }else{
          console.log(result);
          angularLoad.loadScript("https://www.wepay.com/min/js/iframe.wepay.js").then(function() {
            $window.location.href = result.uri;
          }).catch(function(error) {
            // There was some error loading the script. Meh
            console.log(error);
          });
        }
      });
    }
  }
})();