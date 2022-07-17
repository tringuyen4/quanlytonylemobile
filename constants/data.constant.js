// For local dev
// const CONNECTION_STRING = `postgres://postgres:12345678@localhost:5432/sellmobile_v2`;
// const KAI_CONNECTION_STRING = `postgres://postgres:12345678@localhost:5432/sellmobile`;

// For production
const CONNECTION_STRING = 'postgres://ypdfdqvewxxgly:7ac1504434e43a831ed167ce89a7e5069f7b549cced29bdaab42e50fc7b5297c@ec2-3-227-15-75.compute-1.amazonaws.com:5432/ddoocbjabks5u0';
const KAI_CONNECTION_STRING = 'postgres://zqjucxeozjmeqv:d9da62430972eaccbc0ed7a01b4949375341bd2e57d2ea4076f45601c32f3190@ec2-44-197-142-172.compute-1.amazonaws.com:5432/d6q81mtui3km92';

const DATA_REPLICATION_KEY = 'a1b657c2cb081cdf91522f92eae04248'; // kai-replicate

const KAI_DATA_TABLES = {
    CUSTOMER: 'customer',
    INVOICE: 'invoice',
    MOBILE: 'mobile',
    ORDER_DETAIL: 'orderdetail',
    ORDER_INVOICE: 'orderinvoice'
}

const DATA_TABLES = {
    PRODUCT: 'product',
    PRODUCT_GROUP: 'product_group',
    PRODUCT_STORAGE: 'product_storage',
    CUSTOMER: 'customer',
    INVOICE: 'invoice',
    INVOICE_DETAIL: 'invoice_detail',
    PURCHASING_DETAIL: 'purchasing_detail',
    TRANSFER_DETAIL: 'transfer_detail',
    INVOICE_PAYMENT: 'invoice_payment',
    QUAN_LY_CHI: 'quanlychi'
}

// Because Javascript not support interface so we have some constant object as model
const CUSTOMER = {
    id: null,
    name_vietnamese: null,
    name_japanese: null,
    birthday: null,
    age: null,
    address: null,
    phone: null,
    job: null,
    created_at: null,
    updated_at: null
}

const PRODUCT = {
    id: null,
    name: null,
    imei: null,
    color: null,
    status: null,
    quantity: null,
    price: null,
    position: null,
    source: null,
    group_name: null,
    type_name: null,
    capacity: null,
    version: null,
    created_at: null,
    updated_at: null
}

const INVOICE = {
    id: null,
    sale_date: null,
    total_quantity: null,
    total_money: null,
    type: null,
    status: null,
    created_at: null,
    updated_at: null
}

const INVOICE_DETAIL = {
    invoice_id: null,
    product_id: null,
    quantity: null,
    price: null,
    created_at: null,
    updated_at: null
}

const PURCHASING_DETAIL = {
    invoice_id: null,
    customer_id: null,
    created_at: null,
    updated_at: null,
}

const PURCHASING_INVOICE = {
    invoice_id: null,
    sale_date: null,
    quantity: 0,
    total_money: 0,
    customer: null,
    products: [],
}

const FOR_SALE_INVOICE = {
    invoice_id: null,
    sale_date: null,
    quantity: 0,
    total_money: 0,
    products: [],
}

module.exports = {
    DATA_TABLES,
    KAI_DATA_TABLES,
    CONNECTION_STRING,
    KAI_CONNECTION_STRING,
    DATA_REPLICATION_KEY,
    CUSTOMER,
    PRODUCT,
    INVOICE,
    INVOICE_DETAIL,
    PURCHASING_DETAIL,
    PURCHASING_INVOICE,
    FOR_SALE_INVOICE
}
