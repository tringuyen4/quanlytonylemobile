// For local dev
const CONNECTION_STRING = `postgres://postgres:12345678@localhost:5432/sellmobile_v2`;
const KAI_CONNECTION_STRING = `postgres://postgres:12345678@localhost:5432/sellmobile`;

// For production
// const CONNECTION_STRING = 'postgres://ypdfdqvewxxgly:7ac1504434e43a831ed167ce89a7e5069f7b549cced29bdaab42e50fc7b5297c@ec2-3-227-15-75.compute-1.amazonaws.com:5432/ddoocbjabks5u0';
// const KAI_CONNECTION_STRING = 'postgres://zqjucxeozjmeqv:d9da62430972eaccbc0ed7a01b4949375341bd2e57d2ea4076f45601c32f3190@ec2-44-197-142-172.compute-1.amazonaws.com:5432/d6q81mtui3km92';

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
    CUSTOMER: 'customer',
    INVOICE: 'invoice',
    INVOICE_DETAIL: 'invoice_detail',
    PURCHASING_DETAIL: 'purchasing_detail'
}

module.exports = {
    DATA_TABLES,
    KAI_DATA_TABLES,
    CONNECTION_STRING,
    KAI_CONNECTION_STRING,
    DATA_REPLICATION_KEY
}
