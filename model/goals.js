Goals = new Mongo.Collection("goals");

Charities.allow({
  insert: function (userId, goal) {
    return userId && goal.owner === userId;
  },
  update: function (userId, goal, fields, modifier) {
    if (userId !== goal.owner)
      return false;

    return true;
  },
  remove: function (userId, goal) {
    if (userId !== goal.owner)
      return false;

    return true;
  }
});