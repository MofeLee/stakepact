// Meteor.npmRequire('angular-boostrap');

Meteor.startup(function () {
  if (Charities.find().count() === 0) {

    var charities = [
      {'name': 'Dubstep-Free Zone'},
      {'name': 'All dubstep all the time'},
      {'name': 'Savage lounging'}
    ];

    for (var i = 0; i < charities.length; i++)
      Charities.insert({name: charities[i].name});
  }
});