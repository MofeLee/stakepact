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
    label: "start date"
  }
});

Schema.Commitment = new SimpleSchema({
  owner : {
    type: String,
    label: "owner",
  },
  checkins : {  // stores a Date object representing the day and a boolean for whether or not the user has checked in
    type: [Object],
     autoValue: function() {
      if (this.isInsert) {
        var startDate = new Date(); // get the current time
        var copiedDate = new Date(startDate.getTime()); // copy the current time object
        var duration = this.field("duration").value;  // determine the duration of the commitment
        var checkins = [{date: copiedDate, checkedIn: false}];  // create the first element in the array with the copied object
        for(var i = 1; i < duration*7; i++){  // increment the date and add each day to array for 7 days * duration in weeks
          checkins[i] = {date: new Date(startDate.setDate(startDate.getDate()+1)), checkedIn: false};
        }
        return checkins;
      } else {  // if updating, if the duration increases, add more unchecked elements to the array
        if(this.field("duration").operator==="$set"){
          var thisCommitment = Commitments.findOne({_id: this.docId});  // right now, the best way i can see to access this field is by searching mongo
          if(thisCommitment.checkins){
            var diff = this.field("duration").value*7 - thisCommitment.checkins.length; // find the difference between duration in weeks * 7 and current array length
            if(diff>0){
              var lastDate = _.last(thisCommitment.checkins).date;
              newCheckins = [];
              for(var j = 0; j < diff; j++){
                newCheckins[j] = {date: new Date(lastDate.setDate(lastDate.getDate()+1)), checkedIn: false};  // create new elements for each new day 
              }
              return {$push: {$each: newCheckins}}; // push new elements onto checkins
            }
          }
        }
      }
    }
  },
  "checkins.$.date": {
    type: Date
  },
  "checkins.$.checkedIn": {
    type: Boolean
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