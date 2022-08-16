const { DATA_TABLES } = require("../constants/data.constant");
const { HTTP_STATUSES } = require("../constants/http.constant");
const { notEmpty } = require("../utils/data.utils");
const { INVOICE_STATUS } = require("../constants/common.constant")

class CustomerService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Get All Customers
     * @return {*}
     */
    getAllCustomers() {
        const getCustomerQuery = `SELECT id,
                                         name_vietnamese,
                                         name_japanese,
                                         birthday,
                                         age,
                                         address,
                                         phone,
                                         job,
                                         payment_method,
                                         bank_name,
                                         branch_name,
                                         bank_id,
                                         account_name
                                  FROM ${DATA_TABLES.CUSTOMER};`

        return this.pool.query(getCustomerQuery)
            .then(({ rows }) => {
                return rows
            }).catch(e => {
                throw e;
            })
    }

    /**
     * Add New Customer
     *
     * @param customerData
     * @return {*}
     */
    addCustomer(customerData) {

        const insertCustomerSql = `INSERT INTO ${DATA_TABLES.CUSTOMER} (name_vietnamese, name_japanese, birthday, age, address, phone, job, payment_method, bank_name, branch_name, bank_id, account_name)
                                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                                   RETURNING *;`;

        return this.pool.query(insertCustomerSql, Object.values(customerData))
            .then(({ rows }) => {
                if (rows.length > 0) {
                    return rows[0]
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    /**
     * Update Customer Data
     *
     * @param customerId
     * @param customerData
     * @return {*}
     */
    updateCustomer(customerId, customerData) {
        const updateCustomerQuery = `UPDATE ${DATA_TABLES.CUSTOMER}
                                     SET name_vietnamese = $1,
                                         name_japanese= $2,
                                         birthday=$3,
                                         age=$4,
                                         address=$5,
                                         phone=$6,
                                         job=$7,
                                         payment_method=$8,
                                         bank_name=$9,
                                         branch_name=$10,
                                         bank_id=$11,
                                         account_name=$12
                                     WHERE id = ${customerId}
                                     RETURNING *;`;

        return this.pool.query(updateCustomerQuery, Object.values(customerData))
            .then(({ rows }) => {
                return (rows.length > 0) ? rows[0] : null
            })
            .catch(e => {
                throw e;
            })
    }

    deleteCustomer(customerId) {
        const customerProductQuery = `
                                    select id.product_id, id.quantity 
                                    from ${DATA_TABLES.CUSTOMER} c , ${DATA_TABLES.PURCHASING_DETAIL} pd, ${DATA_TABLES.INVOICE_DETAIL} id 
                                    where c.id = pd.customer_id and id.invoice_id = pd.invoice_id and c.id = $1
                                    `;
        return this.pool.query(customerProductQuery, [customerId])
            .then(({ rows }) => {
                const promises = [];
                rows.forEach((product) => {
                    const { product_id, quantity } = product;
                    promises.push(this.pool.query(`update ${DATA_TABLES.PRODUCT} set quantity= quantity - $2 where id = $1`, [product_id, quantity]))
                });
                return Promise.all(promises)
                    .then(() => {
                        return this.pool.query(`update ${DATA_TABLES.INVOICE} set status = '${INVOICE_STATUS.TERMINATED}' where id in (select invoice_id from ${DATA_TABLES.PURCHASING_DETAIL} where customer_id = $1)`, [customerId])
                            .then(() => {
                                return this.pool.query(`delete from ${DATA_TABLES.CUSTOMER} where id = ${customerId}`)
                                    .then(() => {
                                        return true;
                                    });
                            });
                    });

            })
    }

    searchCustomer(search_type = 'BIRTHDAY', query = null) {
        if (notEmpty(query) && notEmpty(search_type)) {
            let queryStr = null;

            switch (search_type) {
                case 'BIRTHDAY':
                default:
                    queryStr = `SELECT id,
                                       name_vietnamese,
                                       name_japanese,
                                       birthday,
                                       age,
                                       address,
                                       phone,
                                       job,
                                       payment_method,
                                         bank_name,
                                         branch_name,
                                         bank_id,
                                         account_name
                                FROM ${DATA_TABLES.CUSTOMER}
                                WHERE birthday = '${query.birthday}'`;
                    break;
            }

            if (notEmpty(queryStr)) {
                return this.pool.query(queryStr)
                    .then(({ rows }) => {
                        return rows.length > 0 ? rows : null;
                    })
                    .catch(e => {
                        throw e;
                    });
            } else {
                return Promise.resolve(null);
            }
        } else {
            return Promise.reject({ error: 'Empty search type or query.' });
        }
    }
}

module.exports = {
    CustomerService
}
