(function(){
  angular.module('app').factory('utilityService', utilityService);

  utilityService.$inject = ['$log'];

  function utilityService($log){
    var service = {
      convertToEIN: convertToEIN,
      isNumber: isNumber,
      isValidEIN: isValidEIN,
      isValidPhoneNumber: isValidPhoneNumber,
      isValidState: isValidState
    };
    return service;

    ///////////////////

    function convertToEIN(n){
      var stripped = n.replace(/\D/g,'');
      console.log(stripped);
      return stripped.slice(0,2) + '-' + stripped.slice(2);
    }

    function isNumber(n){
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function isValidEIN(n){
      if(n && typeof n === 'string' || typeof n === 'number'){
        var stripped = n.replace(/\D/g,'');
        return isNumber(stripped) && stripped.length === 9;
      }else{
        return false;
      }
    }

    function isValidPhoneNumber(n){
      var re = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;
      return re.test(n);
    }

    function isValidState(n){
      var re = /^(?:(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]))$/;
      return re.test(n);
    }
  }
})();