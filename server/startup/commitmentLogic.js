// after updating a commitment
// automatically insert/remove/update associated transactions
Commitments.after.update(function (userId, doc, fieldNames, modifier, options) {

  // if stakes are removed, remove all pending transactions
  // if stakes are modified, pending transactions don't store any stakes data so no changes
  // this means if you change the stakes, it will affect all pending transactions
  if(_.contains(fieldNames, 'stakes') && !doc.stakes){
    Transactions.remove({commitment: doc._id, pending: true});
    return;
  }

  // if checkins, frequency, duration, or stakes are modified and at some point there were stakes, update pending transactions
  // if stakes are created, then they will apply retroactively <-- i don't know how i feel about this ~ maybe better to have them only start applying the current/next reporting period
  // if stakes are modified, transactions won't be affected
  if(doc.stakes && _.intersection(fieldNames,['checkins', 'frequency', 'duration', 'stakes']).length){
    updatePendingTransactions(doc);
  }
}, {fetchPrevious: true});


// insert new transactions for failed weeks within active reporting periods
// remove transactions for weeks that are no longer failed
function updatePendingTransactions(doc){
  var dividedWeeks = Meteor.call('getSuccessReport', doc, 3); // check reporting periods up to 3 weeks ago
  var successfulWeeks = dividedWeeks.successful;
  var failedWeeks = dividedWeeks.failed;

  // find the pending transactions for the commitment
  var pendingTransactions = Transactions.find({commitment: doc._id, pending: true}).fetch();
  pendingWeeks = _.pluck(pendingTransactions, 'reportingPeriod');

  // insert new transactions for failed weeks within active reporting periods
  var newTransactions = _.difference(failedWeeks, pendingWeeks);
  var newTransactionObjects = _.map(newTransactions, function(period){
    return {
      commitment: doc._id,
      reportingPeriod: period,
      transactionDate: moment(period, 'YYYY-MM-DD').add(3, 'weeks').toDate(),
      pending: true
    };
  });
  if(newTransactionObjects.length){
    Transactions.insert(newTransactionObjects);
  }

  // remove transactions for weeks that are no longer failed
  var removableTransactions = _.difference(pendingWeeks, failedWeeks);
  if(removableTransactions.length){
    Transactions.remove({
      commitment: doc._id,
      reportingPeriod: {$in: removableTransactions}
    });
  }
}