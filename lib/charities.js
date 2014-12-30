var Schema = {};

var phoneRegex = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;

Schema.Contact = new SimpleSchema({
  name: {
    type: String,
    label: "name",
    regEx: /^[a-z0-9A-z .]{3,30}$/
  },
  email: {
    type: String,
    label: "email",
    regEx: SimpleSchema.RegEx.Email
  },
  phone : {
    type: String,
    label: 'phone',
    regEx: phoneRegex
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
  }
});

Schema.WePay = new SimpleSchema({
  account_id: {
    type: Number,
    label: "account_id",
  }, 
  access_token: {
    type: Object,
    optional: true,
    blackbox: true
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
  }
});

Schema.Charity = new SimpleSchema({
  owner : {
    type: String,
    label: "owner",
  },
  contact: {
    type: Schema.Contact,
  },
  name: {
    type: String,
    label: "name",
    regEx: /^[a-z0-9A-z .]{3,30}$/
  },
  website: {
    type: String,
    label: 'website',
    regEx: SimpleSchema.RegEx.WeakDomain,
    optional: true
  },
  description: {
    type: String,
    label: 'description',
    optional: true,
    max: 200
  },
  city: {
    type: String,
    label: 'city',
    max: 200
  },
  state: {
    type: String,
    label: 'state',
    regEx: /^(?:(A[KLRZ]|C[AOT]|D[CE]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY]))$/
  },
  ein: {
    type: String,
    label: 'EIN',
    regEx: /[0-9]{2}-[0-9]{7}/,
    max: 10
  },
  verified: {
    type: Boolean,
    label: 'verified',
    autoValue: function() {
      if (Roles.userIsInRole(this.userId, ['manage-users','admin'])) {
        return this.value || false;
      }else{
        return false;
      }
    }
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
  wepay: {
    type: Schema.WePay,
    label: "WePay",
    optional: true
  }
});

Charities = new Mongo.Collection("charities");

Charities.attachSchema(Schema.Charity);

Charities.allow({
  insert: function (userId, charity) {
    console.log('inserting ' + charity.name);
    return userId && (charity.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  },
  update: function (userId, charity, fields, modifier) {
    console.log('updating ' + charity.name);
    return userId && (charity.owner === userId || Roles.userIsInRole(userId, ['manage-users','admin']));
  },
  remove: function (userId, charity) {  // only remove a charity once wepay account is removed
    return !charity.wepay && userId && Roles.userIsInRole(userId, ['manage-users','admin']);
  }
});

Charities.deny({
  update: function(userId, charity, fields, modifier){

    // basic denied fields
    var denied = ["verified"];
    if(_.intersection(fields, denied).length && !Roles.userIsInRole(userId, ['manage-users','admin'])){
      return true;
    }

    // not even admins can modify these fields
    var superDenied = ["wepay"];
    if(_.intersection(fields, superDenied).length){
      console.log("wepay changes denied!");
      return true;
    }

    return false;
  }
});