var wepay = Meteor.npmRequire('wepay').WEPAY;
var Future = Npm.require('fibers/future');

// local variables
var wepay_settings = Meteor.settings.wepay;

var wp = new wepay(wepay_settings);
wp.use_staging(); // use staging environment (payments are not charged)

Meteor.methods({
  getWepayAccessToken: function (charity, data) {

    // check for data
    if (!data || !data.code || !data.code.length) {
      throw new Meteor.Error("bad-request", "data argument isn't properly configured");
    } 

    // check for charity
    if (!charity){
      throw new Meteor.Error("bad-request", "charity argument isn't properly configured");
    }

    // find charity in mongo
    var charityObject = Charities.findOne({_id: charity});
    if(!charityObject){
      throw new Meteor.Error("bad-request", "charity not found");
    }

    // don't allow unverified charities to have wepay accounts
    if(!charityObject.verified){
      throw new Meteor.Error("unauthorized", "charity must be verified before it can create a wepay account");
    }

    // wepay requests are asynchronous, so we will create a future and wait to return or throw
    var fut = new Future();

    // get wepay oauth2 token
    wp.call('/oauth2/token', {
      'client_id': Meteor.settings.wepay.client_id,
      'client_secret': Meteor.settings.wepay.client_secret,
      'code': data.code,
      'redirect_uri': data.redirect_uri
    }, Meteor.bindEnvironment(  // bind the environment for wrapped async function with callback
      function(res, err){
        if(err){
          fut.throw(new Meteor.Error("oauth-failed", err));
        }

        try{
          var oauthResponse = JSON.parse(String(res));  // the response is a buffer that needs string conversion

          // call wepay account/create with new access_token
          createAccount(charityObject, Meteor.bindEnvironment(  // bind the environment for wrapped async function with callback
            function(createRes, err){
              if(err){
                fut.throw(new Meteor.Error("create-account-failed", err));
              }else{
                var createResponse = JSON.parse(String(createRes));

                if(createResponse.error){
                  fut.throw(new Meteor.Error("create-account-failed", createResponse));
                }else{
                  // update the charity mongo document with all the wepay details
                  updateCharityWithWepayAccount(charity, oauthResponse, createResponse, function(error, docs) {
                    if(error || !docs) {
                      console.log(error);
                      console.log(docs);
                      fut.throw(new Meteor.Error("charity-update-failed", "charity argument isn't properly configured"));
                    } else {
                      // everything worked -- account created. give yourself a high-five!
                      fut.return({status: 200});
                    }
                  });
                }
              }
            }));
        } catch (e){
          console.log("internal-error");
          console.log(e);
          fut.throw(new Meteor.Error("internal-error"));
        }
      }
    ));

    // wait until asynchronous calls return or throw
    return fut.wait();
  },

  createWePayPreapproval: function(stakes, commitment, charity) {
    if (!charity || !commitment || !commitment.commitmentString || !stakes || !stakes.ammount) {
      // throw new Meteor.Error("bad-request", "data argument isn't properly configured");
      throw Meteor.error("bad-request", "arguments not properly configured");
    } else {

      var fut = new Future();

      charityObject = Charities.findOne({_id: charity});

      if(!charity){
        throw Meteor.error("bad-request", "arguments not properly configured");
      }

      console.log(charityObject);

      // call preapproval/create and return the validated iframe url
      wp.set_access_token(wepay_settings.access_token);
      wp.call('preapproval/create', {
        account_id: charityObject.wepay.account_id,
        period: "weekly",
        short_description: commitment.commitmentString + "Stakes for your commitment: " + commitment.commitmentString,
        amount: stakes.ammount,
        fee_payer: "payee",
        mode: "iframe"
      }, Meteor.bindEnvironment(
        function(res, err){
          if(err){
            fut.throw(new Meteor.Error("preapproval-failed", err));
          }else{
            try{
              response = JSON.parse(String(res));
              console.log(response);
              fut.return(response);
            } catch(e) {
              console.log(e);
              fut.throw(new Meteor.Error('parse-failed'));
            }
          }
        }));

      return fut.wait();
    }
  }
});

function createAccount(charity, callback){
  wp.set_access_token(wepay_settings.access_token);
  wp.call('/account/create', {
    name: charity.name,
    description: charity.description? charity.description: (charity.name + ' basic account'),
    type: 'nonprofit'
  }, callback);
}

function updateCharityWithWepayAccount(charity, oauthResponse, createResponse, callback){
  var encryptedAccessToken = OAuthEncryption.seal(oauthResponse.access_token);

  Charities.update({_id: charity}, {
    $set: {
      wepay : {
        account_id: createResponse.account_id, 
        access_token: encryptedAccessToken
      }
    }
  }, callback);
}

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
