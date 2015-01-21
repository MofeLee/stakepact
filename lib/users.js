var Schema = {};

var phoneRegex = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;

Schema.UserProfile = new SimpleSchema({
  name: {
    type: String,
    label: "name",
    regEx: /^[a-z0-9A-z . -]{3,30}$/,
    optional: true
  },
  birthday: {
    type: Date,
    optional: true
  },
  gender: {
    type: String,
    allowedValues: ['Male', 'Female'],
    optional: true
  },
  organization : {
    type: String,
    regEx: /^[a-z0-9A-z . -]{3,30}$/,
    optional: true
  },
  website: {
    type: String,
    regEx: SimpleSchema.RegEx.Url,
    optional: true
  },
  bio: {
    type: String,
    optional: true
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
  }
});

Schema.User = new SimpleSchema({
  username: {
    type: String,
    regEx: /^[a-z0-9A-Z_]{3,15}$/,
    optional: true
  },
  emails: {
    type: [Object],
    // this must be optional if you also use other login services like facebook,
    // but if you use only accounts-password, then it can be required
    optional: true
  },
  phone: {
    type: String,
    label: "phone number",
    regEx: phoneRegex,
    optional: true
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.$.verified": {
    type: Boolean
  },
  createdAt: {
    type: Date
  },
  profile: {
    type: Schema.UserProfile,
    optional: true
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  // Add `roles` to your schema if you use the meteor-roles package.
  // Note that when using this package, you must also specify the
  // `Roles.GLOBAL_GROUP` group whenever you add a user to a role.
  // Roles.addUsersToRoles(userId, ["admin"], Roles.GLOBAL_GROUP);
  // You can't mix and match adding with and without a group since
  // you will fail validation in some cases.
  roles: {
    type: Object,
    optional: true,
    blackbox: true
  },

  commitments: {
    type: [String],
    optional: true
  },

  credit_card_id: {
    type: Object,
    optional: true,
    blackbox: true
  },

  timezone: {
    type: String,
    label: 'timezone name',
    optional: true
  }
});

Meteor.users.attachSchema(Schema.User);

Meteor.users.deny({
  update: function (userId, user, fields, modifier) {
    if (userId !== user._id){
      return true;
    }

    // logic for limiting profile editing
    return false;
  }
});

Meteor.users.allow({
  update: function(userId, user, fields, modifier) {
    if(userId === user._id || Roles.userIsInRole(userId, ['manage-users','admin'])){
      return true;
    }else{
      return false;
    }
  }
});