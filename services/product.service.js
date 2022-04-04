const {notEmpty} = require("../utils/data.utils");
const {DATA_TABLES} = require("../constants/data.constant");

class ProductService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    getAllProducts(source = null) {
        let queryStr = `SELECT id, name,imei, color, status, quantity, price FROM ${DATA_TABLES.PRODUCT} WHERE quantity > 0`;
        queryStr += notEmpty(source) ? ` AND source = '${source}';` : `;`;
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
