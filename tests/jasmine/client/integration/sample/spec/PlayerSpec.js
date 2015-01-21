describe("Player", function() {
  var player;
  var song;

  beforeEach(function() {
    player = new Player();
    song = new Song();
  });

  it("should be able to play a Song", function() {
    player.play(song);
    expect(player.currentlyPlayingSong).toEqual(song);

    //demonstrates use of custom matcher
    expect(player).toBePlaying(song);
  });

  describe("when song has been paused", function() {
    beforeEach(function() {
      player.play(song);
      player.pause();
    });

    it("should indicate that the song is currently paused", function() {
      expect(player.isPlaying).toBeFalsy();

      // demonstrates use of 'not' with a custom matcher
      expect(player).not.toBePlaying(song);
    });

    it("should be possible to resume", function() {
      player.resume();
      expect(player.isPlaying).toBeTruthy();
      expect(player.currentlyPlayingSong).toEqual(song);
    });
  });

  // demonstrates use of spies to intercept and test method calls
  it("tells the current song if the user has made it a favorite", function() {
    spyOn(song, 'persistFavoriteStatus');

    player.play(song);
    player.makeFavorite();

    expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
  });

  //demonstrates use of expected exceptions
  describe("#resume", function() {
    it("should throw an exception if song is already playing", function() {
      player.play(song);

      expect(function() {
        player.resume();
      }).toThrowError("song is already playing");
    });
  });
});

// this was used to test if reminder emails were working -- you could eventually convert to jasmine tests and such
// var now = moment().utc();
// var inAMinute = moment.utc(0).add(now.day(), 'days').add(now.hour(), 'hours').add(now.minute() + 1, 'minutes').toISOString();
// console.log(inAMinute);
// Meteor.call('setNotificationsForCommitment', 'eEEQ5SYmFweoMobnj', {reminders: [{commitment: 'eEEQ5SYmFweoMobnj', time: inAMinute, owner: 'nsAnyj59NbX9Krrvk', type: 'reminder', contactType: 'email'}]}, function(a, b){
//   console.log(a);
//   console.log(b);
// });
