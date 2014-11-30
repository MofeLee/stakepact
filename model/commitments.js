Commitments = new Mongo.Collection("commitments");

Commitments.allow({
  insert: function (userId, commitment) {
    return userId && commitment.owner === userId;
  },
  update: function (userId, commitment, fields, modifier) {
    if (userId !== commitment.owner)
      return false;

    return true;
  },
  remove: function (userId, commitment) {
    if (userId !== commitment.owner)
      return false;

    return true;
  }
});