(function() {
  'use strict';

  angular.module('app').controller('StakesCtrl', StakesCtrl);

  StakesCtrl.$inject = ['$q', '$subscribe','$scope', '$collection', '$state', 'authService', 'commitService', 'scriptLoaderService', 'utilityService', 'commitment', 'stakes', 'wepayClientId'];

  function StakesCtrl($q, $subscribe, $scope, $collection, $state, authService, commitService, scriptLoaderService, utilityService, commitment, stakes, wepayClientId){
    var vm = this;
    vm.activate = activate;
    vm.clearStakes = clearStakes;
    vm.commitmentString = commitService.getCommitmentString();
    vm.isValidAmmount = isValidAmmount;
    vm.selectCharity = selectCharity;
    vm.stakes = stakes? stakes:{};
    vm.submit = submit;

    vm.activate();

    function activate(){
      Session.set("charityChannel", "verified");

      subscriptionService.subscribe("charities", true, "charities", "verified").then(function(){
        $collection(Charities).bind($scope, 'charities', false, false);
        console.log($scope.charities);

        // if stakes resolves with a charity, bind $scope.selectedCharity
        if(vm.stakes && vm.stakes.charity) {
          vm.showStakes = true;
          $collection(Charities).bindOne($scope, 'selectedCharity', vm.stakes.charity, false, false);
        }
      });

      $scope.$on('loggedIn', function(loggedIn){
        authService.getLoginStatus().then(
          function(user){
            // should already be logged in to view page
          },
          function(error){
            commitService.clearCommitment();
            $state.go('create.signup', {'redirect_uri' : $state.current.url});
          }
        );
      });
    }

    function clearStakes() {
      commitService.clearStakes();
      $state.go('create.notifications');
    }

    function isValidAmmount(val) {
      return isNumber(val) && parseFloat(val) >= 1;
    }

    function isNumber(n){
      return utilityService.isNumber(n);
    }

    function selectCharity(charity){
      $scope.selectedCharity = charity;
    }

    function submit(){
      console.log("submitted");
      if(vm.stakes.ammount && vm.acceptConditions && isValidAmmount(vm.stakes.ammount) && $scope.selectedCharity && vm.stakes.charityType){
        commitService.setStakes($scope.selectedCharity._id, vm.stakes.charityType, vm.stakes.ammount);
        submitCreditCard().then(function(response){
          console.log(response);
          //$state.go('create.notifications');
        }, function(error){
          console.log(error);
        });
      }else{
        console.log(vm.stakes.ammount);
        console.log(vm.acceptConditions);
        console.log(isValidAmmount(vm.stakes.ammount));
        console.log($scope.selectedCharity);
        console.log(vm.stakes.charityType);
      }
    }

     // fancy credit card form -- requires WePay Clear and different pricing
    function submitCreditCard(){
      var defer = $q.defer();

      if(vm.cardholderName && vm.email && vm.cardNumber1 && vm.cardNumber2 && vm.cardNumber3 && vm.cardNumber4 && vm.cvv && vm.expirationMonth && vm.expirationYear && vm.zip){
        scriptLoaderService.loadScript("https://static.wepay.com/min/js/tokenization.v2.js").then(function() {
          WePay.set_endpoint("stage"); // change to "production" when live

          var params = {
            "client_id":        wepayClientId,
            "user_name":        vm.cardholderName,
            "email":            vm.email,
            "cc_number":        vm.cardNumber1 + vm.cardNumber2 + vm.cardNumber3 + vm.cardNumber4,
            "cvv":              vm.cvv,
            "expiration_month": vm.expirationMonth,
            "expiration_year":  vm.expirationYear,
            "address": {
              "zip": vm.zip
            }
          };

          WePay.credit_card.create(params, function(data) {
            if (data.error) {
              defer.reject(data.error);
            } else {
              // call your own app's API to save the token inside the data;
              // show a success page
              console.log(data);
              if(data.credit_card_id){
                Meteor.call('storeWepayCreditCardId', data.credit_card_id, function(error, result){
                  if(error){
                    defer.reject(error);
                  }else{
                    defer.resolve(result);
                  }
                });
              }else{
                defer.reject('no credit card id found');
              }
            }
          });
        }, function(error){
          defer.reject(error);
        });
      }else{
        defer.reject("credit card information incomplete");
      }
    
      return defer.promise;
    }
  }
})();

// If ever you get a huge mammoth list of charities, maybe better to go the search route rather than load everything
// function searchCharities(q) {
//   $collection(Charities, {name: {$regex : ".*"+q+".*"}}).bind($scope, 'searchResults', false, false);
// }