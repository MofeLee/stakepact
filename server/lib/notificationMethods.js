Meteor.methods({
  /**
   * determine which weeks a user hit their checkin quota thus far (also works for expired commitments)
   *
   * @param {String} commitment to test
   * @param {Number} weeksBeforeToday number of weeks preceeding today to test (optional)
   */ 
  setNotificationsForCommitment: function(commitment_id, notifications){
    // check for authorization to update notifications
    var loggedInUser = Meteor.user();

    var commitment = Commitments.findOne({_id: commitment_id});
    if(!commitment){
      throw new Meteor.Error('bad-request', 'commitment not found');
    }
    
    if (!loggedInUser ||
        (!Roles.userIsInRole(loggedInUser, ['manage-users','admin']) && 
        (!commitment.owner || commitment.owner != loggedInUser._id))) {
      throw new Meteor.Error(403, "Access denied");
    }

    if(commitment.notifications){
      var oldNotifications = Array.prototype.concat.apply([], _.values(commitment.notifications));
      Notifications.remove({_id: {$in: oldNotifications}});
    }

    if(notifications){
      reminderIds = [];
      alertIds = [];
      var newNotifications = Array.prototype.concat.apply([], _.values(notifications));
      _.each(notifications.reminders, function(notification){
        try{
          var _id = Notifications.insert(notification);
          if(notification.type == 'reminder')
            reminderIds.push(_id);
          else
            alertIds.push(_id);
        } catch (error){
          throw new Meteor.Error(error);
        }
      });

      try{
        var docs = Commitments.update({_id: commitment_id}, {$set: {notifications: {reminders: reminderIds, alerts: alertIds}}});
        return docs;
      } catch(error){
        throw new Meteor.Error(error);
      }
    }
  }
});

