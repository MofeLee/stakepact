(function() {
  'use strict';

  angular.module('app').controller('StakesCtrl', StakesCtrl);

  StakesCtrl.$inject = ['$q','$scope', '$collection', '$state', 'authService', 'commitService', 'scriptLoaderService', 'subscriptionService', 'utilityService', 'commitment', 'stakes', 'wepayClientId'];

  function StakesCtrl($q, $scope, $collection, $state, authService, commitService, scriptLoaderService, subscriptionService, utilityService, commitment, stakes, wepayClientId){
    var vm = this;
    vm.activate = activate;
    vm.clearStakes = clearStakes;
    vm.commitmentString = commitService.getCommitmentString();
    vm.isCompleteStakesInfo = isCompleteStakesInfo;
    vm.isCompleteCreditCardInfo = isCompleteCreditCardInfo;
    vm.isValidAmmount = isValidAmmount;
    vm.selectCharity = selectCharity;
    vm.stakes = stakes? stakes:{};
    vm.submit = submit;

    vm.activate();

    function activate(){
      hasCreditCardId().then(function(res){
        vm.hasCreditCardId = res;
      });

      subscriptionService.subscribe("charities", true, "charities", "verified").then(function(){
        $collection(Charities).bind($scope, 'charities', false, false);
        
        // if stakes resolves with a charity, bind $scope.selectedCharity
        if(vm.stakes && vm.stakes.charity) {
          vm.showStakes = true;
          $collection(Charities).bindOne($scope, 'selectedCharity', vm.stakes.charity, false, false);
        }
      });

      $scope.$on('loggingIn', function(loggedIn){
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

    function hasCreditCardId(){
      var defer = $q.defer();
      Meteor.call('hasCreditCardId', Meteor.userId(), function(error, res){
        if(error){
          defer.reject(error);
        }else{
          defer.resolve(res);
        }
      });
      return defer.promise;
    }

    function isCompleteCreditCardInfo(){
      return !!((vm.cardholderName && vm.email && vm.cardNumber1 && vm.cardNumber2 && vm.cardNumber3 && vm.cardNumber4 && vm.cvv && vm.expirationMonth && vm.expirationYear && vm.zip)  || (vm.hasCreditCardId && vm.cardType === 'existing credit card'));
    }

    function isCompleteStakesInfo(){
      return !!(vm.stakes.ammount && vm.acceptConditions && isValidAmmount(vm.stakes.ammount) && $scope.selectedCharity && vm.stakes.charityType);
    }

    function isNumber(n){
      return utilityService.isNumber(n);
    }

    function isValidAmmount(val) {
      return isNumber(val) && parseFloat(val) >= 1;
    }

    function selectCharity(charity){
      $scope.selectedCharity = charity;
    }

    function setCardType(type){
      vm.cardType = type;
    }

    function submit(){
      console.log("submitted");
      if(isCompleteStakesInfo() && isCompleteCreditCardInfo()){
        commitService.setStakes({charity: $scope.selectedCharity._id, charityType: vm.stakes.charityType, ammount: vm.stakes.ammount}).then(function(){
          if(vm.hasCreditCardId && vm.cardType === 'existing credit card') {
            $state.go('create.notifications');
          } else {
            submitCreditCard().then(function(docs){
              console.log(docs);
              $state.go('create.notifications');
            }, function(error){
              console.log(error);
            });
          }
        },
        function(error){
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