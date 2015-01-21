//////////// users

// server: publish the phone, timezone, and commitments for this user
Meteor.publish("my_data", function () {
  if (this.userId) {
    return Meteor.users.find({_id: this.userId},
    {fields: {'phone': 1, 'timezone': 1, 'commitments': 1}});
  } else {
    this.ready();
  }
});


//////////// charities

// server: publish the charity collection with barebones info, unless admin
Meteor.publish("charities", function(channel_name) {
  var channel = {};
  if(channel_name === "verified"){
    channel = {verified: true, wepay: {$exists: true}};
  }

  if(Roles.userIsInRole(this.userId, ['manage-users','admin'])){
    return Charities.find(channel);
  }else {
    // non-admin users can't see unverified charities that don't have wepay accounts
    channel.verified = true;
    channel.wepay = {$exists: true};

    return Charities.find(channel, {fields: {name: 1, city: 1, state: 1, ein: 1, website: 1}});
  }
});

// server: publish the charities created by the user, minus secret wepay info.
Meteor.publish("my_charities", function() {
  return Charities.find({owner: this.userId}, {fields: {wepay: 0}});
});


//////////// commitments

// server: publish the commitments created by the user
Meteor.publish("my_commitments", function() {
  return Commitments.find({owner: this.userId});
});

// server: publish all the commitments for admin only
Meteor.publish("commitments", function(channel_name) {
  var channel = {};
  
  if(Roles.userIsInRole(this.userId, ['manage-users','admin'])){
    return Commitments.find(channel);
  }else{
    this.ready();
  }
});


//////////// notifications

// server: publish the notifications created by the user
Meteor.publish("my_notifications", function(commitment) {
  var criteria = {owner: this.userId};
  criteria.commitment = commitment;
  return Notifications.find(criteria);
});

// server: publish all the commitments for admin only
Meteor.publish("notifications", function(channel_name) {
  var channel = {};
  
  if(Roles.userIsInRole(this.userId, ['manage-users','admin'])){
    return Notifications.find(channel);
  }else{
    this.ready();
  }
});