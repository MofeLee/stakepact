var wepay = Meteor.npmRequire('wepay').WEPAY;
var Future = Npm.require('fibers/future');

// local variables
var wepay_settings = Meteor.settings.wepay;

var wp = new wepay(wepay_settings);
wp.use_staging(); // use staging environment (payments are not charged)

Meteor.methods({
  getWepayAccessToken: function (charity, data) {
    
    if (!data || !data.code || !data.code.length) {
      // throw new Meteor.Error("bad-request", "data argument isn't properly configured");
      return {error: "data argument isn't properly configured"};
    } else {

      var fut = new Future();

      wp.call('/oauth2/token', {
        'client_id': Meteor.settings.wepay.client_id,
        'client_secret': Meteor.settings.wepay.client_secret,
        'code': data.code,
        'redirect_uri': data.redirect_uri
      }, Meteor.bindEnvironment(
        function(res){
          //this is the normal callback
          response = JSON.parse(String(res));
          console.log(response);
          if(response.access_token){
            console.log(charity);
            var encryptedAccessToken = OAuthEncryption.seal(response.access_token);
            console.log(encryptedAccessToken);
            Charities.update({_id: charity}, {
              $set: {
                wepay : {
                  user_id: response.user_id, 
                  access_token: encryptedAccessToken, 
                  token_type: response.token_type
                }
              }
            }, 
            function(error) {
              if(error) {
                console.log(error);
                fut.return({error: 'error modifying charity'});
              } else {
                fut.return({status:200});
              }
            });

            wp.set_access_token(response.access_token);
            wp.call('/account/create', {
              name: charty.name,
              description: charity.description,
              type: 'nonprofit'
            }, function(createRes) {
              console.log(createRes);
              // MORE HERE!!!
            },
            function(){

            });
          }else{
            console.log(response.error);
            fut.return({error: 'error retrieving WePay token'});
          }
        },
        function(e){
          console.log('bind failure');
          console.log(e);
          return fut.return({error: 'internal error'});
        }
      ));

      return fut.wait();
    }
  },
  createWePayPreapproval: function(stakes, commitment, charity) {
    if (!charity || !commitment || !commitment.commitmentString) {
      // throw new Meteor.Error("bad-request", "data argument isn't properly configured");
      return {error: "arguments not properly configured"};
    } else {

      var fut = new Future();

      charityObject = Charities.findOne({_id: charity});

      if(!charity){
        return {error: "charity not properly configured"};
      }
      console.log(charityObject);

      // decrypt the access_token and set the header for the wepay call
      var accessToken = OAuthEncryption.isSealed(charityObject.wepay.access_token) ? OAuthEncryption.open(charityObject.wepay.access_token) : charityObject.wepay.access_token;
      wp.set_access_token(accessToken);
      console.log(accessToken);

      // call preapproval/create and return the validated iframe url
      wp.call('preapproval/create', {
        account_id: charityObject.wepay.account_id,
        period: "weekly",
        short_description: commitment.commitmentString + "Stakes for your commitment: " + commitment.commitmentString,
        amount: stakes.ammount,
        fee_payer: "payee",
        mode: "iframe"
      }, Meteor.bindEnvironment(
        function(res){
          response = JSON.parse(String(res));
          console.log(response);
          fut.return(response);
        },
        function(e){
          console.log('bind failure');
          console.log(e);
          return fut.return({error: 'internal error'});
        }));

      return fut.wait();
    }
  }
});

// to encrypt
// var encrypted = OAuthEncryption.seal("the_secret_data");
// to decrypt
// var decrypted = OAuthEncryption.isSealed(encrypted) ? OAuthEncryption.open(encrypted) : encrypted;

// apparently for oauth encryption for accounts
// Accounts.config({oauthSecretKey: Meteor.settings.oauthSecretKey});

// wp.call('/checkout/create',
//     {
//         'account_id': 1903277967,
//         'short_description': 'Selling 42 Pens',
//         'type': 'GOODS',
//         'amount': 50
//     },
//     function(response) {
//         console.log(response);
//         console.log('%s', response);
//     }
// );