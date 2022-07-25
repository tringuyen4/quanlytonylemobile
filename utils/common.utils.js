const {notEmpty, isEmpty} = require("./data.utils");
const {AGE_PREFIX, JAPANESE, PEOPLE_JOBS, MOBILE_STATUSES, PAYMENT_METHODS, WARRANTIES, PRODUCT_SOURCE, MONEY_SYMBOL,
    REPORT_DATE_FORMAT, VIETNAMESE
} = require("../constants/common.constant");
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

const getPaymentMethod = (paymentMethod = '') => {
    if (isEmpty(paymentMethod)) return null;
    const bank = PAYMENT_METHODS.find((x) => x.value === paymentMethod.trim());
    if (notEmpty(bank)) {
        return bank.label
    }
    return null;
}

const dateFormat = (date, format = REPORT_DATE_FORMAT.FULL_DATETIME_JP) => {
    if (isDate(date)) {
        switch (format) {
            case REPORT_DATE_FORMAT.FULL_DATETIME_JP:
                return `${date.getFullYear()}${JAPANESE.YEAR} ${date.getMonth() + 1}${JAPANESE.MONTH} ${date.getDate()}${JAPANESE.DATE}`;
            case REPORT_DATE_FORMAT.FULL_DATETIME_VN:
                return `${VIETNAMESE.DATE} ${date.getDate()} ${VIETNAMESE.MONTH}  ${date.getMonth() + 1} ${VIETNAMESE.YEAR} ${date.getFullYear()}`;
            case REPORT_DATE_FORMAT.NORMAL:
            default:
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

        }
    }
    return null;
}

const priceWithFormat = (price = 0, separator = ',') => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `${separator}`);
}

const priceWithSymbol = (priceStr = '', position = PRODUCT_SOURCE.SHOP_JP) => {
    return (position === PRODUCT_SOURCE.SHOP_VN) ? `${priceStr}${MONEY_SYMBOL.VND}` : `${MONEY_SYMBOL.JPY}${priceStr}`;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getWarrantyText = (warrantyName = '') => {
    if (isEmpty(warrantyName)) return null;
    const warranty = WARRANTIES.find((x) => x.value === warrantyName.trim());
    if (notEmpty(warranty)) {
        return warranty.label
    }
    return null;
}

module.exports = {
    isDate,
    getAge,
    getAgeText,
    getJobText,
    getDeviceStatusText,
    getWarrantyText,
    priceWithFormat,
    dateFormat,
    CURRENT_YEAR,
    sleep,
    getPaymentMethod,
    priceWithSymbol
}
