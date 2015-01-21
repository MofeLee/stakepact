var Schema = {};

Schema.Notifications = new SimpleSchema({
  owner: {
    type: String,
    label: 'owner'
  },
  commitment: {
    type: String,
    label: 'commitment_id'
  },
  time: {
    type: String,
    label: 'notification time' 
  },
  type: {
    type: String,
    allowedValues: ['alert', 'reminder']
  },
  contactType: {
    type: String,
    allowedValues: ['email', 'text']
  }
});

Notifications = new Mongo.Collection("notifications");
Notifications.attachSchema(Schema.Notifications);

Notifications.allow({
  insert: function (userId, notification) {
    console.log('inserting notification for' + notification.commitment);
    return userId && (notification.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  },
  update: function (userId, notification, fields, modifier) {
    console.log('updating notification for ' + notification.commitment);
    return userId && (notification.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  },
  remove: function (userId, notification) {
    console.log('removing notification for ' + notification.commitment);
    return userId && (notification.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  }
});