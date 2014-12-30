// SyncedCron.add({
//   name: 'Remind all the beautiful people',
//   schedule: function(parser) {
//     // parser is a later.parse object
//     return parser.text('every hour');
//   }, 
//   job: function() {
//     // run notification code
//   }
// });

// add a cron job that modifies all commitments who are in timezones affected by daylight savings on the date

// every minute, send notifications to the right users at the right time 
SyncedCron.add({
  name: 'reminders and alert all the beautiful people',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every minute');
  }, 
  job: function() { // run through all collections and rebuild Notifications for the day
    // run notification code

    // get the current utc day, hour, and minute
    var now = moment.utc();
    var day = now.day();
    var hour = now.hour();
    var minute = now.minute();

    // create a date that represents the day, hour, and minute from utc time
    var lookupTime = moment.utc(0).add(day, 'days').add(hour, 'hours').add(minute, 'minutes').toDate();

    // get all the reminders with the lookupTime signature
    var reminders = Notifications.find({
      'time': lookupTime,
      'type': 'reminder'
    }).fetch();
    var commitmentsToRemind = Commitments.find({_id: {$in: _.pluck(reminders, 'commitment')}});

    // get all the alerts with the lookupTime signature
    var alerts = Notifications.find({
      'time': lookupTime,
      'type': 'alert'
    }).fetch();
    var commitmentsToAlert = Commitments.find({_id: {$in: _.pluck(alerts, 'commitment')}});
    // get all the pending transactions for each commitment
    // verify that the current week isn't on track or it's monday and they failed last week
    // only send one message if a pending transaction is created
    // CODE HERE!!!
  }
});

SyncedCron.start();