// write strings with ease
var sprintf = Meteor.npmRequire("sprintf-js").sprintf,
    vsprintf = Meteor.npmRequire("sprintf-js").vsprintf;

// send email via nodemailer
var nodemailer = Meteor.npmRequire('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: Meteor.settings.gmail.username,
    pass: Meteor.settings.gmail.password
  }
});

///////////////////////////

// every minute, send notifications to the right users at the right time 
SyncedCron.add({
  name: 'remind and alert all the beautiful people',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every 1 minutes');
  }, 
  job: function() { // run through all collections and rebuild Notifications for the day
    // get the current utc day, hour, and minute
    var now = moment.utc();

    // create a date that represents the day, hour, and minute from utc time
    var lookupTime = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute(), 'minutes').toDate();

    // send notifications
    sendReminders(now, lookupTime);
    sendAlerts(now, lookupTime);
  }
});

// // start the cron job
SyncedCron.start();


// send reminders to all users who set notifications for this minute (adjusted for timezone)
function sendReminders(now, lookupTime){
  // get all the commitments with a reminder scheduled for lookupTime
  var commitments = Commitments.find({
    'notifications.reminders.time' : lookupTime
  }).fetch();

  // send reminders via email or text to users if they haven't checked in yet today
  // find each commitment and send an email or text with the latest information
  _.each(commitments, function(commitment){
 
    // if the user hasn't checked in yet, send the reminder 
    // get the checkin status given the current day according to the user's time zone
    if(!_.contains(commitment.checkins, now.tz(commitment.timezone).format('YYYY-MM-DD'))){
      if(_.findWhere(commitment.notifications.reminders, {time: lookupTime}).contactType === 'email'){ // send a reminder email
        sendNotificationEmail({commitment: commitment}, 'reminder', function(error, info){
          if(error){
            console.log(error);
          }else{
            console.log('Message sent: ' + info.response);
          }
        });
      }else{  // send a reminder text

      }
    }
  });
}

// send alerts to all users who set notifications for this minute (adjusted for timezone)
function sendAlerts(now, lookupTime){
  // get all the commitments with a reminder scheduled for lookupTime
  var commitments = Commitments.find({
    'notifications.alerts.time' : lookupTime
  }).fetch();

  // send alerts via email or text to users if they are going to fail the week or have pending transactions
  // find each commitment and send an email or text with the latest information
  _.each(commitments, function(commitment){
    var data = {commitment: commitment};

    var dividedWeeks = Meteor.call('getSuccessReport', commitment._id, 1); // check the most recent reporting period
    data.failedWeeks = dividedWeeks.failed;

    // find the pending transactions for the commitment
    var pendingTransactions = Transactions.find({commitment: commitment._id, pending: true}).fetch();
    if(pendingTransactions.length){
      data.charity = Charities.findOne({_id: commitment.stakes.charity}, {fields: {name: 1}});
      data.transactions = pendingTransactions;
    }

    // verify that the current week isn't on track or it's monday and they failed last week
    // only send one message if there are multiple pending transactions and/or failed week
    // if the user is going to fail the week or has pending transactions, send the alert 
    if(data.failedWeeks.length > 0 || pendingTransactions.length > 0){

      if(_.findWhere(commitment.notifications.alerts, {time: lookupTime}).contactType === 'email'){ // send an alert email
        sendNotificationEmail(data, 'alert', function(error, info){
          if(error){
            console.log(error);
          }else{
            console.log('Message sent: ' + info.response);
          }
        });
      }else{  // send a alert text

      }
    }
  });
}

// send a notification email to the given commitment
function sendNotificationEmail(data, type, callback){
  data.owner = Meteor.users.findOne({_id: data.commitment.owner});
  if(!data.owner){
    callback('owner not found', null);
  }

  if(data.owner.emails && data.owner.emails.length > 0){
    data.email = data.owner.emails[0].address;
  }else if(data.owner.services && data.owner.services.facebook && data.owner.services.facebook.email){
    data.email = data.owner.services.facebook.email;
  }

  if(data.email){
    // setup e-mail data for reminder or alert
    var mailOptions = (type === 'reminder')? buildReminderEmail(data) : buildAlertEmail(data);

    // send mail with defined transport object
    transporter.sendMail(mailOptions, callback);
  }else{
    callback('no email accounts associated with owner', null);
  }
}

function buildReminderEmail(data){
  return {
    from: sprintf('Stakepact Notifications <%s>', Meteor.settings.gmail.username), // sender address
    to: sprintf('%s <%s>', data.owner.profile.name, data.email), // send email to first email on record for now
    subject: sprintf('Reminder to %s', data.commitment.activity), // Subject line
    text: vsprintf('Hey %1$s,\n\nThis is a friendly reminder from Stakepact to %2$s today.\n\nSincerely,\nThe Stakepact Team',
      [data.owner.profile.name, data.commitment.activity]), // plaintext body
    // html: '<b>Do it!</b>' // html body
  };
}

function buildAlertEmail(data){
  var subject, text;
  text = sprintf('Hey %s,', data.owner.profile.name);
  if(data.transactions){
    subject = sprintf('Alert: Pending transaction to %s', data.charity.name);
    text += '\n\nThis is a warning that you have the following pending transactions:';
    _.each(data.transactions, function(transaction){
      text += vsprintf('\n\n$%1$s will be sent to %2$s on %3$s for failing to %4$s %5$s times for the week of %6$s.', 
      [data.commitment.stakes.ammount, data.charity.name, moment(transaction.transactionDate).format('M/DD/YY'), data.commitment.activity, data.commitment.frequency, moment(transaction.reportingPeriod).format('M/DD/YY')]);
    });
  }
  if(data.failedWeeks){
    if(!subject)
      subject = sprintf('Alert: Not on track to %s %s times this week', data.commitment.activity, data.commitment.frequency);
    if(data.transactions)
      text += '\n\nWe also wish to warn you that ';
    else
      text += '\n\nThis is a warning that ';
    text += sprintf('you are not on track to %s %s times this week.', data.commitment.activity, data.commitment.frequency);
  }

  text += '\n\nSincerely,\nThe Stakepact Team';

  return {
    from: sprintf('Stakepact Notifications <%s>', Meteor.settings.gmail.username), // sender address
    to: sprintf('%s <%s>', data.owner.profile.name, data.email), // send email to first email on record for now
    subject: subject, // Subject line
    text: text
    // html: '<b>Do it!</b>' // html body
  };
}


// // this was used to test if alert emails were working -- you could eventually convert to jasmine tests and such
// var now = moment().utc();
// var inAMinute = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute() + 1, 'minutes').toISOString();
// console.log(Commitments.update({_id: 'S3v3ASipXepF2fhof'}, {$set: {'notifications.alerts.0.time': inAMinute}}));
// console.log(Commitments.find({'notifications.alerts.time': inAMinute}).fetch());
// Transactions.insert({
//   commitment: 'S3v3ASipXepF2fhof',
//   pending: true,
//   reportingPeriod: '2014-05-16',
//   transactionDate: moment().add(5, 'days').toISOString()
// });

// // this was used to test if alert emails were working -- you could eventually convert to jasmine tests and such
// var now = moment().utc();
// var inAMinute = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute() + 1, 'minutes').toISOString();
// console.log(Commitments.update({_id: 'PxhS5oRiRGgjYkSiu'}, {$set: {'notifications.alerts.0.time': inAMinute, 'createdAt': moment().subtract(2, 'weeks').toDate(), frequency: 7}}));
// console.log(Commitments.find({'notifications.alerts.time': inAMinute}).fetch());
