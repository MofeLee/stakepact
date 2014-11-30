var wepay = Meteor.npmRequire('wepay').WEPAY;

// local variables
var wepay_settings = Meteor.settings.wepay;

wp.use_staging(); // use staging environment (payments are not charged)

var wp = new wepay(wepay_settings);
wp.use_staging(); // use staging environment (payments are not charged)
console.log(wp);
console.log(wepay_settings);
// wp.call('/checkout/create',
//     {
//         'account_id': 1903277967,
//         'short_description': 'Selling 42 Pens',
//         'type': 'GOODS',
//         'amount': 50
//     },
//     function(response) {
//         console.log('%s', response);
//     }
// );