const {notEmpty} = require("../utils/data.utils");
const {DATA_TABLES} = require("../constants/data.constant");

class ProductService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    getAllProducts(position = null) {
        let queryStr = `SELECT id, name,imei, color, status, quantity, price FROM ${DATA_TABLES.PRODUCT} WHERE quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            });
    }

    getSoldProducts(position = null) {
        let queryStr = `SELECT DISTINCT p.id, p.name, p.imei, p.color, p.status, p.quantity, p.price
                        FROM ${DATA_TABLES.PRODUCT} p, ${DATA_TABLES.INVOICE_DETAIL} id
                        WHERE p.id = id.product_id AND p.quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            });
    }
}

module.exports = {
    ProductService
}
