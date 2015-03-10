// // create/process pending transactions
// // remove reminders for expired commitments
// // remove alerts for long expired commitments with no pending transactions
// SyncedCron.add({
//   name: 'get reports for commitments',
//   schedule: function(parser) {
//     // parser is a later.parse object
//     return parser.text('every 1 minutes');
//   }, 
//   job: function() {
//     // get the current utc day
//     var now = moment.utc();

//     // create a date that represents the day, hour, and minute from utc time
//     var lookupTime = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute(), 'minutes').toDate();

//     // process all the commitments that report daily at this time
//     processReportingCommitments(now, lookupTime);

//     // process all pending transactions that are set to be executed at this time
//     processPendingTransactions(now);
//   }
// });

// function processReportingCommitments(now, lookupTime){
//   // get all the commitments that report daily at this time
//   var reportingCommitments = getReportingCommitments(now, lookupTime);

//   // clear reminders for expiring commitments
//   clearExpiredReminders(reportingCommitments, now);

//   // create pending transactions for failed commitments
//   createPendingTransactions(reportingCommitments, now);
// }

// function getReportingCommitments(now, lookupTime){
//   return Commitments.find({
//     'reportsAt': lookupTime,
//     'expiresAt': {$gte: now.clone().subtract(1, 'minutes').toDate()} // give the expiration a 1 minute grace period
//   }).fetch();
// }

// // create pending transactions for failed commitments
// function createPendingTransactions(reportingCommitments, now){
//   var lastMonday = now.clone().day(-6).format('YYYY-MM-DD');
//   return _.each(reportingCommitments, function(commitment){

//     var dividedWeeks = Meteor.call('getSuccessReport', commitment, 1); // check reporting period for the current week
//     var failedWeeks = dividedWeeks.failed;

//     // if the user failed the past week, create a transaction
//     if(_.contains(failedWeeks, lastMonday)){
//       Transactions.insert({
//         commitment: commitment._id,
//         reportingPeriod: lastMonday,
//         transactionDate: now.clone().add(14, 'days').startOf('minute').toDate(),  // schedule for two weeks from now at the start of the minute
//         pending: true
//       });
//     }
//   });
// }

// // clear reminders for expiring commitments
// function clearExpiredReminders(reportingCommitments){
//   // get all expired commitments from the reporting commitments
//   var expiredCommitments = _.filter(reportingCommitments, function(commitment){
//     return moment(commitment.expiresAt).isSame(now, 'day') || moment(commitment.expiresAt).isBefore(now, 'day');  // get expired commitments with 1 day granularity
//   });

//   // clear reminders for all expired commitments
//   return Commitments.update({_id: {$in: _.pluck(expiredCommitments, '_id')}}, {$unset: {'notifications.reminders': ''}});
// }

// function processPendingTransactions(now){
//   var transactions = getPendingTransactions(now);
//   _.each(transactions, function(transaction){
//     commitment = Commitments.findOne({_id: transaction.commitment});

//     // check everything one last time to verify the transaction should be processed
//     var didFail = _.contains(Meteor.call('getSuccessReport', commitment).failed, transaction.reportingPeriod); // confirm the user failed their commitment this week

//     // you're going to get throttled -- you need to collect all of these and make a set of batch calls
//     if(didFail && commitment.stakes && commitment.stakes.ammount && commitment.stakes.charity){
//       try{
//         var response = createWePayCheckout(commitment._id, transaction.reportingPeriod);
//         if(response.error){
//           Transactions.update({_id: transaction._id}, {$set: {errorDescription: response.error_description, pending: false}});
//         }else{
//           Transactions.update({_id: transaction._id}, {$set: {pending: false, shortDescription: sprintf('$%s %s', response.amount, response.short_description)}});
//         }
//       }catch(e){
//         Transactions.update({_id: transaction._id}, {$set: {errorDescription: e.description, pending: false}});
//       }
//     }
//   });
// }

// function getPendingTransactions(now){
//   return Transactions.find({
//     'transactionDate': now.startOf('minute').toDate(), // get all transactions that are pending for this minute
//     'pending': true
//   }).fetch();
// }




// // this was used to test if cron commitment updating was working -- you could eventually convert to jasmine tests and such
// // var now = moment().utc();
// // var inAMinute = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute() + 1, 'minutes').toISOString();
// // console.log(Commitments.update({_id: 'CfRbnypetXQRWJkgp'}, {$set: {reportsAt: moment(inAMinute).toDate(), expiresAt: moment().add(5, 'days').toDate(), 'createdAt': moment().subtract(4, 'weeks').toDate(), frequency: 7}}));
// // console.log(Commitments.find({'reportsAt': moment(inAMinute).toDate()}).fetch());


// // // this was used to test if cron transaction execution was working -- you could eventually convert to jasmine tests and such
// // var now = moment().utc();
// // console.log(Transactions.update({_id: 'bhMxDx5N3zzFetenq'}, {$set: {pending: true, transactionDate: now.add(1, 'minutes').startOf('minute').toDate()}}));
// // console.log(Transactions.find({_id: 'bhMxDx5N3zzFetenq'}).fetch());
