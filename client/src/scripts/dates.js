
const moment= require('moment');

export const DAILY = "DAILY";
export const WEEKLY = "WEEKLY";
export const MONTHLY = "MONTHLY";
export const daysInMonth = date => new Date(new Date(date).getYear(), new Date(date).getMonth(), 0).getDate();


export const getYear = (dateString) => {
    return moment(dateString).format('YYYY');
};

export const getMonth = (dateString) => {
    return moment(dateString).format('M');
};

export const getDay = (dateString) => {
    return moment(dateString).format('D');
};