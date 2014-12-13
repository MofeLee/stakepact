// configure oauthSecretKey
OAuthEncryption.loadKey(Meteor.settings.oauthSecretKey);

// first, remove configuration entry in case service is already configured
ServiceConfiguration.configurations.remove({
  service: "facebook"
});
ServiceConfiguration.configurations.insert({
  service: "facebook",
  appId: Meteor.settings.facebook.appId,
  secret: Meteor.settings.facebook.secret
});

// SyncedCron default options
SyncedCron.options = {
  //Log job run details to console
  log: true,

  //Name of collection to use for synchronisation and logging
  collectionName: 'cronHistory',

  //Default to using localTime
  utc: false, 

  //TTL in seconds for history records in collection to expire
  //NOTE: Unset to remove expiry but ensure you remove the index from 
  //mongo by hand
  //
  //ALSO: SyncedCron can't use the `_ensureIndex` command to modify 
  //the TTL index. The best way to modify the default value of 
  //`collectionTTL` is to remove the index by hand (in the mongo shell 
  //run `db.cronHistory.dropIndex({startedAt: 1})`) and re-run your 
  //project. SyncedCron will recreate the index with the updated TTL.
  collectionTTL: 172800
};