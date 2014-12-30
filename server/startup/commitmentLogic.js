// after updating a commitment
// automatically insert/remove/update associated transactions
// automatically insert/remove/update associated notifications
Commitments.after.update(function (userId, doc, fieldNames, modifier, options) {
  // update notification objects if notifications were altered
  if(_.contains(fieldNames, 'notifications')){
    updateNotifications(this.previous, doc);
  }

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

function updateNotifications(commitmentBefore, commitmentAfter){
  removeDisabledNotifications('reminders');
  removeDisabledNotifications('alerts');

  insertAndUpdateNotifications('reminders');
  insertAndUpdateNotifications('alerts');

  //  remove any newly disabled notifications
  var removeDisabledNotifications = function(type){
    if(commitmentBefore.notifications[type] && commitmentBefore.notifications[type].enabled && commitmentBefore.notifications[type].times){
      
      var daysAfter;  // create an array of the active reminder days in the new commitment
      
      if(commitmentAfter.notifications[type] && commitment.notifications[type].enabled && commitmentBefore.notifications[type].times){
        daysAfter = _.pluck(commitmentAfter.notifications[type].times, 'days');
      }else{
        daysAfter  = [];  // if reminders are disabled or don't exist
      }
   
      var notificationsToRemove = _.filter(commitmentBefore.notifications[type].times, function(time){
        return !_.contains(daysAfter, time.day);
      });

      if(notificationsToRemove.length){
        Notifications.remove({_id: {$in: _.pluck(notificationsToRemove, 'notification_id')}});
      }

    }
  };

  //  insert and update notifications
  var insertAndUpdateNotifications = function(type){
    if(commitmentAfter.notifications[type] && commitmentAfter.notifications[type].enabled && commitmentAfter.notifications[type].times){ 
      
      var offset = moment.tz(commitmentAfter.timezone)._offset;  // get the offset from gmt from the user's timezone

      _.each(commitmentAfter.notifications[type].times, function(time){
        newTime = moment.utc(0).add(time.day, 'days').add(time.hour, 'hours').add(time.minute + offset, 'minutes').toDate();  // utc time + timezone offset, so the notification is sent on time!
        
        if(time.notification_id){
          Notifications.update({_id: time.notification_id}, {$set: {time: newTime}});
        } else {
          Notifications.insert({commitment: commitmentAfter._id, time: newTime, type: 'reminder'});
        }

      });

    }
  };
}