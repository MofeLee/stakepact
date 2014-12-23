var Schema = {};

Schema.NotificationDetails = new SimpleSchema({
  contactType: {
    type: String,
    label: 'contact type',
    allowedValues: ['text', 'email'],
    optional: true
  },
  frequency: {
    type: String,
    label: 'frequency',
    allowedValues: ['daily', 'weekly'],
    optional: true
  },
  //  when you wanna make serious notifications!
  times: {
    type: [Object],
    label: 'times',
    optional: true
  },
  'times.$.minute': {
    type: Number,
    min: 0,
    max: 59
  },
  'times.$.hour': {
    type: Number,
    min: 0,
    max: 23
  },
  'times.$.day': {
    type: Number,
    min: 0,
    max: 6
  },
  enabled: {
    type: Boolean,
    label: 'enabled'
  }
});

Schema.Notifications = new SimpleSchema({
  alerts: {
    type: Schema.NotificationDetails,
    label: 'alerts'
  },
  reminders: {
    type: Schema.NotificationDetails,
    label: 'reminders'
  }
});

Schema.Stakes = new SimpleSchema({
  charity: {
    type: String,
    label: "charity_id"
  }, 
  charityType: {
    type: String,
    label: "charity type",
    allowedValues: ['charity', 'anti-charity']
  }, 
  ammount: {
    type: Number,
    label: "ammount",
    decimal: true
  },
  startDate: {
    type: Date,
    label: "startDate"
  }
});

Schema.Commitment = new SimpleSchema({
  owner : {
    type: String,
    label: "owner",
  },
  checkins : {  // stores an array of strings representing checked-in days e.g. ['2014-12-31', '2015-01-01']
    type: [String],
    optional: true
  },
  activity: {
    type: String,
    label: "activity",
    min: 1
  },
  frequency: {
    type: Number,
    label: 'frequency',
    min: 1,
    max: 7
  },
  duration: {
    type: Number,
    label: 'duration',
    min: 1,
    max: 52
  },
  createdAt: {
    type: Date,
      autoValue: function() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return {$setOnInsert: new Date()};
        } else {
          this.unset();
        }
      }
  },
  updatedAt: {
    type: Date,
    autoValue: function() {
      if (this.isUpdate) {
        return new Date();
      }
    },
    denyInsert: true,
    optional: true
  },
  stakes: {
    type: Schema.Stakes,
    optional: true
  },
  notifications: {
    type: Schema.Notifications,
    optional: true
  }
});

Commitments = new Mongo.Collection("commitments");
Commitments.attachSchema(Schema.Commitment);

Commitments.allow({
  insert: function (userId, commitment) {
    console.log('inserting ' + commitment.activity);
    return userId && (commitment.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  },
  update: function (userId, commitment, fields, modifier) {
    console.log('updating ' + commitment.activity);
    return userId && (commitment.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  },
  remove: function (userId, commitment) {
    console.log('removing ' + commitment.activity);
    return userId && (commitment.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  }
});

// after updating a commitment, automatically insert/remove/update associated transactions
Commitments.after.update(function (userId, doc, fieldNames, modifier, options) {
  // if checkins, frequency, or duration are modified, update pending transactions
  if(_.intersection(fieldNames,['checkins', 'frequency', 'duration']).length){
    updatePendingTransactions(doc);
  }

  // if stakes are removed, remove all pending transactions
  // if stakes are just modified, pending transactions don't store these items so no changes
  if(_.contains(fieldNames, 'stakes') && !doc.stakes){
    Transactions.remove({commitment: doc._id, pending: true});
  }
}, {fetchPrevious: false});


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
  _.each(newTransactions, function(period){
    Transactions.insert({
      commitment: doc._id,
      reportingPeriod: period,
      transactionDate: Date.parse(period).add(3).weeks(),
      pending: true
    });
  });

  // remove transactions for weeks that are no longer failed
  var removableTransactions = _.difference(pendingWeeks, failedWeeks);
  _.each(removableTransactions, function(period){
    Transactions.remove({
      commitment: doc._id,
      reportingPeriod: period
    });
  });
}