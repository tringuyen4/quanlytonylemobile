const {DATA_TABLES} = require("../constants/data.constant");
const {HTTP_STATUSES} = require("../constants/http.constant");
const {notEmpty} = require("../utils/data.utils");

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
                                         job
                                  FROM ${DATA_TABLES.CUSTOMER};`

        return this.pool.query(getCustomerQuery)
            .then(({rows}) => {
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

        const insertCustomerSql = `INSERT INTO ${DATA_TABLES.CUSTOMER} (name_vietnamese, name_japanese, birthday, age, address, phone, job)
                                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                                   RETURNING *;`;

        return this.pool.query(insertCustomerSql, Object.values(customerData))
            .then(({rows}) => {
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
                                         job=$7
                                     WHERE id = ${customerId}
                                     RETURNING *;`;

        return this.pool.query(updateCustomerQuery, Object.values(customerData))
            .then(({rows}) => {
                return (rows.length > 0) ? rows[0] : null
            })
            .catch(e => {
                throw e;
            })
    }

    deleteCustomer(customerId) {
        const deleteCustomerQuery = `DELETE
                                     FROM ${DATA_TABLES.CUSTOMER}
                                     WHERE id = $1`;
        return this.pool.query(deleteCustomerQuery, [customerId])
            .then((r) => {
                return {id: customerId}
            })
            .catch(e => {
                throw e;
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
                                       job
                                FROM ${DATA_TABLES.CUSTOMER}
                                WHERE birthday = '${query.birthday}'`;
                    break;
            }

            if (notEmpty(queryStr)) {
                return this.pool.query(queryStr)
                    .then(({rows}) => {
                        return rows.length > 0 ? rows : null;
                    })
                    .catch(e => {
                        throw e;
                    });
            } else {
                return Promise.resolve(null);
            }
        } else {
            return Promise.reject({error: 'Empty search type or query.'});
        }
    }
}

module.exports = {
    CustomerService
}
