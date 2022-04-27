const {notEmpty} = require("../utils/data.utils");
const {DATA_TABLES, PRODUCT} = require("../constants/data.constant");

class ProductService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    getAllProducts(position = null) {
        let queryStr = `SELECT p.id,
                               p."name",
                               p.imei,
                               p.color,
                               p.status,
                               ps.quantity,
                               ps.price,
                               ps."position",
                               ps."source",
                               pg.id as product_group_id,
                               pg.name as group_name
                        FROM ${DATA_TABLES.PRODUCT} p,
                             ${DATA_TABLES.PRODUCT_STORAGE} ps,
                             ${DATA_TABLES.PRODUCT_GROUP} pg
                        WHERE p.id = ps.product_id
                          AND pg.id = p.product_group_id
                          AND ps.quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            });
    }

    getSoldProducts(position = null) {
        let queryStr = `SELECT p.id,
                               p."name",
                               p.imei,
                               p.color,
                               p.status,
                               ps.quantity,
                               ps.price,
                               ps."position",
                               ps."source",
                               pg.id as product_group_id,
                               pg.name as group_name
                        FROM ${DATA_TABLES.PRODUCT} p,
                             ${DATA_TABLES.PRODUCT_STORAGE} ps,
                             ${DATA_TABLES.INVOICE_DETAIL} id,
                             ${DATA_TABLES.PRODUCT_GROUP} pg
                        WHERE p.id = ps.product_id
                          AND p.id = id.product_id
                          AND pg.id = p.product_group_id
                          AND ps.quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            });
    }

    addOrUpdateProduct(productData = null) {
        // Check that any product with the imei exists
        const {imei, name, color, status, quantity, price, position, source} = productData;
    }

    transferProductStorage(transferStorageData = null) {
        const {product_id, quantity, price, position, source, new_position} = transferStorageData;
        // Check that target position has any product storage or not
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.PRODUCT_STORAGE}
                                WHERE product_id = $1
                                  AND position = $2;`, [product_id, new_position])
            .then(({rows}) => {
                let targetPositionStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                  VALUES ($1, $2, $3, $4, $5)
                                                  RETURNING *;`;
                let targetPositionStorageData = {
                    product_id,
                    quantity,
                    price,
                    position: new_position,
                    source: source
                }
                if (rows.length > 0) {
                    // Target position already exists the product storage -> update quantity only
                    const existsProductStorage = rows[0];
                    targetPositionStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                  SET quantity = $1
                                                  WHERE product_id = ${product_id}
                                                    AND position = '${new_position}'
                                                  RETURNING *;`;
                    targetPositionStorageData = {quantity: existsProductStorage.quantity + quantity};
                }

                return Promise.all([
                    this.pool.query(targetPositionStorageQuery, targetPositionStorageData),
                    this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                     SET quantity = quantity - ${quantity}
                                     WHERE product_id = ${product_id}
                                       AND position = '${position}'
                                     RETURNING *;`)
                ])
                    .then(([oldProductStorageResult, newProductStorageResult]) => {
                        if (oldProductStorageResult.rows.length > 0 && newProductStorageResult.rows.length > 0) {
                            return {
                                from_storage: oldProductStorageResult.rows[0],
                                to_storage: newProductStorageResult.rows[0]
                            };
                        }
                        return null;
                    })
                    .catch(e => {
                        throw e
                    })

            })
    }

    updateProductStorage(productStorageData = null) {
        const {product_id, quantity, price, position, source} = productStorageData;
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.PRODUCT_STORAGE}
                                WHERE product_id = $1
                                  AND position = $2;`, [product_id, position])
            .then(({rows}) => {
                if (rows.length > 0) {
                    // Update quantity and price
                    const existsProductStorage = rows[0];
                    const product_quantity = existsProductStorage.quantity + quantity;
                    return this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                            SET quantity = $1,
                                                price    = $2,
                                                position = $3,
                                                source   = $4
                                            RETURNING *;`, [product_quantity, price, position, source])
                        .then(({rows}) => {
                            const {quantity, price, position, source} = rows[0];
                            return {
                                product_id,
                                quantity,
                                price,
                                position,
                                source
                            }
                        });
                } else {
                    return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                            VALUES ($1, $2, $3, $4, $5)
                                            RETURNING *;`, [product_id, quantity, price, position, source])
                        .then(({rows}) => {
                            const {quantity, price, position, source} = rows[0];
                            return {
                                product_id,
                                quantity,
                                price,
                                position,
                                source
                            }
                        });
                }
            })
    }


    insertProduct(productData = null) {
        const {imei, name, color, status, quantity, price, position, source} = productData;
        const insertProductSql = `INSERT INTO ${DATA_TABLES.PRODUCT} (imei, name, color, status)
                                  VALUES ($1, $2, $3, $4)
                                  RETURNING *;`;
        return this.pool.query(insertProductSql, Object.values({
            imei,
            name,
            color,
            status
        })).then(({rows}) => {
            if (rows.length > 0) {
                const {id, name, imei, color, status} = rows[0];
                const productDetail = {
                    id,
                    name,
                    imei,
                    color,
                    status,
                    quantity: 0,
                    price: 0,
                    position: null,
                    source: null,
                }
                return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                        VALUES ($1, $2, $3, $4, $5)
                                        RETURNING *;`,
                    Object.values({
                        product_id: id,
                        quantity: quantity,
                        price: price,
                        position: position,
                        source: source
                    }))
                    .then(({rows}) => {
                        if (rows.length > 0) {
                            const {quantity, price, position, source} = rows[0];
                            productDetail.quantity = quantity;
                            productDetail.price = price;
                            productDetail.position = position;
                            productDetail.source = source;
                        }
                        return productDetail;
                    })
                    .catch(e => {
                        throw e
                    })
            }
            return null;
        }).catch(e => {
            throw e
        });
    }

    updateProduct(productData = null) {
        if (notEmpty(productData) && notEmpty(productData.id) && notEmpty(productData.imei)) {
            const {id, name, imei, color, status, quantity, price, position, source, product_group_id} = productData;
            const updateProductByImeiQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                              SET quantity = quantity + $1
                                              WHERE "position" = '${position}'
                                                AND product_id IN (SELECT id FROM ${DATA_TABLES.PRODUCT} WHERE imei = '${imei}')
                                              RETURNING *;`;
            return this.pool.query(updateProductByImeiQuery, [quantity])
                .then(({rows}) => {
                    if (rows.length > 0) {
                        // const {product_id, quantity, price, position, source} = rows[0];
                        return this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT}
                                                SET name             = $1,
                                                    imei             = $2,
                                                    color            =$3,
                                                    status           =$4,
                                                    product_group_id = $5
                                                WHERE id = ${id}
                                                RETURNING *;`,
                            Object.values({
                                name,
                                imei,
                                color,
                                status,
                                product_group_id
                            })
                        )
                            .then(({rows}) => {
                                const {id, name, imei, color, status, product_group_id} = rows[0];
                                return {
                                    id, name, imei, color, status, quantity, price, position, source, product_group_id
                                }
                            })
                            .catch(e => {
                                throw e
                            })
                    } else {
                        const promises = [];
                        const updateProductQueryStr = `UPDATE ${DATA_TABLES.PRODUCT}
                                                       SET name             = $1,
                                                           imei             = $2,
                                                           color            =$3,
                                                           status           =$4,
                                                           product_group_id = $5
                                                       WHERE id = ${id}
                                                       RETURNING *;`;
                        promises.push(
                            this.pool.query(updateProductQueryStr, Object.values({
                                name,
                                imei,
                                color,
                                status,
                                product_group_id
                            })).then(({rows}) => rows[0]).catch(e => {
                                throw e
                            })
                        )

                        const updateProductStorageQueryStr = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                              SET quantity = $1,
                                                                  price    = $2,
                                                                  source   = $3
                                                              WHERE product_id = ${id}
                                                                AND position = '${position}'
                                                              RETURNING *;`;
                        promises.push(
                            this.pool.query(updateProductStorageQueryStr, Object.values({quantity, price, source}))
                                .then(({rows}) => rows[0])
                                .catch(e => {
                                    throw  e
                                })
                        )

                        return Promise.all(promises).then(([product, productStorage]) => {
                            const {id, name, imei, color, status} = product;
                            const {quantity, price, position, source} = productStorage;
                            return {
                                id, name, imei, color, status, quantity, price, position, source
                            }
                        }).catch(e => {
                            throw e
                        })
                    }
                })
                .catch(e => {
                    throw e
                });
        } else {
            return Promise.reject({
                error: '>>> ERROR: Can not update product. productData is empty'
            })
        }
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

    createProductGroup(name = null) {
        return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_GROUP} (name)
                                VALUES ($1)
                                RETURNING *;`, [name])
            .then(({rows}) => {
                const {id, name, sort_order} = rows[0];
                return {
                    id,
                    name,
                    sort_order
                }
            })
            .catch(e => {
                throw e
            })
    }

    updateProductGroup(productGroupData = null) {
        const {id, name, sort_order} = productGroupData;
        return this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_GROUP}
                                SET name       = $1,
                                    sort_order = $2,
                                    updated_at = $3
                                WHERE id = $4
                                RETURNING *;`, [name, sort_order, 'now()', id])
            .then(({rows}) => {
                const {id, name, sort_order} = rows[0];
                return {id, name, sort_order}
            })
            .catch(e => {
                throw e
            })

    }

    deleteProductGroup(product_group_id = null) {
        return this.pool.query(`DELETE
                                FROM ${DATA_TABLES.PRODUCT_GROUP}
                                WHERE id = $1`, [product_group_id])
            .then(({rows}) => {
                return {
                    id: product_group_id
                }
            })
            .catch(e => {
                throw e
            })
    }

    getAllProductGroup() {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.PRODUCT_GROUP}`)
            .then(({rows}) => {
                return rows;
            })
            .catch(e => {
                throw e
            })
    }

}

module.exports = {
    ProductService
}
