const { notEmpty, isEmpty } = require("../utils/data.utils");
const { DATA_TABLES, PRODUCT } = require("../constants/data.constant");
const { rows } = require("pg/lib/defaults");

class ProductService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Get customer products
     * @param customer_id
     * @param invoice_id
     * @returns {*}
     */
    getCustomerProducts(customer_id = null, invoice_id = null) {
        let queryCondition = `i.id = id.invoice_id AND i.id = pd.invoice_id`;
        if (notEmpty(customer_id)) {
            queryCondition += ` AND pd.customer_id = ${customer_id}`
        }
        if (notEmpty(invoice_id)) {
            queryCondition += ` AND i.id = ${invoice_id}`
        }
        let queryStr = `SELECT p.id,
                               p."name",
                               p.imei,
                               p.color,
                               p.status,
                               p.estimated_price,
                               p.display_order,
                               ps.quantity,
                               ps.price,
                               ps."position",
                               ps."source",
                               pg.id   as product_group_id,
                               pg.name as group_name
                        FROM ${DATA_TABLES.PRODUCT} p,
                             ${DATA_TABLES.PRODUCT_STORAGE} ps,
                             ${DATA_TABLES.PRODUCT_GROUP} pg,
                             (SELECT i.id as invoice_id, id.product_id
                              FROM ${DATA_TABLES.INVOICE} i,
                                   ${DATA_TABLES.INVOICE_DETAIL} id,
                                   ${DATA_TABLES.PURCHASING_DETAIL} pd
                              WHERE ${queryCondition}
                              GROUP BY id.product_id, i.id) customerPurchase
                        WHERE p.id = ps.product_id
                          AND pg.id = p.product_group_id
                          AND p.id = customerPurchase.product_id
                          AND ps.quantity > 0;`;
        return this.pool.query(queryStr)
            .then(({ rows }) => rows)
            .catch(e => {
                throw e;
            });
    }

    /**
     * Get all products or by position
     * @param position
     * @returns {*}
     */
    getAllProducts(position = null) {
        let queryStr = `SELECT p.id,
                               p."name",
                               p.imei,
                               p.color,
                               p.status,
                               p.estimated_price,
                               p.display_order,
                               ps.quantity,
                               ps.price,
                               ps."position",
                               ps."source",
                               pg.id   as product_group_id,
                               pg.name as group_name
                        FROM ${DATA_TABLES.PRODUCT} p,
                             ${DATA_TABLES.PRODUCT_STORAGE} ps,
                             ${DATA_TABLES.PRODUCT_GROUP} pg
                        WHERE p.id = ps.product_id
                          AND pg.id = p.product_group_id
                          AND ps.quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({ rows }) => rows)
            .catch(e => {
                throw e;
            });
    }

    /**
     * Get products data by list ids and position
     * @param productIds
     * @param position
     * @returns {*}
     */
    getProductByIds(productIds = [], position = null) {
        let queryStr = `SELECT p.id,
                               p."name",
                               p.imei,
                               p.color,
                               p.status,
                               p.estimated_price,
                               p.display_order,
                               ps.quantity,
                               ps.price,
                               ps."position",
                               ps."source",
                               pg.id   as product_group_id,
                               pg.name as group_name
                        FROM ${DATA_TABLES.PRODUCT} p,
                             ${DATA_TABLES.PRODUCT_STORAGE} ps,
                             ${DATA_TABLES.PRODUCT_GROUP} pg
                        WHERE p.id = ps.product_id
                          AND pg.id = p.product_group_id
                          AND p.id IN (${productIds.map(x => `'${x}'`).join(',')})
                          AND ps.quantity > 0`;
        queryStr += notEmpty(position) ? ` AND position = '${position}';` : `;`;
        return this.pool.query(queryStr)
            .then(({ rows }) => rows)
            .catch(e => {
                throw e;
            });
    }

    /**
     * Get all sold products or by position
     * @param position
     * @returns {*}
     */
    getSoldProducts(position = null) {
        let queryStr = `SELECT p.id,
                               p."name",
                               p.imei,
                               p.color,
                               p.status,
                               p.estimated_price,
                               p.display_order,
                               ps.quantity,
                               ps.price,
                               ps."position",
                               ps."source",
                               pg.id   as product_group_id,
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
            .then(({ rows }) => rows)
            .catch(e => {
                throw e;
            });
    }

    /**
     * Get all On-Sale products or by position
     * @param position
     * @returns {*}
     */
    getOnSaleProducts(position = null) {
        let positionCondition = `AND ps."position" = '${position}'`;
        if (notEmpty(position) && Array.isArray(position)) {
            positionCondition = `AND ps."position" IN (${position.map(x => `'${x}'`).join(',')}) `;
        }
        const onSaleProductQuery = `SELECT storage_data.*, purchasing_data.*
                                    FROM (SELECT id.product_id, i.sale_date, id.invoice_id
                                          FROM invoice i,
                                               invoice_detail id
                                          WHERE i.id = id.invoice_id
                                            AND i."type" = 'PURCHASING'
                                          GROUP BY id.product_id, i.sale_date, id.invoice_id) product_data,
                                         (SELECT c.name_vietnamese, c.name_japanese, pd.invoice_id
                                          FROM purchasing_detail pd,
                                               customer c
                                          WHERE pd.customer_id = c.id) purchasing_data,
                                         (SELECT p.id,
                                                 p.name,
                                                 p.imei,
                                                 p.color,
                                                 p.status,
                                                 p.estimated_price,
                                                 p.display_order,
                                                 ps.price,
                                                 ps.quantity,
                                                 ps."position",
                                                 pg.name as group_name
                                          FROM product p,
                                               product_storage ps,
                                               product_group pg
                                          WHERE p.id = ps.product_id
                                            AND p.product_group_id = pg.id
                                            AND ps.quantity >= 0
                                              ${positionCondition}) storage_data
                                    WHERE product_data.invoice_id = purchasing_data.invoice_id
                                      AND storage_data.id = product_data.product_id;`;
        return this.pool.query(onSaleProductQuery)
            .then(({ rows }) => rows)
            .catch(e => {
                throw e
            })
    }

    /**
     * Insert new product
     * @param productData
     * @returns {*}
     */
    insertProduct(productData = null) {
        const {
            imei,
            name,
            color,
            status,
            quantity,
            price,
            position,
            source,
            estimated_price,
            product_group_id
        } = productData;
        const product_estimated_price = notEmpty(estimated_price) ? estimated_price : 0;
        const productDetail = {
            id: null,
            quantity: 0,
            name,
            imei,
            color,
            status,
            product_group_id,
            price,
            position,
            source,
            estimated_price: product_estimated_price
        }
        return this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                SET quantity = quantity + $1
                                WHERE product_id IN (SELECT id FROM ${DATA_TABLES.PRODUCT} WHERE imei = $2)
                                  AND position = $3 RETURNING *;`, [quantity, imei, position])
            .then(({ rows }) => {
                if (rows.length > 0) {
                    const { product_id, quantity } = rows[0];
                    productDetail.id = product_id;
                    productDetail.quantity = quantity;
                    return productDetail;
                } else {

                    return this.pool.query(`SELECT id
                                            FROM ${DATA_TABLES.PRODUCT}
                                            WHERE imei = $1`, [imei])
                        .then(({ rows }) => {
                            if (rows.length > 0) {
                                const { id } = rows[0];
                                return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                        VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
                                    Object.values({
                                        product_id: id,
                                        quantity: quantity,
                                        price: price,
                                        position: position,
                                        source: source
                                    }))
                                    .then(({ rows }) => {
                                        if (rows.length > 0) {
                                            const { product_id, quantity } = rows[0];
                                            productDetail.id = product_id;
                                            productDetail.quantity = quantity;
                                        }
                                        return productDetail;
                                    })
                                    .catch(e => {
                                        throw e
                                    })
                            } else {
                                const insertProductSql = `INSERT INTO ${DATA_TABLES.PRODUCT} (imei, name, color, status, product_group_id, estimated_price)
                                                          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
                                return this.pool.query(insertProductSql, Object.values({
                                    imei,
                                    name,
                                    color,
                                    status,
                                    product_group_id,
                                    product_estimated_price
                                })).then(({ rows }) => {
                                    if (rows.length > 0) {
                                        const { id, name, imei, color, status } = rows[0];
                                        productDetail.id = id;
                                        return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                                VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
                                            Object.values({
                                                product_id: id,
                                                quantity: quantity,
                                                price: price,
                                                position: position,
                                                source: source
                                            }))
                                            .then(({ rows }) => {
                                                if (rows.length > 0) {
                                                    const { quantity } = rows[0];
                                                    productDetail.quantity = quantity;
                                                }
                                                return productDetail;
                                            })
                                            .catch(e => {
                                                throw e
                                            })
                                    } else {
                                        return null;
                                    }
                                }).catch(e => {
                                    throw e
                                });
                            }
                        })
                        .catch(e => {
                            throw e
                        })
                }
            })
            .catch(e => {
                throw e
            })
    }

    /**
     * Update product
     * @param productData
     * @returns {Promise<never>|*}
     */
    updateProduct(productData = null) {
        if (notEmpty(productData) && notEmpty(productData.id) && notEmpty(productData.imei)) {
            const {
                id,
                name,
                imei,
                color,
                status,
                quantity,
                price,
                position,
                source,
                product_group_id,
                estimated_price,
                update_storage
            } = productData;
            let updateProductByImeiQuery;
            const product_estimated_price = notEmpty(estimated_price) ? estimated_price : 0;
            if (notEmpty(update_storage) && update_storage) {
                updateProductByImeiQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                            SET quantity = quantity + $1,
                                                price    = $2
                                            WHERE "position" = '${position}'
                                              AND product_id IN (SELECT id FROM ${DATA_TABLES.PRODUCT} WHERE imei = '${imei}') RETURNING *;`;
            } else {
                updateProductByImeiQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                            SET quantity = $1,
                                                price    = $2
                                            WHERE "position" = '${position}'
                                              AND product_id IN (SELECT id FROM ${DATA_TABLES.PRODUCT} WHERE imei = '${imei}') RETURNING *;`;
            }
            return this.pool.query(updateProductByImeiQuery, [quantity, price])
                .then(({ rows }) => {
                    if (rows.length > 0) {
                        // const {product_id, quantity, price, position, source} = rows[0];
                        return this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT}
                                                SET name             = $1,
                                                    imei             = $2,
                                                    color            =$3,
                                                    status           =$4,
                                                    product_group_id = $5,
                                                    estimated_price  = $6
                                                WHERE id = ${id} RETURNING *;`,
                            Object.values({
                                name,
                                imei,
                                color,
                                status,
                                product_group_id,
                                estimated_price: product_estimated_price
                            })
                        )
                            .then(({ rows }) => {
                                const { id, name, imei, color, status, product_group_id, estimated_price } = rows[0];
                                return {
                                    id,
                                    name,
                                    imei,
                                    color,
                                    status,
                                    quantity,
                                    price,
                                    position,
                                    source,
                                    product_group_id,
                                    estimated_price
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
                                                           product_group_id = $5,
                                                           estimated_price  = $6
                                                       WHERE id = ${id} RETURNING *;`;
                        promises.push(
                            this.pool.query(updateProductQueryStr, Object.values({
                                name,
                                imei,
                                color,
                                status,
                                product_group_id,
                                estimated_price: product_estimated_price
                            })).then(({ rows }) => rows[0]).catch(e => {
                                throw e
                            })
                        )

                        const updateProductStorageQueryStr = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                              SET quantity = $1,
                                                                  price    = $2,
                                                                  source   = $3
                                                              WHERE product_id = ${id}
                                                                AND position = '${position}' RETURNING *;`;
                        promises.push(
                            this.pool.query(updateProductStorageQueryStr, Object.values({ quantity, price, source }))
                                .then(({ rows }) => rows[0])
                                .catch(e => {
                                    throw e
                                })
                        )

                        return Promise.all(promises).then(([product, productStorage]) => {
                            const { id, name, imei, color, status, estimated_price } = product;
                            const { quantity, price, position, source } = productStorage;
                            return {
                                id, name, imei, color, status, quantity, price, position, source, estimated_price
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

    /**
     * Delete a product
     * @param productId
     * @returns {*}
     */
    deleteProduct(productId = 0) {
        const deleteProductQuery = `DELETE
                                    FROM ${DATA_TABLES.PRODUCT}
                                    WHERE id = $1;`;
        return this.pool.query(deleteProductQuery, [productId])
            .then((r) => {
                return { id: productId }
            })
            .catch(e => {
                throw e;
            })
    }

    /**
     * Create a product group
     * @param name
     * @returns {*}
     */
    createProductGroup(name = null) {
        return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_GROUP} (name)
                                VALUES ($1) RETURNING *;`, [name])
            .then(({ rows }) => {
                const { id, name, sort_order } = rows[0];
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

    /**
     * Update product group data
     * @param productGroupData
     * @returns {*}
     */
    updateProductGroup(productGroupData = null) {
        const { id, name, sort_order } = productGroupData;
        return this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_GROUP}
                                SET name       = $1,
                                    sort_order = $2,
                                    updated_at = $3
                                WHERE id = $4 RETURNING *;`, [name, sort_order, 'now()', id])
            .then(({ rows }) => {
                const { id, name, sort_order } = rows[0];
                return { id, name, sort_order }
            })
            .catch(e => {
                throw e
            })

    }

    /**
     * Delete product group
     * @param product_group_id
     * @returns {*}
     */
    deleteProductGroup(product_group_id = null) {
        return this.pool.query(`SELECT COUNT(*)
                                FROM ${DATA_TABLES.PRODUCT} p
                                WHERE p.product_group_id = $1`, [product_group_id])
            .then(({ rows }) => {
                const { count } = rows[0];
                if (count > 0) {
                    return Promise.resolve(null);
                } else {
                    return this.pool.query(`DELETE
                                            FROM ${DATA_TABLES.PRODUCT_GROUP}
                                            WHERE id = $1`, [product_group_id])
                        .then(({ rows }) => {
                            return {
                                id: product_group_id,
                                count
                            }
                        })
                        .catch(e => {
                            throw e
                        })
                }

            })
            .catch(e => {
                throw e
            })

    }

    /**
     * Get All product groups
     * @returns {*}
     */
    getAllProductGroup() {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.PRODUCT_GROUP}`)
            .then(({ rows }) => {
                return rows;
            })
            .catch(e => {
                throw e
            })
    }

    /**
     * Creat a product
     * @param productData
     * @returns {*}
     */
    createProduct(productData = null) {
        const {
            imei,
            name,
            color,
            status,
            quantity,
            price,
            position,
            source,
            estimated_price,
            product_group_id
        } = productData;
        const product_estimated_price = notEmpty(estimated_price) ? estimated_price : 0;
        const productDetail = {
            id: null,
            quantity: 0,
            name,
            imei,
            color,
            status,
            product_group_id,
            price,
            position,
            source,
            estimated_price: product_estimated_price
        }

        const insertProductSql = `INSERT INTO ${DATA_TABLES.PRODUCT} (imei, name, color, status, product_group_id, estimated_price)
                                  VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
        return this.pool.query(insertProductSql, Object.values({
            imei,
            name,
            color,
            status,
            product_group_id,
            product_estimated_price
        })).then(({ rows }) => {
            if (rows.length > 0) {
                const { id, name, imei, color, status } = rows[0];
                productDetail.id = id;
                return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
                    Object.values({
                        product_id: id,
                        quantity: quantity,
                        price: price,
                        position: position,
                        source: source
                    }))
                    .then(({ rows }) => {
                        if (rows.length > 0) {
                            const { quantity } = rows[0];
                            productDetail.quantity = quantity;
                        }
                        return productDetail;
                    })
                    .catch(e => {
                        throw e
                    })
            } else {
                return null;
            }
        }).catch(e => {
            throw e
        });

    }

    /**
     * Get product and storage info by imei and position
     * @param imei
     * @param position
     */
    getProductInfo(imei = null, position = null) {
        if (isEmpty(imei) && isEmpty(position)) {
            return Promise.resolve(null);
        }

        let productInfoQuery = `SELECT p.id,
                                       p.name,
                                       p.imei,
                                       p.color,
                                       p.status,
                                       p.product_group_id,
                                       p.estimated_price,
                                       p.display_order,
                                       ps.quantity,
                                       ps.price,
                                       ps.position,
                                       ps.source
                                FROM product p
                                         LEFT JOIN product_storage ps
                                                   ON p.id = ps.product_id AND ps.position = $1
                                WHERE p.imei = $2`;
        return this.pool.query(productInfoQuery, [position, imei])
            .then(({ rows }) => {
                return rows.length > 0 ? rows[0] : null;
            })
            .catch(e => {
                throw e
            })
    }

    addOrUpdateProduct(productData = null) {
        if (notEmpty(productData)) {
            // Prepare some data
            if (isEmpty(productData.display_order)) {
                productData.display_order = 0;
            }
            const {
                imei,
                position,
                name,
                color,
                status,
                product_group_id,
                display_order,
                quantity,
                price,
                source
            } = productData;

            let productQuery = ``;
            let productParams = {
                name,
                imei,
                color,
                status,
                product_group_id,
                display_order,
            };
            let productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                       SET quantity = $1,
                                           price    = $2
                                       WHERE product_id = $3
                                         AND position = $4 RETURNING *;`;
            let productStorageParams = {
                quantity: quantity,
                price: +productData.price, //Trick to convert string to number
                product_id: null,
                position: position,
            };

            // Check productData
            // soluong -> so luong san pham da ban, bang null neu chua ban
            let checkProductDataQuery = `SELECT productInfo.*, d.soluong
                                         FROM (SELECT p.id,
                                                      p.imei,
                                                      ps.price,
                                                      ps.position
                                               FROM product p
                                                        LEFT JOIN product_storage ps
                                                                  ON p.id = ps.product_id
                                               WHERE p.imei = $1) productInfo
                                                  LEFT JOIN danhsachsanphamdaban d
                                                            ON productInfo.id = CAST(d.productid AS INTEGER)`
            return this.pool.query(checkProductDataQuery, [imei])
                .then(({ rows }) => {
                    if (rows.length === 0) {
                        // Case 1: rows length = 0 -> Not exists product with imei => Tao record moi
                        // Prepare data for insert new product and product storage
                        productQuery = `INSERT INTO ${DATA_TABLES.PRODUCT} (name, imei, color, status, product_group_id, display_order)
                                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;

                        productStorageParams = {
                            product_id: null,
                            quantity: productStorageParams.quantity,
                            price: productStorageParams.price,
                            position: productStorageParams.position,
                            source
                        }
                        productStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                               VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
                    } else {
                        let isDifferPrice = true;
                        for (const p of rows) {

                            if (p.price === price) {
                                isDifferPrice = false;
                                break;
                            }
                        }

                        if (isDifferPrice) {
                            // Case 2: Khong co sp nao trung imei va trung gia => Tao Record moi
                            productQuery = `INSERT INTO ${DATA_TABLES.PRODUCT} (name, imei, color, status, product_group_id, display_order)
                                            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;

                            productStorageParams = {
                                product_id: null,
                                quantity: productStorageParams.quantity,
                                price: productStorageParams.price,
                                position: productStorageParams.position,
                                source
                            }
                            productStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                   VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
                        } else {
                            let soldProducts = []; // Ds san pham da ban
                            let notSaleProducts = []; // DS san pham chua ban
                            rows.forEach((p) => {
                                if (isEmpty(p.soluong)) {
                                    notSaleProducts.push(p);
                                } else {
                                    soldProducts.push(p);
                                }
                            });

                            if (soldProducts.length > 0 && notSaleProducts.length === 0) {
                                // Case 3: Trung imei, trung gia, chi co cac sp da ban khong co sp chua ban => Tao record moi
                                productQuery = `INSERT INTO ${DATA_TABLES.PRODUCT} (name, imei, color, status, product_group_id, display_order)
                                                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;

                                productStorageParams = {
                                    product_id: null,
                                    quantity: productStorageParams.quantity,
                                    price: productStorageParams.price,
                                    position: productStorageParams.position,
                                    source
                                }
                                productStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                       VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
                            } else if (notSaleProducts.length > 0) {
                                let notSaleProductTest;
                                // Case 4: Trung imei, trung gia, chi co cac sp chua ban ban khong co sp da ban => Cong don so luong vao sp chua ban
                                // Case 5: Trung imei, trung gia, co ca dong thoi sp da ban va chua ban => Cong don so luong vao sp chua ban
                                // Note: Chi update so luong vao sp chua ban dau tien
                                for (let i = 0; i < notSaleProducts.length - 1; i++) {
                                    for(let j=i+1;j<notSaleProducts.length;j++){
                                        if(notSaleProducts[i].price==notSaleProducts[j].price){
                                            notSaleProductTest = notSaleProducts[i].id
                                        }
                                    }
                                }
                                const notSaleProductId = notSaleProductTest; // Id sp chua ban dau tien
                                // const notSaleProductId = notSaleProducts[0].id; // Id sp chua ban dau tien
                                productQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                                SET name             = $1,
                                                    imei             = $2,
                                                    color            = $3,
                                                    status           = $4,
                                                    product_group_id = $5,
                                                    display_order    = $6
                                                WHERE id = ${notSaleProductId} RETURNING *;`;
                                productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                       SET quantity = quantity + $1,
                                                           price    = $2
                                                       WHERE product_id = $3
                                                         AND position = $4 RETURNING *;`;
                            }

                        }
                    }

                    return this.pool.query(productQuery, Object.values(productParams))
                        .then(({ rows }) => {
                            const { id } = rows[0];
                            if (isEmpty(productStorageParams.product_id)) {
                                productStorageParams.product_id = id;
                            }

                            return this.pool.query(productStorageQuery, Object.values(productStorageParams))
                                .then(({ rows }) => {
                                    if (rows.length > 0) {
                                        const { product_id, quantity, price } = rows[0];
                                        if (isEmpty(productData.id)) {
                                            productData.id = product_id;
                                        }
                                        return {
                                            product: productData,
                                            purchasing_quantity: quantity,
                                            purchasing_price: price,
                                        };
                                    }
                                })
                                .catch(e => {
                                    throw e
                                })


                        })
                        .catch(e => {
                            throw e
                        })
                })
                .catch(e => {
                    throw e
                })
        } else {
            return Promise.resolve(null);
        }
    }

}

module.exports = {
    ProductService
}
