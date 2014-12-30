Meteor.methods({
  /**
   * determine which weeks a user hit their checkin quota thus far (also works for expired commitments)
   *
   * @param {String} commitment to test
   * @param {Number} weeksBeforeToday number of weeks preceeding today to test (optional)
   */ 
  getSuccessReport: function(commitment, weeksBeforeToday){
    var endDate = moment.min(moment().startOf('day'), moment(commitment.createdAt).add(commitment.duration, 'weeks').startOf('day'));  // test up to today or the last active day for expired commitments

    var startDate;
    if(weeksBeforeToday && weeksBeforeToday < endDate.diff(moment(commitment.createdAt), 'weeks')){  // if weeksBeforeToday is passed and doesn't exceed the startDate
      startDate = endDate.clone().subtract(weeksBeforeToday, 'weeks').startOf('isoweek');   // return the Monday of the week weeksBeforeToday ago
    } else {
      startDate = moment(commitment.createdAt).day() === 1 ? moment(commitment.createdAt).startOf('day') : moment(commitment.createdAt).day(8).startOf('day');  // start on a Monday
    }

    // get the days in between the start and end date
    var diffDays = endDate.diff(startDate, 'days');
    var weeks = Math.ceil(diffDays/7);

    var statusReport = {
      successful: [],
      failed: []
    };

    for(var i = 0; i < weeks; i++){
      var currentDate = startDate.clone().add(i, 'weeks');
      if(isFailedWeek(currentDate, endDate, commitment.frequency, commitment.checkins)){
        statusReport.failed.push(currentDate.format('YYYY-MM-DD'));
      }else{
        statusReport.successful.push(currentDate.format('YYYY-MM-DD'));
      }
    }
    return statusReport;
  }
});


//  return whether there are fewer checkins than the specified frequency within a given week starting on startDate
//  if we are mid-period, return false if it is not possible to meet frequecy threshold in remaining days
function isFailedWeek(startDate, endDate, frequency, checkins){
  var diffDays = endDate.diff(startDate, 'days'); // get the difference between startDate and endDate
  var checkinCount = getCheckinsForPeriod(checkins, startDate, startDate.clone().add(1, 'week')).length;  // count checkins for week starting on startDate
  if(diffDays < 7){
    daysLeft = 7 - diffDays;  //  if currently mid week, calculate days remaining
    return checkinCount + daysLeft < frequency; // return whether current checkin count plus days remaining in the week won't be enough to reach frequency
  } else {
    return checkinCount < frequency;
  }
}


//  return all the checkins between the specified start and end date including those dates
function getCheckinsForPeriod(checkins, startDate, endDate){
  var range = moment().range(startDate, endDate);
  return _.filter(checkins, function(checkin){
    return range.contains(moment(checkin, "YYYY-MM-DD"));
  });
}