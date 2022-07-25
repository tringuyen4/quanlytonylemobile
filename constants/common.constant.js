const APP_VERSION = '1.2.1';
const AGE_PREFIX = '歳';
const JAPANESE = {
    YEAR: '年',
    MONTH: '月',
    DATE: '日'
}
const VIETNAMESE = {
    YEAR: 'Năm',
    MONTH: 'Tháng',
    DATE: 'Ngày'
}
const JOB_TYPE = {
    STUDY_ABROAD: 'STUDY_ABROAD',
    OFFICE_WORKER: 'OFFICE_WORKER',
    SELF_EMPLOYED: 'SELF_EMPLOYED',
    PART_TIME_JOB: 'PART_TIME_JOB'
}

const DEVICE_STATUS = {
    NEW: 'NEW',
    LIKE_NEW: 'LIKE_NEW',
    LIKE_NEW_TBH: 'LIKE_NEW_TBH',
    SECOND_HAND_A: 'SECOND_HAND_A',
    SECOND_HAND_B: 'SECOND_HAND_B',
    SECOND_HAND_C: 'SECOND_HAND_C',
    SECOND_HAND_D: 'SECOND_HAND_D',
}

const PEOPLE_JOBS = [
    {label: '留学', value: JOB_TYPE.STUDY_ABROAD},
    {label: '会社員', value: JOB_TYPE.OFFICE_WORKER},
    {label: '自営業', value: JOB_TYPE.SELF_EMPLOYED},
    {label: 'アルバイト', value: JOB_TYPE.PART_TIME_JOB}
]

const MOBILE_STATUSES = [
    {label: 'New', value: DEVICE_STATUS.NEW},
    {label: 'Like New', value: DEVICE_STATUS.LIKE_NEW},
    {label: 'Like New TBH', value: DEVICE_STATUS.LIKE_NEW_TBH},
    {label: 'Second-A', value: DEVICE_STATUS.SECOND_HAND_A},
    {label: 'Second-B', value: DEVICE_STATUS.SECOND_HAND_B},
    {label: 'Second-C', value: DEVICE_STATUS.SECOND_HAND_C},
    {label: 'Second-D', value: DEVICE_STATUS.SECOND_HAND_D},
]

const WARRANTIES = [
    {label: '15 ngày', value: '15ngay'},
    {label: '1 tháng', value: '1thang'},
    {label: '3 tháng', value: '3thang'},
    {label: '6 tháng', value: '6thang'},
    {label: '1 năm', value: '1nam'},
]


const PAYMENT_METHOD = {
    ORDINARY_DEPOSIT: 'ORDINARY_DEPOSIT',
    CHECKS_DEPOSIT: 'CHECKS_DEPOSIT',
}

const PAYMENT_METHODS = [
    {label: '普通預金', value: PAYMENT_METHOD.ORDINARY_DEPOSIT},
    {label: '当座預金', value: PAYMENT_METHOD.CHECKS_DEPOSIT},
];


const INVOICE_TYPE = {
    PURCHASING: 'PURCHASING',
    FOR_SALE: 'FOR_SALE',
    TRANSFERRING: 'TRANSFERRING'
}

const INVOICE_STATUS = {
    NEW: 'NEW',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    TERMINATED: 'TERMINATED'
}

const TRANSFER_STATUS = {
    NEW: 'NEW',
    PROCESSING: 'PROCESSING',
    TRANSFERRING: 'TRANSFERRING',
    TRANSFERRED: 'TRANSFERRED',
    NOT_FOUND: 'NOT_FOUND',
    CANCELED: 'CANCELED'
}

const PRODUCT_SOURCE = {
    KAI: 'KAI',
    SHOP_VN: 'SHOP_VN',
    SHOP_JP: 'SHOP_JP',
    WAREHOUSE: 'WAREHOUSE'
}

const REPORT_TYPE = {
    MONTH: 'MONTH',
    DATE_RANGE: 'DATE_RANGE'
}

const PAYMENT_TYPE = {
    CASH: 'tienmat',
    TRANSFER: 'chuyenkhoan',
}

const MONEY_SYMBOL = {
    VND: 'đ',
    JPY: '¥',
}

const REPORT_DATE_FORMAT = {
    NORMAL: 'NORMAL',
    FULL_DATETIME_JP: 'FULL_DATETIME_JP',
    FULL_DATETIME_VN: 'FULL_DATETIME_VN',
}

module.exports = {
    APP_VERSION,
    AGE_PREFIX,
    JOB_TYPE,
    PEOPLE_JOBS,
    DEVICE_STATUS,
    MOBILE_STATUSES,
    JAPANESE,
    VIETNAMESE,
    INVOICE_TYPE,
    INVOICE_STATUS,
    PRODUCT_SOURCE,
    REPORT_TYPE,
    TRANSFER_STATUS,
    PAYMENT_TYPE,
    PAYMENT_METHOD,
    PAYMENT_METHODS,
    WARRANTIES,
    MONEY_SYMBOL,
    REPORT_DATE_FORMAT
}
