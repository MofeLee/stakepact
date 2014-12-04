(function() {
  'use strict';

  angular.module('app').controller('StakesCtrl', StakesCtrl);

  StakesCtrl.$inject = ['$subscribe','$scope', '$collection', '$state','$log', 'commitmentString', 'stakesService', 'utilityService', 'stakes'];

  function StakesCtrl($subscribe, $scope, $collection, $state, $log, commitmentString, stakesService, utilityService, stakes){
    var vm = this;
    vm.activate = activate;
    vm.clearStakes = clearStakes;
    vm.commitmentString = commitmentString;
    vm.isValidAmmount = isValidAmmount;
    vm.selectCharity = selectCharity;
    vm.setupCheckout = setupCheckout;
    vm.stakes = stakes? stakes:{};
    vm.submit = submit;

    vm.activate();

    function activate(){
      Session.set("charityChannel", "verified");

      Tracker.autorun(function () {
        $subscribe.subscribe('charities', Session.get("charityChannel")).then(function(){
          $collection(Charities).bind($scope, 'charities', false, false);
          console.log($scope.charities);

          if(vm.stakes && vm.stakes.charityId) {
            vm.showStakes = true;
            $collection(Charities).bindOne($scope, 'selectedCharity', vm.stakes.charityId, false, false);
          }
        });
      });
    }

    function clearStakes() {
      stakesService.clearStakes();
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

    // If ever you get a huge mammoth list of charities, maybe better to go the search route rather than load everything
    // function searchCharities(q) {
    //   $collection(Charities, {name: {$regex : ".*"+q+".*"}}).bind($scope, 'searchResults', false, false);
    // }

    function submit(){
      if(vm.stakes.ammount && vm.acceptConditions && isValidAmmount(vm.stakes.ammount) && $scope.selectedCharity && vm.stakes.charityType){
        stakesService.setStakes($scope.selectedCharity._id, vm.stakes.charityType, vm.stakes.ammount);
        $state.go('create.notifications');
      }
    }

    function setupCheckout(){
      console.log("https://stage.wepay.com/api/checkout/");
      //WePay.iframe_checkout("wepay_checkout", "https://stage.wepay.com/api/checkout/");
    }


    //  //  consider using self-made credit card form -- requires WePay Clear and different pricing
    // function submitCreditCard(){
    //   WePay.set_endpoint("stage"); // change to "production" when live

    //   var response = WePay.credit_card.create({
    //     "client_id":        31472,
    //     "user_name":        creditCardForm.name,
    //     "email":            Meteor.user().profile.email,
    //     "cc_number":        creditCardForm.creditCardNumber1 + creditCardForm.creditCardNumber2 + creditCardForm.creditCardNumber3 + creditCardForm.creditCardNumber4,
    //     "cvv":              creditCardForm.cvv,
    //     "expiration_month": creditCardForm.expirationMonth,
    //     "expiration_year":  creditCardForm.expirationYear,
    //     "address": {
    //         "zip": valueById(creditCardForm.zip)
    //     }
    //   }, function(data) {
    //     if (data.error) {
    //       console.log(data);
    //       // handle error response
    //     } else {
    //       // call your own app's API to save the token inside the data;
    //       // show a success page
    //     }
    //   });
    // }
  }
})();