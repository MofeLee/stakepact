var Schema = {};

Schema.Notifications = new SimpleSchema({
  commitment: {
    type: String,
    label: 'commitment_id'
  },
  time: {
    type: Date,
    label: 'notification time' 
  },
  type: {
    type: String,
    allowedValues: ['alert', 'reminder']
  }
});

Notifications = new Mongo.Collection("notifications");
Notifications.attachSchema(Schema.Notifications);

Notifications.allow({
  insert: function (userId, notification) {
    console.log('inserting notification for ' + notification.commitment);
    return false;
  },
  update: function (userId, notification, fields, modifier) {
    console.log('updating notification for ' + notification.commitment);
    return false;
  },
  remove: function (userId, notification) {
    console.log('removing notification for ' + notification.commitment);
    return false;
  }
});