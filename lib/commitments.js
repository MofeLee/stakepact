// right now, expiration doesn't take into account daylight savings time

var Schema = {};

Schema.Notifications = new SimpleSchema({
  alerts: {
    type: [Object],
    label: 'alerts',
    optional: true
  },
  'alerts.$.time': {
    type: Date,
    label: 'reminder time'
  },
  'alerts.$.contactType': {
    type: String,
    allowedValues: ['email', 'text']
  },
  reminders: {
    type: [Object],
    label: 'reminders',
    optional: true
  },
  'reminders.$.time': {
    type: Date,
    label: 'reminder time'
  },
  'reminders.$.contactType': {
    type: String,
    allowedValues: ['email', 'text']
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
  reportsAt: {
    type: Date,
      autoValue: function() {
        if(this.field('timezone').isSet){
          return moment.utc(0).add(moment.tz(this.field('timezone').value)._offset, 'minutes').toDate();  // you need to set a reporting time that corresponds to a timezone but is utc time
        } else {
          return undefined; // if the timezone isn't updated, don't change the value -- this might get you into trouble if you don't have the timezone right away
        }
      }
  },
  expiresAt: {
    type: Date,
      autoValue: function() {
        var createdAt = this.field('createdAt');
        var firstMonday = moment(createdAt).day() === 1 ? moment(createdAt).startOf('day') : moment(createdAt).day(8).startOf('day');  // start on a Monday
        return firstMonday.add(this.field('duration').value, 'weeks').utc().toDate();  // add duration for expiration, convert to utc Date object
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