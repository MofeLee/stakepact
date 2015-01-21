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
    // run notification code

    // get the current utc day, hour, and minute
    var now = moment.utc();

    // create a date that represents the day, hour, and minute from utc time
    var lookupTime = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute(), 'minutes').toISOString();

    sendReminders(now, lookupTime);
    sendAlerts(now, lookupTime);
  }
});

// // start the cron job
// SyncedCron.start();


// send reminders to all users who set notifications for this minute (adjusted for timezone)
function sendReminders(now, lookupTime){
  // get all the reminders with the lookupTime signature
  var reminders = Notifications.find({
    'time': lookupTime,
    'type': 'reminder'
  }).fetch();

  // send reminders via email or text to users if they haven't checked in yet today
  // find each commitment and send an email or text with the latest information
  _.each(reminders, function(reminder){

    var commitment = Commitments.findOne({_id: reminder.commitment});
 
    // if the user hasn't checked in yet, send the reminder 
    // get the checkin status given the current day according to the user's time zone
    if(!_.contains(commitment.checkins, now.tz(commitment.timezone).format('YYYY-MM-DD'))){
      if(reminder.contactType === 'email'){ // send a reminder email
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
  // get all the alerts with the lookupTime signature
  var alerts = Notifications.find({
    'time': lookupTime,
    'type': 'alert'
  }).fetch();

  // send alerts via email or text to users if they are going to fail the week or have pending transactions
  // find each commitment and send an email or text with the latest information
  _.each(alerts, function(alert){

    var commitment = Commitments.findOne({_id: alert.commitment});

    console.log(now.tz(commitment.timezone).format('YYYY-MM-DD'));  

    var data = {commitment: commitment};

    var dividedWeeks = Meteor.call('getSuccessReport', commitment._id, 1); // check the most recent reporting period
    var successfulWeeks = dividedWeeks.successful;
    var failedWeeks = dividedWeeks.failed;

    // find the pending transactions for the commitment
    var pendingTransactions = Transactions.find({commitment: commitment._id, pending: true}).fetch();
    if(pendingTransactions){
      data.charity = Charities.findOne({_id: commitment.stakes.charity});
      data.transactions = pendingTransactions;
    }

    // verify that the current week isn't on track or it's monday and they failed last week
    // only send one message if a pending transaction is created
    console.log(dividedWeeks);
    console.log(pendingTransactions);
    console.log(data);

    // if the user is going to fail the week or has pending transactions, send the alert 
    if(failedWeeks.length > 0 || pendingTransactions.length > 0){

      if(alert.contactType === 'email'){ // send a reminder email
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
  if(data.transactions){
    subject = sprintf('Alert: Pending transaction to %s', data.transaction.charityName);
    text = sprintf('Hey %s,\n\nThis is a warning that you have the following pending transactions:', data.owner.profile.name);
    text += vsprintf('\n$%1$s will be sent to %2$s on %3$s for failing to %4$s %5$s times for the week of %6$s.', 
      [data.transaction.ammount, data.charity.name, data.transaction.transactionDate, data.commitment.activity, data.commitment.frequency, data.transaction.reportingPeriod]);
    text += '\n\nSincerely,\nThe Stakepact Team';
  }else{
    subject = sprintf('Alert: Not on track to %s %s times this week', data.commitment.activity, data.commitment.frequency);
  }

  return {
    from: sprintf('Stakepact Notifications <%s>', Meteor.settings.gmail.username), // sender address
    to: sprintf('%s <%s>', data.owner.profile.name, data.email), // send email to first email on record for now
    subject: subject, // Subject line
    text: text
    // html: '<b>Do it!</b>' // html body
  };
}