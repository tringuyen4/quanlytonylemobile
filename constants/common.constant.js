const AGE_PREFIX = '歳';
const JAPANESE = {
    YEAR: '年',
    MONTH: '月',
    DATE: '日'
}
const JOB_TYPE = {
    STUDY_ABROAD: 'STUDY_ABROAD',
    OFFICE_WORKER: 'OFFICE_WORKER',
    SELF_EMPLOYED: 'SELF_EMPLOYED',
    PART_TIME_JOB: 'PART_TIME_JOB'
}

const DEVICE_STATUS = {
    NEW: 'NEW',
    USED: 'USED'
}

const PEOPLE_JOBS = [
    {label: '留学', value: JOB_TYPE.STUDY_ABROAD},
    {label: '会社員', value: JOB_TYPE.OFFICE_WORKER},
    {label: '自営業', value: JOB_TYPE.SELF_EMPLOYED},
    {label: 'アルバイト', value: JOB_TYPE.PART_TIME_JOB}
]

const MOBILE_STATUSES = [
    {label: '新品', value: DEVICE_STATUS.NEW},
    {label: '中古', value: DEVICE_STATUS.USED}
]

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

module.exports = {
    AGE_PREFIX,
    JOB_TYPE,
    PEOPLE_JOBS,
    DEVICE_STATUS,
    MOBILE_STATUSES,
    JAPANESE,
    INVOICE_TYPE,
    INVOICE_STATUS,
    PRODUCT_SOURCE,
    REPORT_TYPE,
    TRANSFER_STATUS
}
