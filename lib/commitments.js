// right now, expiration doesn't take into account daylight savings time
Schema.NotificationElement = new SimpleSchema({
  schedule: {
    type: [Object],
    label: 'notification schedule',
    optional: true
  },
  'schedule.$.time': {
    type: Date,
    label: 'notification scheduled time'
  },
  'schedule.$.contactType': {
    type: String,
    allowedValues: ['email', 'text']
  },
  notifications: {
    type: [Object],
    label: 'notification elements',
    optional: true
  },
  'notifications.$.time': {
    type: Date,
    label: 'notification time'
  },
  'notifications.$.contactType': {
    type: String,
    allowedValues: ['email', 'text']
  }
});

Schema.Notifications = new SimpleSchema({
  alerts: {
    type: Schema.NotificationElement,
    label: 'alerts',
    optional: true
  },
  reminders: {
    type: Schema.NotificationElement,
    label: 'reminders',
    optional: true
  },
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
  reportsAt: {
    type: [Date],
      autoValue: function() {
        if(this.field('timezone').isSet || this.field('duration').isSet){
          return getReportingTimes(this.field('timezone').value, this.field('duration').value, this.field('createdAt').value);
        }
      }
  },
  expiresAt: {
    type: Date,
      autoValue: function() {
        var createdAt = this.field('createdAt');
        if (createdAt.isSet || this.field('timezone').isSet || this.field('duration').isSet) {  // update if any of these fields change
          console.log("changing expiresAt");
          var firstMonday = moment(createdAt).day() === 1 ? moment(createdAt).startOf('day') : moment(createdAt).day(8).startOf('day');  // start on a Monday
          return firstMonday.add(this.field('duration').value, 'weeks').toDate();  // add duration for expiration
        }
      }
  },
  stakes: {
    type: Schema.Stakes,
    optional: true
  },
  timezone: {
    type: String,
    label: 'timezone name'
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

// set weekly reporting times for the commitment
function getReportingTimes(timezone, duration, createdAt){
  createdAt = moment.tz(createdAt, timezone? timezone: 'America/Los_Angeles'); // get the createdAt time in timezone

  var firstMonday = createdAt.day() === 1 ? createdAt.startOf('day') : createdAt.day(8).startOf('day');  // start on a Monday
  var endDate = firstMonday.clone().add(duration, 'weeks');

  var reportingTimes = [];
  for (var m = firstMonday; m.isBefore(endDate); m.add(1, "weeks")) {
    reportingTimes.push(m.toDate());
  }
  return reportingTimes;
}