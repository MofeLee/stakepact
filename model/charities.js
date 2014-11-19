Charities = new Mongo.Collection("charities");

Charities.allow({
  insert: function (userId, charity) {
    return userId && charity.owner === userId;
  },
  update: function (userId, charity, fields, modifier) {
    if (userId !== charity.owner)
      return false;

    return true;
  },
  remove: function (userId, charity) {
    if (userId !== charity.owner)
      return false;

    return true;
  }
});