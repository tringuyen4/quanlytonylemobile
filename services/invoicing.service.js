const {INVOICE, PURCHASING_INVOICE, DATA_TABLES} = require("../constants/data.constant");
const {sleep} = require("../utils/common.utils");
const {INVOICE_TYPE, INVOICE_STATUS} = require("../constants/common.constant");
const {notEmpty} = require("../utils/data.utils");

class InvoicingService {
    constructor(pool = null) {
        this.pool = pool; // Connection pool
    }

    // Public Methods
    purchasingInvoice(purchasingInvoiceData = null) {
        // Run nested step to make sure data has been setup correctly

        // Step 1: Create/Update invoice -> return purchasingInvoice
        return this._processPurchasingInvoice(purchasingInvoiceData)
            .then((purchasingInvoice) => {

                // Step 2: Create/Update customer and products -> return purchasingInvoice
                return this._processPurchasingCustomerAndProducts(purchasingInvoice, purchasingInvoiceData.customer, purchasingInvoiceData.products)
                    .then((purchasingInvoice) => {

                        // Step 3: Update invoice_detail, purchasing_detail -> return purchasingInvoice
                        return this._processPurchasingInvoiceDetail(purchasingInvoice)
                            .then((purchasingInvoice) => purchasingInvoice)
                    })
            })
    }

    /**
     * Process Creating or Updating the purchasing invoice
     *
     * @param invoiceData
     * @return {Promise<{quantity: number, sale_date: null, invoice_id: null, total_money: number, customer: null, products: []}>}
     * @private
     */
    _processPurchasingInvoice(invoiceData) {
        let purchasingInvoice = PURCHASING_INVOICE;
        const {invoice_id, quantity, sale_date, total_money} = invoiceData;
        let purchasingInvoiceData = {
            sale_date,
            quantity,
            total_money,
            type: INVOICE_TYPE.PURCHASING,
            status: INVOICE_STATUS.COMPLETED
        }

        // @Todo: Setup purchasing invoice query -> should return all to re-fetch the invoice info
        let purchasingInvoiceQuery = `INSERT INTO ${DATA_TABLES.INVOICE} (sale_date, total_quantity, total_money, type, status)
                                      VALUES ($1, $2, $3, $4, $5)
                                      RETURNING *;`;
        if (notEmpty(invoice_id)) {
            purchasingInvoiceQuery = `UPDATE ${DATA_TABLES.INVOICE}
                                      SET sale_date      = $1,
                                          total_quantity = $2,
                                          total_money    = $3,
                                          type           = $4,
                                          status         = $5
                                      WHERE id = ${invoice_id}
                                      RETURNING *;`;
        }

        return this.pool.query(purchasingInvoiceQuery, Object.values(purchasingInvoiceData))
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {id, total_quantity, total_money, sale_date} = rows[0];
                    purchasingInvoice.invoice_id = id;
                    purchasingInvoice.sale_date = sale_date;
                    purchasingInvoice.quantity = total_quantity;
                    purchasingInvoice.total_money = total_money;
                }
                return purchasingInvoice;
            })
            .catch(e => {
                throw e;
            });
    }

    /**
     * Processing Creating or Updating the purchasing customer and products
     * @param purchasingInvoice
     * @param customerData
     * @param listProducts
     * @return {Promise<{quantity: number, sale_date: null, invoice_id: null, total_money: number, customer: null, products: []}>}
     * @private
     */
    _processPurchasingCustomerAndProducts(purchasingInvoice = PURCHASING_INVOICE, customerData = null, listProducts = []) {
        if (notEmpty(customerData)) {
            const promises = [];

            // @Todo: Process for products
            listProducts.forEach((product) => {
                if (notEmpty(product.id)) {
                    promises.push(

                    );
                }
            });

            // @Todo: Process for customer
            let customerQuery = `INSERT INTO ${DATA_TABLES.CUSTOMER} (name_vietnamese, name_japanese, birthday, age, address, phone, job)
                                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                                 RETURNING *;`;
            if (notEmpty(customerData.id)) {
                customerQuery = `UPDATE ${DATA_TABLES.CUSTOMER}
                                 SET name_vietnamese = $1,
                                     name_japanese   = $2,
                                     birthday        = $3,
                                     age             = $4,
                                     address         = $5,
                                     phone           = $6,
                                     job             = $7
                                 WHERE id = ${customerData.id}
                                 RETURNING *;`;
            }
            promises.push(
                this.pool.query(customerQuery, Object.values({
                    name_vietnamese: customerData.name_vietnamese,
                    name_japanese: customerData.name_japanese,
                    birthday: customerData.birthday,
                    age: customerData.age,
                    address: customerData.address,
                    phone: customerData.phone,
                    job: customerData.job
                })).then(({rows}) => {
                    if (rows.length > 0) {
                        return rows[0]
                    }
                    return null;
                }).catch(e => {
                    throw e;
                })
            );
            return Promise.all(promises)
                .then((results) => {
                    purchasingInvoice.customer = results.pop();
                    if (results.length > 0) {
                        purchasingInvoice.products = results;
                    } else {
                        purchasingInvoice.products = [];
                    }
                    return purchasingInvoice;
                })
                .catch(e => {
                    throw e;
                })

        } else {
            purchasingInvoice.customer = null;
            purchasingInvoice.products = [];
            return Promise.resolve(purchasingInvoice);
        }
    }

    /**
     * Processing enrich invoice detail
     *
     * @param purchasingInvoice
     * @return {Promise<{quantity: number, sale_date: null, invoice_id, total_money: number, customer, products: *[]}>}
     * @private
     */
    _processPurchasingInvoiceDetail(purchasingInvoice = PURCHASING_INVOICE) {
        const promises = [];

        promises.push(sleep(2000));

        return Promise.all(promises).then((result) => {
            return purchasingInvoice;
        })

    }


}

module.exports = {
    InvoicingService
}
