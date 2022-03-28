const {notEmpty, isEmpty} = require("./data.utils");
const {AGE_PREFIX, JAPANESE, PEOPLE_JOBS, MOBILE_STATUSES} = require("../constants/common.constant");
const CURRENT_YEAR = new Date().getFullYear();

const isDate = (date) => {
    if (date instanceof Date) {
        return !!date.getDate()
    }
    return !isNaN(Date.parse(date));
}
const getAge = (birthDay) => {
    if (!isDate(birthDay)) {
        return 0
    }
    return CURRENT_YEAR - birthDay.getFullYear();
}

const getAgeText = (birthDay, prefix = '') => {
    const age = getAge(birthDay);
    prefix = notEmpty(prefix) ? prefix : AGE_PREFIX;
    return `${age}${prefix}`;
}

const getJobText = (jobName = '') => {
    if (isEmpty(jobName)) return null;
    const job = PEOPLE_JOBS.find((x) => x.value === jobName.trim());
    if (notEmpty(job)) {
        return job.label
    }
    return null;
}

const getDeviceStatusText = (deviceStatus = '') => {
    if (isEmpty(deviceStatus)) return null;
    const job = MOBILE_STATUSES.find((x) => x.value === deviceStatus.trim());
    if (notEmpty(job)) {
        return job.label
    }
    return null;
}

const dateFormat = (date, isJapanese = true) => {
    if (isDate(date)) {
        return isJapanese ? `${date.getFullYear()}${JAPANESE.YEAR} ${date.getMonth() + 1}${JAPANESE.MONTH} ${date.getDate()}${JAPANESE.DATE}` : `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
    }
    return null;
}

const priceWithFormat = (price = 0, separator = ',') => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `${separator}`);
}

module.exports = {
    isDate,
    getAge,
    getAgeText,
    getJobText,
    getDeviceStatusText,
    priceWithFormat,
    dateFormat,
    CURRENT_YEAR
}
