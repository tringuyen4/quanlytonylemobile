const {Pool} = require('pg')
const {KAI_DATA_TABLES, DATA_TABLES} = require("../constants/data.constant");
const {INVOICE_TYPE, INVOICE_STATUS, PRODUCT_SOURCE} = require("../constants/common.constant");

class ReplicateService {
    constructor(kaiConnectionString, sellMobileConnectionString) {
        this.kaiPool = new Pool({
            connectionString: kaiConnectionString,
            // Enable SSL for production only
            // ssl: {
            //   rejectUnauthorized: false
            // }
        });
        this.pool = new Pool({
            connectionString: sellMobileConnectionString,
            // Enable SSL for production only
            // ssl: {
            //   rejectUnauthorized: false
            // }
        });
    }

    execute() {
        // Clean up all data and then replicate data
        return this._cleanUp()
            .then((r) => {
                console.log('>> FINISHED CLEANING UP DATA');
                return this._replicateData();
            });
    }

    _cleanUp() {
        console.log('>> CLEANING UP DATA');
        return Promise.all([
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.PURCHASING_DETAIL};`),
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.INVOICE_DETAIL};`),
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.INVOICE};`),
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.PRODUCT_STORAGE};`),
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.PRODUCT};`),
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.CUSTOMER};`),
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.TRANSFER_DETAIL};`),
        ]);
    }

    _replicateData() {
        console.log('>>> START: replicate data for KAI...!!');

        // Replicate base data: products and customers then for related data: invoice, invoice_detail, purchase_detail
        return Promise.all([
            this._replicateProducts(),
            this._replicateCustomers(),
        ]).then(r => {
            console.log('>>> Finished replicate product and customer data...!');
            return this._replicateInvoiceData();
        }).finally(() => {
            console.log('>>> Finished replicate KAI...!!!');
        })
    }

    _replicateProducts() {
        // Get all mobile in KAI
        return this.kaiPool.query(`SELECT *
                                   FROM ${KAI_DATA_TABLES.MOBILE};`).then(({rows}) => {
            console.log('>>>>> Total mobile data: ', rows.length);
            console.log('>>>>> Begin replicate product data.');
            return this._insertProductData(rows);
        }).catch(e => {
            throw  e
        });
    }

    _replicateCustomers() {
        // Get all customer in KAI
        return this.kaiPool.query(`SELECT *
                                   FROM ${KAI_DATA_TABLES.CUSTOMER}`).then(({rows}) => {
            console.log('>>>>> Total customer data: ', rows.length);
            console.log('>>>>> Begin replicate customer data.');
            return this._insertCustomerData(rows);
        });

    }

    _replicateInvoiceData() {
        return Promise.all([
            this._replicateForSaleInvoice(),
            this._replicatePurchasingInvoice()
        ]).then((r) => {
            console.log('>>> Finished replicate invoice data...!');
        })
    }

    _replicateForSaleInvoice() {
        // orderInvoice -> invoice
        // OrderDetail -> invoice_detail
        return this.kaiPool.query(`SELECT *
                                   FROM ${KAI_DATA_TABLES.ORDER_INVOICE};`).then(({rows}) => {
            console.log('>>>>> Total for sale invoice: ', rows.length);
            console.log('>>>>> Begin replicate for sale invoice data.');
            return this._insertForSaleInvoice(rows);
        });
    }

    _insertForSaleInvoice(orderInvoices = []) {
        const promises = [];
        orderInvoices.forEach((orderInvoice) => {
            const queryStr = 'INSERT INTO ' + DATA_TABLES.INVOICE + ' (sale_date, total_quantity, total_money, "type", status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
            promises.push(
                this.pool.query(queryStr, [
                    orderInvoice.sale_date,
                    orderInvoice.quantity,
                    orderInvoice.total_money,
                    INVOICE_TYPE.FOR_SALE,
                    orderInvoice.iscompleted === true ? INVOICE_STATUS.COMPLETED : INVOICE_STATUS.PROCESSING,
                    orderInvoice.created_at,
                    orderInvoice.updated_at
                ]).then(({rows}) => {
                    const {id} = rows[0];
                    return this._processForSaleInvoiceDetail(orderInvoice.id, id);
                })
            );
        });

        return Promise.all(promises).then(r => {
            console.log('>>> Finished replicate for sale invoice');
        })
    }

    /**
     * Process For Sale Invoice Id
     * @param oldInvoiceId
     * @param newInvoiceId
     * @private
     *
     * @return Promise
     */
    _processForSaleInvoiceDetail(oldInvoiceId = 0, newInvoiceId = 0) {
        const queryStr = `SELECT *
                          FROM ${KAI_DATA_TABLES.ORDER_DETAIL}
                          WHERE orderid = ${oldInvoiceId};`;
        return this.kaiPool.query(queryStr).then(({rows}) => {
            const promise = [];
            rows.forEach((invoiceDetail) => {
                const insertQueryString = 'INSERT INTO ' + DATA_TABLES.INVOICE_DETAIL + ' (invoice_id, product_id, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6);';
                promise.push(this.pool.query(insertQueryString, [
                    newInvoiceId,
                    invoiceDetail.mobileid,
                    1, // Default buy value from KAI is 1
                    invoiceDetail.price,
                    invoiceDetail.created_at,
                    invoiceDetail.updated_at
                ]))
            });
            return Promise.all(promise).then(r => {
                console.log(`>>>> Replicated For Sale Invoice with old ID = ${oldInvoiceId} and new ID = ${newInvoiceId}`);
            })
        })
    }

    _replicatePurchasingInvoice() {
        // Invoice -> invoice
        // Mobile + Invoice -> inovice_detail
        return this.kaiPool.query(`SELECT *
                                   FROM ${KAI_DATA_TABLES.INVOICE};`).then(({rows}) => {
            console.log('>>>>> Total purchasing invoice: ', rows.length);
            console.log('>>>>> Begin replicate purchasing invoice data.');
            return this._insertPurchasingInvoice(rows);
        });
    }

    _insertPurchasingInvoice(invoices = []) {
        const promises = [];
        invoices.forEach((invoice) => {
            const queryStr = 'INSERT INTO ' + DATA_TABLES.INVOICE + ' (sale_date, total_quantity, total_money, "type", status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
            promises.push(
                this.pool.query(queryStr, [
                    invoice.sale_date,
                    invoice.quantity,
                    invoice.total_money,
                    INVOICE_TYPE.PURCHASING,
                    INVOICE_STATUS.COMPLETED,
                    invoice.created_at,
                    invoice.updated_at
                ]).then(({rows}) => {
                    const {id} = rows[0];
                    return this._processPurchasingInvoiceDetail(invoice, id);
                })
            );
        });

        return Promise.all(promises).then(r => {
            console.log('>>> Finished replicate for purchasing invoice');
        })
    }

    _processPurchasingInvoiceDetail(kaiInvoice = null, newInvoiceId = 0) {
        const oldInvoiceId = kaiInvoice.id;
        const queryStr = `SELECT *
                          FROM ${KAI_DATA_TABLES.MOBILE}
                          WHERE invoice_id = ${oldInvoiceId};`;
        return this.kaiPool.query(queryStr).then(({rows}) => {
            const promise = [];
            rows.forEach((mobile) => {
                const insertQueryString = 'INSERT INTO ' + DATA_TABLES.INVOICE_DETAIL + ' (invoice_id, product_id, quantity, price, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6);';
                promise.push(this.pool.query(insertQueryString, [
                    newInvoiceId,
                    mobile.id,
                    1, // Default buy value from KAI is 1
                    mobile.price,
                    kaiInvoice.created_at,
                    kaiInvoice.updated_at
                ]));
            });
            const insertPurchasingQuery = 'INSERT INTO ' + DATA_TABLES.PURCHASING_DETAIL + ' (invoice_id, customer_id, created_at, updated_at) VALUES ($1, $2, $3, $4);';
            promise.push(this.pool.query(insertPurchasingQuery, [
                newInvoiceId,
                kaiInvoice.customer_id,
                kaiInvoice.created_at,
                kaiInvoice.updated_at
            ]));
            return Promise.all(promise).then(r => {
                console.log(`>>>> Replicated For Sale Invoice with old ID = ${oldInvoiceId} and new ID = ${newInvoiceId}`);
            })
        })
    }

    _insertProductData(products = []) {
        const promises = [];
        const queryString = `INSERT INTO ${DATA_TABLES.PRODUCT} (id, name, imei, color, status,
                                                                 created_at, updated_at)
                                 OVERRIDING SYSTEM VALUE
                             VALUES ($1, $2, $3, $4, $5, $6, $7)
                             RETURNING *;`;
        products.forEach((product) => {
            promises.push(
                this.pool.query(queryString, [
                    product.id,
                    product.name,
                    product.imei,
                    product.color,
                    product.status,
                    product.created_at,
                    product.updated_at
                ])
                    .then(({rows}) => {
                        if (rows.length > 0) {
                            const {id, name, imei, color, status} = rows[0];
                            return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                    VALUES ($1, $2, $3, $4, $5)
                                                    RETURNING *;`,
                                Object.values({
                                    product_id: id,
                                    quantity: 1, // Default value from KAI is 1
                                    price: product.price,
                                    position: PRODUCT_SOURCE.KAI,
                                    source: PRODUCT_SOURCE.KAI
                                }))
                                .then(({rows}) => {
                                    const productDetail = {
                                        id,
                                        name,
                                        imei,
                                        color,
                                        status,
                                        quantity: 0,
                                        price: 0,
                                        position: null,
                                        source: null
                                    }
                                    if (rows.length > 0) {
                                        const {quantity, price, position, source} = rows[0];
                                        productDetail.quantity = quantity;
                                        productDetail.price = price;
                                        productDetail.position = position;
                                        productDetail.source = source;
                                    }
                                    return productDetail;
                                })

                        }
                    })
                    .catch(e => {
                        throw e
                    })
            );
        });
        return Promise.all(promises).then((r) => {
            // Reset sequence value
            return this.pool.query(`SELECT pg_catalog.setval(pg_get_serial_sequence('${DATA_TABLES.PRODUCT}', 'id'), MAX(id))
                                    FROM ${DATA_TABLES.PRODUCT};`).then(r => {
                console.log('>>>>> Finish replicate product data.');
                return true
            })
        });
    }

    _insertCustomerData(customers = []) {
        const promises = [];
        const queryStr = 'INSERT INTO ' + DATA_TABLES.CUSTOMER + ' (id, name_vietnamese, name_japanese, birthday, age, address, phone, job, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
        customers.forEach((customer) => {
            promises.push(this.pool.query(queryStr, [
                customer.id,
                customer.name_vietnamese,
                customer.name_japanese,
                customer.birthday,
                customer.age,
                customer.address,
                customer.phone,
                customer.job,
                customer.created_at,
                customer.updated_at
            ]));
        });
        return Promise.all(promises).then((r) => {
            // Reset sequence value
            return this.pool.query(`SELECT pg_catalog.setval(pg_get_serial_sequence('${DATA_TABLES.CUSTOMER}', 'id'), MAX(id))
                                    FROM ${DATA_TABLES.CUSTOMER};`).then(r => {
                console.log('>>>>> Finish replicate customer data.');
            })
        });
    }

}

module.exports = {
    ReplicateService
}
