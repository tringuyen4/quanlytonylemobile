const {notEmpty} = require("../utils/data.utils");
const {DATA_TABLES} = require("../constants/data.constant");

class ProductService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    getAllProducts(position = null) {
        let queryStr = `SELECT id, name, imei, color, status, quantity, price
                        FROM ${DATA_TABLES.PRODUCT}
                        WHERE quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            });
    }

    getSoldProducts(position = null) {
        let queryStr = `SELECT DISTINCT p.id, p.name, p.imei, p.color, p.status, p.quantity, p.price
                        FROM ${DATA_TABLES.PRODUCT} p,
                             ${DATA_TABLES.INVOICE_DETAIL} id
                        WHERE p.id = id.product_id
                          AND p.quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            });
    }

    insertProduct(productData = null) {
        const {imei, name, color, status, quantity, price, position, source} = productData;
        const insertProductSql = `INSERT INTO ${DATA_TABLES.PRODUCT} (imei, name ,color, status, quantity, price, position, source)
                                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                                  RETURNING *;`;
        return this.pool.query(insertProductSql, Object.values({
            imei,
            name,
            color,
            status,
            quantity,
            price,
            position,
            source
        })).then(({rows}) => rows).catch(e => {
            throw e
        });
    }

    deleteProduct(productId = 0) {
        const deleteProductQuery = `DELETE
                                    FROM ${DATA_TABLES.PRODUCT}
                                    WHERE id = $1;`;
        return this.pool.query(deleteProductQuery, [productId])
            .then((r) => {
                return {id: productId}
            })
            .catch(e => {
                throw e;
            })
    }

}

module.exports = {
    ProductService
}
