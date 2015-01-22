// // create/process pending transactions
// // remove reminders for expired commitments
// // remove alerts for expired commitments with no pending transactions
// SyncedCron.add({
//   name: 'wrap up expired commitments',
//   schedule: function(parser) {
//     // parser is a later.parse object
//     return parser.text('every 1 minutes');
//   }, 
//   job: function() {
//     // get the current utc day
//     var now = moment.utc();

//     // create a date that represents the day, hour, and minute from utc time
//     var lookupTime = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute(), 'minutes').toDate();

//     // get all the commitments that report daily at this time
//     var reportingCommitments = Commitments.find({
//       'reportsAt': lookupTime,
//       'stakes': {$exists: true}
//     }).fetch();

//     // get all expired commitments from the reporting commitments
//     var expiredCommitments = _.filter(reportingCommitments, function(commitment){
//       return moment(commitment.expiresAt).isSame(now) || moment(commitment.expiresAt).isBefore(now);
//     });

//     // clear reminders for all expired commitments
//     Notifications.remove({commitment: {$in: _.pluck(expiredCommitments, '_id')}, type: 'reminder'});

//     // create pending transactions and process pending transactions that have exceeded grace period
//     _.each(reportingCommitments, function(commitment){

//       var dividedWeeks = Meteor.call('getSuccessReport', doc, 1); // check reporting period for the current week
//       var successfulWeeks = dividedWeeks.successful;
//       var failedWeeks = dividedWeeks.failed;

//       // find the pending transactions for the commitment
//       var pendingTransactions = Transactions.find({commitment: commitment._id, pending: true}).fetch();
//       pendingWeeks = _.pluck(pendingTransactions, 'reportingPeriod');

//       // insert new transactions for failed weeks within active reporting periods
//       var newTransactions = _.difference(failedWeeks, pendingWeeks);
//       var newTransactionObjects = _.map(newTransactions, function(period){
//         return {
//           commitment: commitment._id,
//           reportingPeriod: period,
//           transactionDate: moment(period, 'YYYY-MM-DD').add(3, 'weeks').toDate(),
//           pending: true
//         };
//       });
//       if(newTransactionObjects.length){
//         Transactions.insert(newTransactionObjects);
//       }

//       // find pending transactions that have exceeded grace period
//       var transactionsToBeProcessed = _.filter(pendingTransactions, function(transaction){
//         return moment(transactionDate).isSame(now) || moment(transactionDate).isAfter(now);
//       });

//       // process transactions that have exceeded grace period
//       _.each(transactionsToBeProcessed, function(transaction){
//         console.log(transaction);
//         // call wepay stuff here
//         // send a receipt
//         // CODE HERE!!!
//       });
//     });
//   }
// });