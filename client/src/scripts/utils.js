const moment = require('moment');

export const DAILY = "DAILY";
export const WEEKLY = "WEEKLY";
export const MONTHLY = "MONTHLY";

export const daysInMonth = date => new Date(new Date(date).getYear(), new Date(date).getMonth(), 0).getDate();

export const getYear = dateString => moment(dateString, "YYYY-M-DD").format('YYYY');

export const getMonth = dateString => moment(dateString, "YYYY-M-DD").format('M');

export const getDay = dateString => moment(dateString, "YYYY-M-DD").format('D');

export const getTimeUntilTomorrow = () => {
  let today = new Date();
  let utcDate = new Date(today.toLocaleString('en-US', { timeZone: "UTC" }));
  let tzDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  let offset = utcDate.getTime() - tzDate.getTime();
  let tmrwMidnight = new Date(new Date(today.setDate(today.getUTCDate()+1)).setHours(0,0,0,0)) - offset;
  let total = new Date(tmrwMidnight) - new Date();
  let seconds = parseInt(total/1000);
  let minutes = parseInt(seconds/60);
  let hours = parseInt(minutes/60);

  return hours +' hrs '+(1+minutes-hours*60)+' min'; // +1 to account for extra seconds
};

export const getPercentChangeColor = value => parseFloat(value)>=0 ? 'green' : 'red';

export const round = value => parseFloat(value).toFixed(2);

export const shortenNumber = value => 
      Math.abs(Number(value)) >= 1.0e+12
        ? (Math.abs(Number(value)) / 1.0e+12).toFixed(2) + "T"
        : Math.abs(Number(value)) >= 1.0e+9
        ? (Math.abs(Number(value)) / 1.0e+9).toFixed(2) + "B"
        : Math.abs(Number(value)) >= 1.0e+6
        ? (Math.abs(Number(value)) / 1.0e+6).toFixed(2) + "M"
        : Math.abs(Number(value)) >= 1.0e+3
        ? (Math.abs(Number(value)) / 1.0e+3).toFixed(2) + "K"
        : Math.abs(Number(value));
  
