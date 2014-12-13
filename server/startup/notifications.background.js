SyncedCron.add({
  name: 'Remind all the beautiful people',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every hour');
  }, 
  job: function() {
    // run notification code
  }
});