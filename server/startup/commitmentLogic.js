// possibly integrate updateNotifications into commitments.js in an autovalue
Meteor.methods({
  updateNotifications: function(commitmentId, notifications){
    check(commitmentId, String);
    check(notifications, Schema.Notifications);

    var commitment = Commitments.findOne(commitmentId);
    if(!commitment){
      throw new Meteor.Error('commitment not found');
    }

    // check for authorization to update commitment
    var loggedInUser = Meteor.user();
    if (!loggedInUser ||
        (!Roles.userIsInRole(loggedInUser, ['manage-users','admin']) && 
        (!commitment.owner || commitment.owner != loggedInUser._id))) {
      throw new Meteor.Error(403, "Access denied");
    }

    if(notifications.alerts && notifications.alerts.schedule){
      notifications.alerts.notifications = createNotifications(notifications.alerts.schedule, 2);
    }

    if(notifications.reminders && notifications.reminders.schedule){
      notifications.reminders.notifications = createNotifications(notifications.reminders.schedule, 2);
    }

    function createNotifications(schedule, buffer){
      buffer = buffer? buffer: 0;

      var timezone = commitment.timezone ? commitment.timezone : 'America/Los_Angeles'; // default to PST

      var n = [];
      // loop through each active week and set the alert
      var endTime = moment(commitment.expiresAt).add(buffer, 'weeks');
      for (var m = moment().tz(timezone).startOf("day"); m.isBefore(endTime); m.add(1, "weeks")) {
        var weekly = _.map(schedule, function(el){
          var utcTime = moment(el.time).utc();
          var days = (utcTime.day() >= m.day()) ? utcTime.day() : utcTime.day() + 7;
          return {contactType: el.contactType, time: m.clone().day(days).hour(utcTime.hours()).minute(utcTime.minutes()).toDate()};
        });
        n = n.concat(weekly);
      }
      return n;
    }

    return Commitments.update({_id: commitmentId}, {$set: {'notifications': notifications}});
  }
});

// after updating a commitment
// automatically insert/remove/update associated transactions
Commitments.after.update(function (userId, doc, fieldNames, modifier, options) {
  console.log(fieldNames);
  console.log(modifier);

  // if stakes are removed, remove all pending transactions
  // if stakes are modified, pending transactions don't store any stakes data so no changes
  // this means if you change the stakes, it will affect all pending transactions
  if(_.contains(fieldNames, 'stakes') && !doc.stakes){
    return Transactions.remove({commitment: doc._id, pending: true});
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
    console.log(newTransactionObjects);
    _.each(newTransactionObjects, function(transaction){
      Transactions.insert(transaction);
    });
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