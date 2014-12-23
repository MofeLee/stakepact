var djs = Meteor.npmRequire('datejs');

Meteor.methods({
  getSuccessReport: function(commitment, weeksBeforeToday){
    var latestDay = Math.min(Date.today(), commitment.createdAt.add(commitment.duration).weeks());  // start from today or the last allowed day for expired commitments
    var startDate;
    if(weeksBeforeToday && weeksBeforeToday < (latestDay - commitment.createdAt)){
      startDate = latestDay.clone().add(-7*weeksBeforeToday).mon();   // return the Monday of the week weeksBeforeToday ago
    } else {
      startDate = commitment.createdAt.getDay()!=1? commitment.createdAt.moveToDayOfWeek(1, 1): commitment.createdAt;  // start on a Monday
    }

    var diffDays = (latestDay - startDate)/(24*60*60*1000);
    var weeks = Math.ceil(diffDays/7);

    var statusReport = {
      successful: [],
      failed: []
    };

    for(var i = 0; i < weeks; i++){
      var week = startDate.clone().add(7*i).days();
      if(isFailedWeek(latestDate, week, commitment.frequency, commitment.checkins)){
        statusReport.failed.push(toISODate(week));
      }else{
        statusReport.successful.push(toISODate(week));
      }
    }
    return statusReport;
  }
});

//  return whether there are fewer checkins than the specified frequency within a given week starting on startDate
//  if we are mid-period, return false if it is not possible to meet frequecy threshold in remaining days
function isFailedWeek(latestDate, startDate, frequency, checkins){
  var diffDays = (latestDate - startDate)/(24*60*60*1000); // get the diff in days from startDate and today
  var checkinCount = getCheckinsForPeriod(checkins, startDate, startDate.clone().add(7).days()).length;
  if(diffDays < 7){
    daysLeft = 7 - diffDays;
    return checkinCount + daysLeft < frequency;
  } else {
    return checkinCount < frequency;
  }
}

//  return all the checkins between the specified start and end date including those dates
function getCheckinsForPeriod(checkins, startDate, endDate){
  return _.filter(checkins, function(checkin){
    return Date.parse(checkin).between(startDate, endDate);
  });
}

//  return ISO string version of a Date object 
function toISODate(date){
  return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
}