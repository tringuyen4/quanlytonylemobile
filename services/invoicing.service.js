const {PURCHASING_INVOICE, DATA_TABLES, FOR_SALE_INVOICE} = require("../constants/data.constant");
const {INVOICE_TYPE, INVOICE_STATUS, PRODUCT_SOURCE, TRANSFER_STATUS} = require("../constants/common.constant");
const {notEmpty, isEmpty} = require("../utils/data.utils");
const {ProductService} = require("./product.service");

class InvoicingService {
    constructor(pool = null) {
        this.pool = pool; // Connection pool
        this.productService = new ProductService(this.pool);
    }

    // Public Methods

    // Purchasing Invoices
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

    getAllPurchasingInvoices() {
        const purchasingInvoiceQuery = `SELECT i.id             as invoice_id,
                                               c.name_vietnamese,
                                               i.sale_date,
                                               i.total_quantity as quantity,
                                               i.total_money
                                        FROM ${DATA_TABLES.INVOICE} i,
                                             ${DATA_TABLES.PURCHASING_DETAIL} pd,
                                             ${DATA_TABLES.CUSTOMER} c
                                        WHERE i.id = pd.invoice_id
                                          AND pd.customer_id = c.id
                                          AND i."type" = '${INVOICE_TYPE.PURCHASING}'
                                          AND i.status != '${INVOICE_STATUS.TERMINATED}';`;

        return this.pool.query(purchasingInvoiceQuery)
            .then(({rows}) => {
                if (rows.length > 0) {
                    return rows.map(purchasingInvoice => {
                        return {
                            invoice_id: purchasingInvoice.invoice_id,
                            sale_date: purchasingInvoice.sale_date,
                            quantity: purchasingInvoice.quantity,
                            total_money: purchasingInvoice.total_money,
                            customer: {
                                name_vietnamese: purchasingInvoice.name_vietnamese
                            }
                        }
                    })
                }
                return [];
            })
            .catch(e => {
                throw e
            });
    }

    getPurchasingInvoiceDetail(invoiceId = 0) {
        const getInvoiceItemQuery = `SELECT pd.invoice_id,
                                            i.total_quantity AS quantity,
                                            i.sale_date,
                                            i.total_money,
                                            pd.customer_id
                                     FROM ${DATA_TABLES.INVOICE} i,
                                          ${DATA_TABLES.PURCHASING_DETAIL} pd
                                     WHERE i.id = pd.invoice_id
                                       AND pd.invoice_id = $1
                                       AND i."type" = '${INVOICE_TYPE.PURCHASING}'
                                     LIMIT 1;`;
        return this.pool.query(getInvoiceItemQuery, [invoiceId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    // Enrich the detail info with customers and products
                    const invoice = rows[0];

                    // Enrich invoice info with customer and product items
                    const getCustomerQuery = `SELECT *
                                              FROM ${DATA_TABLES.CUSTOMER}
                                              WHERE id = $1
                                              LIMIT 1;`;
                    const getProductsQuery = `SELECT p.*
                                              FROM invoice i,
                                                   invoice_detail id,
                                                   purchasing_detail pd,
                                                   product p
                                              WHERE i.id = id.invoice_id
                                                AND i.id = pd.invoice_id
                                                AND p.id = id.product_id
                                                AND i."type" = '${INVOICE_TYPE.PURCHASING}'
                                                AND pd.invoice_id = $1;`;
                    return Promise.all([
                        this.pool.query(getCustomerQuery, [invoice.customer_id]),
                        this.pool.query(getProductsQuery, [invoiceId]),
                    ])
                        .then(([customerResult, productsResult]) => {
                            return {
                                invoice_id: invoice.invoice_id,
                                quantity: invoice.quantity,
                                total_money: invoice.total_money,
                                sale_date: invoice.sale_date,
                                customer: customerResult.rows.length > 0 ? customerResult.rows[0] : null,
                                products: productsResult.rows.length > 0 ? productsResult.rows : []
                            }
                        })
                        .catch(e => {
                            throw e;
                        })
                } else {
                    return null;
                }
            })
            .catch(e => {
                throw e;
            })
    }

    /**
     * Delete purchasing invoice
     * @param invoiceId
     * @return {*}
     */
    deletePurchasingInvoice(invoiceId = 0) {
        // Step 1: Update product quantity
        const getPurchasingProductsQuery = `SELECT p.id AS product_id, id.quantity AS purchasing_quantity
                                            FROM ${DATA_TABLES.PRODUCT} p,
                                                 ${DATA_TABLES.INVOICE} i,
                                                 ${DATA_TABLES.INVOICE_DETAIL} id,
                                                 ${DATA_TABLES.PURCHASING_DETAIL} pd
                                            WHERE p.id = id.product_id
                                              AND i.id = id.invoice_id
                                              AND i.id = pd.invoice_id
                                              AND i."type" = '${INVOICE_TYPE.PURCHASING}'
                                              AND i.status != '${INVOICE_STATUS.TERMINATED}'
                                              AND pd.invoice_id = $1;`
        return this.pool.query(getPurchasingProductsQuery, [invoiceId])
            .then(({rows}) => {
                const promises = [];
                rows.forEach((purchasingProduct) => {
                    const {product_id, purchasing_quantity} = purchasingProduct;
                    const updateProductQuantityQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                                        SET quantity = quantity - ${purchasing_quantity}
                                                        WHERE id = ${product_id};`;
                    promises.push(
                        this.pool.query(updateProductQuantityQuery)
                    )
                });
                return Promise.all(promises)
                    .then(r => {
                        // Step 2: Update status of invoice to TERMINATED
                        return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                SET status = '${INVOICE_STATUS.TERMINATED}'
                                                WHERE id = ${invoiceId}
                                                RETURNING id;`)
                            .then((rows) => {
                                if (rows.length > 0) {
                                    const {id} = rows[0];
                                    return {id};
                                }
                                return null;
                            })
                            .catch(e => {
                                throw e;
                            })
                    })
                    .catch(e => {
                        throw e;
                    })
            })
            .catch(e => {
                throw  e
            });
    }

    // For Sale Invoices
    forSaleInvoice(forSaleInvoiceData = null) {
        // Step 1: Create/Update for sale invoice
        return this._processForSaleInvoice(forSaleInvoiceData)
            .then((forSaleInvoice) => {
                // Step 2: Create/Update for sale: invoice_detail
                return this._processForSaleInvoiceDetail(forSaleInvoice, forSaleInvoiceData.products)
                    .then(forSaleInvoice => forSaleInvoice)
                    .catch(e => {
                        throw e;
                    });
            });
    }

    getForSaleInvoiceByStatus(invoiceStatus = INVOICE_STATUS.PROCESSING) {
        const forSaleInvoiceQuery = `SELECT id as invoice_id, sale_date, total_quantity as quantity, total_money
                                     FROM ${DATA_TABLES.INVOICE}
                                     WHERE type = '${INVOICE_TYPE.FOR_SALE}'
                                       AND status = '${invoiceStatus}';`;
        return this.pool.query(forSaleInvoiceQuery)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

    cancelForSaleInvoice(invoiceId = 0) {
        // Get all product item in invoice to update quantity
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.INVOICE_DETAIL}
                                WHERE invoice_id = ${invoiceId};`)
            .then(({rows}) => {
                if (rows.length > 0) {
                    const promises = [];
                    rows.forEach((invoiceItem) => {
                        const updateProductQuantityQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                                            SET quantity = quantity + ${invoiceItem.quantity}
                                                            WHERE id = ${invoiceItem.product_id};`;
                        promises.push(
                            this.pool.query(updateProductQuantityQuery)
                        )
                    });

                    return Promise.all(promises)
                        .then((r) => {
                            return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                    SET status = '${INVOICE_STATUS.TERMINATED}'
                                                    WHERE id = ${invoiceId};`)
                                .then((r) => {
                                    return true;
                                })
                                .catch(e => {
                                    throw e;
                                })
                        }).catch(e => {
                            throw e;
                        })
                }
                return Promise.resolve(true);
            })
    }

    approveForSaleInvoice(forSaleInvoiceData, invoiceId = 0) {
        return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                SET status = '${INVOICE_STATUS.COMPLETED}'
                                WHERE id = ${invoiceId};`)
            .then(() => {
                return true;
            })
            .catch(e => {
                throw e;
            })
    }

    getForSaleInvoiceDetail(invoiceId = 0, position = PRODUCT_SOURCE.KAI) {
        const invoiceDetail = FOR_SALE_INVOICE;
        return this.pool.query(`SELECT p.id, p.name, p.imei, p.color, p.status, ps.quantity, ps.price
                                FROM ${DATA_TABLES.PRODUCT} p,
                                     ${DATA_TABLES.PRODUCT_STORAGE} ps,
                                     ${DATA_TABLES.INVOICE_DETAIL} id
                                WHERE p.id = id.product_id
                                  AND p.id = ps.product_id
                                  AND ps.position = '${position}'
                                  AND id.invoice_id = ${invoiceId};`)
            .then(({rows}) => {
                invoiceDetail.products = rows;
                return this.pool.query(`SELECT id as invoice_id, sale_date, total_quantity as quantity, total_money
                                        FROM ${DATA_TABLES.INVOICE}
                                        WHERE id = ${invoiceId};`)
                    .then(({rows}) => {
                        if (rows.length > 0) {
                            return {...invoiceDetail, ...rows[0]};
                        }
                        return invoiceDetail;
                    })
                    .catch(e => {
                        throw e;
                    })
            })
            .catch(e => {
                throw e;
            });
    }

    /**
     * =============================
     *  TRANSFER INVOICE
     * =============================
     */
    transferInvoice(transferData = null) {
        const {
            sale_date,
            total_quantity,
            total_money,
            from_position,
            to_position,
            exchange_rate,
            sub_fee,
            products
        } = transferData;
        // Create new invoice and invoice item with invoice items in PROCESSING transfer status
        const purchasingInvoiceQuery = `INSERT INTO ${DATA_TABLES.INVOICE} (sale_date, total_quantity, total_money, type, status)
                                        VALUES ($1, $2, $3, $4, $5)
                                        RETURNING *;`;
        return this.pool.query(purchasingInvoiceQuery, Object.values({
            sale_date,
            total_quantity,
            total_money,
            type: INVOICE_TYPE.TRANSFERRING,
            status: INVOICE_STATUS.PROCESSING
        }))
            .then(({rows}) => {
                // Update for transfer_detail
                const {id} = rows[0];
                const promises = [];
                products.forEach((transferProduct) => {
                    const {quantity, price} = transferProduct;
                    const product_id = transferProduct.id;
                    // Calculate the total_money if transfer from other position to vn storage\
                    let transfer_price = price;
                    if (from_position !== to_position && to_position === PRODUCT_SOURCE.SHOP_VN) {
                        transfer_price = (transfer_price * exchange_rate) + sub_fee;
                    }
                    promises.push(
                        this.pool.query(`INSERT INTO ${DATA_TABLES.TRANSFER_DETAIL} (invoice_id, product_id,
                                                                                     from_position,
                                                                                     to_position, quantity,
                                                                                     price, exchange_rate,
                                                                                     sub_fee, transfer_price,
                                                                                     transfer_status)
                                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                                         RETURNING *;`,
                            Object.values({
                                invoice_id: id,
                                product_id,
                                from_position,
                                to_position,
                                quantity,
                                price,
                                exchange_rate,
                                sub_fee,
                                transfer_price,
                                transfer_status: TRANSFER_STATUS.PROCESSING
                            })
                        )
                    )

                    return Promise.all(promises).then(r => {
                        return {
                            invoice_id: id
                        }
                    }).catch(e => {
                        throw e
                    })
                })
            })
            .catch(e => {
                throw e
            })
    }

    approveTransferInvoiceItem(invoiceId = 0, productId = 0) {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.TRANSFER_DETAIL}
                                WHERE invoice_id = $1
                                  AND product_id = $2
                                  AND transfer_status = $3`, [invoiceId, productId, TRANSFER_STATUS.PROCESSING])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {quantity, from_position, to_position, price} = rows[0];
                    return Promise.all([
                        this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                         SET quantity = quantity - $1
                                         WHERE product_id = $2
                                           AND position = $3`, [quantity, productId, from_position]),
                        this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                         SET quantity = quantity + $1
                                         WHERE product_id = $2
                                           AND position = $3
                                         RETURNING *;`, [quantity, productId, to_position])
                            .then(({rows}) => {
                                if (rows.length === 0) {
                                    // In-case can not update we will insert new one
                                    return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                            VALUES ($1, $2, $3, $4, $5)
                                                            RETURNING *`, [productId, quantity, price, to_position, from_position])
                                        .then(({rows}) => rows[0])
                                        .catch(e => {
                                            throw e
                                        })
                                } else {
                                    return Promise.resolve(true)
                                }
                            }),
                        this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                         SET transfer_status = $1
                                         WHERE invoice_id = $2
                                           AND product_id = $3`, [TRANSFER_STATUS.TRANSFERRED, invoiceId, productId]),
                    ])
                        .then((r) => {
                            return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                    SET status = '${INVOICE_STATUS.COMPLETED}'
                                                    WHERE (
                                                              SELECT count(*)
                                                              FROM ${DATA_TABLES.TRANSFER_DETAIL} tt
                                                              WHERE tt.invoice_id = $1
                                                                AND tt.transfer_status = '${TRANSFER_STATUS.PROCESSING}'
                                                          ) = 0
                                                      AND id = $1
                                                      AND status = '${INVOICE_STATUS.PROCESSING}'
                                                    RETURNING *;`, [invoiceId])
                                .then(({rows}) => {
                                    return {invoice_id: invoiceId, product_id: productId}
                                })
                                .catch(e => {
                                    throw e
                                })
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

    cancelTransferInvoiceItem(invoiceId = 0, productId = 0) {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.TRANSFER_DETAIL}
                                WHERE invoice_id = $1
                                  AND product_id = $2
                                  AND transfer_status = $3`, [invoiceId, productId, TRANSFER_STATUS.PROCESSING])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {quantity, from_position, to_position, price} = rows[0];
                    return this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                            SET transfer_status = $1
                                            WHERE invoice_id = $2
                                              AND product_id = $3`, [TRANSFER_STATUS.CANCELED, invoiceId, productId])
                        .then((r) => {
                            return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                    SET status = '${INVOICE_STATUS.TERMINATED}'
                                                    WHERE (
                                                              SELECT count(*)
                                                              FROM ${DATA_TABLES.TRANSFER_DETAIL} tt
                                                              WHERE tt.invoice_id = $1
                                                                AND tt.transfer_status = '${TRANSFER_STATUS.PROCESSING}'
                                                          ) = 0
                                                      AND id = $1
                                                      AND status = '${INVOICE_STATUS.PROCESSING}'
                                                    RETURNING *;`, [invoiceId])
                                .then(({rows}) => {
                                    return {invoice_id: invoiceId, product_id: productId}
                                })
                                .catch(e => {
                                    throw e
                                })
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

    approveTransferInvoice(invoiceId = 0) {
        // Get all transfer items
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.TRANSFER_DETAIL}
                                WHERE invoice_id = ${invoiceId};`)
            .then(({rows}) => {
                const promises = [];
                rows.forEach((transferItem) => {
                    const {product_id, from_position, to_position, quantity, transfer_status, price} = transferItem;
                    if (transfer_status === TRANSFER_STATUS.PROCESSING) {
                        // Update target storage
                        promises.push(
                            this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                             SET quantity = quantity + $1
                                             WHERE product_id = $2
                                               AND position = $3
                                             RETURNING *;`, [quantity, product_id, to_position])
                                .then(({rows}) => {
                                    if (rows.length > 0) {
                                        return rows[0]
                                    } else {
                                        // In-case can not update we will insert new one
                                        return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                                VALUES ($1, $2, $3, $4, $5)
                                                                RETURNING *`, [product_id, quantity, price, to_position, from_position])
                                            .then(({rows}) => rows[0])
                                            .catch(e => {
                                                throw e
                                            })
                                    }
                                })
                                .catch(e => {
                                    throw e
                                })
                        )

                        // Update source storage
                        promises.push(this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                       SET quantity = quantity - $1
                                                       WHERE product_id = $2
                                                         AND position = $3`, [quantity, product_id, from_position]));

                        // Update transfer item status to transferred
                        promises.push(this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                                       SET transfer_status = $1
                                                       WHERE invoice_id = $2
                                                         AND product_id = $3`, [TRANSFER_STATUS.TRANSFERRED, invoiceId, product_id]));
                    }
                })

                return Promise.all(promises)
                    .then((r) => {
                        return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                SET status = $1
                                                WHERE id = $2`, [INVOICE_STATUS.COMPLETED, invoiceId])
                            .then(({rows}) => rows[0])
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
    }

    cancelTransferInvoice(invoiceId = 0) {
        // Get all transfer items
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.TRANSFER_DETAIL}
                                WHERE invoice_id = ${invoiceId};`)
            .then(({rows}) => {
                const promises = [];
                rows.forEach((transferItem) => {
                    const {product_id, from_position, to_position, quantity, transfer_status, price} = transferItem;
                    if (transfer_status === TRANSFER_STATUS.PROCESSING) {
                        // Update transfer item status to transferred
                        promises.push(this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                                       SET transfer_status = $1
                                                       WHERE invoice_id = $2
                                                         AND product_id = $3`, [TRANSFER_STATUS.CANCELED, invoiceId, product_id]));
                    }
                })

                return Promise.all(promises)
                    .then((r) => {
                        return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                SET status = $1
                                                WHERE id = $2`, [INVOICE_STATUS.TERMINATED, invoiceId])
                            .then(({rows}) => rows[0])
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
    }

    getTransferringInvoiceByStatus(invoiceStatus = INVOICE_STATUS.PROCESSING, position = null) {
        let transferringInvoiceQuery = `SELECT id as invoice_id, sale_date, total_quantity as quantity, total_money
                                        FROM ${DATA_TABLES.INVOICE}
                                        WHERE type = '${INVOICE_TYPE.TRANSFERRING}'
                                          AND status = '${invoiceStatus}';`;
        if (notEmpty(position)) {
            transferringInvoiceQuery = `SELECT i.id             as invoice_id,
                                               i.sale_date,
                                               i.total_quantity as quantity,
                                               i.total_money
                                        FROM ${DATA_TABLES.INVOICE} i,
                                             ${DATA_TABLES.TRANSFER_DETAIL} td
                                        WHERE i.id = td.invoice_id
                                          AND i."type" = '${INVOICE_TYPE.TRANSFERRING}'
                                          AND i.status = '${invoiceStatus}'
                                          AND td.to_position = '${position}'
                                        GROUP BY i.id`
        }
        return this.pool.query(transferringInvoiceQuery)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

    getInvoiceByStatus(invoiceStatus = INVOICE_STATUS.PROCESSING, position = null) {
        let transferringInvoiceQuery = `SELECT id             as invoice_id,
                                               sale_date,
                                               total_quantity as quantity,
                                               total_money,
                                               type
                                        FROM ${DATA_TABLES.INVOICE}
                                        WHERE type = '${INVOICE_TYPE.TRANSFERRING}'
                                          AND status = '${invoiceStatus}';`;
        let forSaleInvoiceQuery = `SELECT id as invoice_id, sale_date, total_quantity as quantity, total_money, type
                                   FROM ${DATA_TABLES.INVOICE}
                                   WHERE type = '${INVOICE_TYPE.FOR_SALE}'
                                     AND status = '${invoiceStatus}';`;

        if (notEmpty(position)) {
            transferringInvoiceQuery = `SELECT i.id             as invoice_id,
                                               i.sale_date,
                                               i.total_quantity as quantity,
                                               i.total_money,
                                               i."type"
                                        FROM ${DATA_TABLES.INVOICE} i,
                                             ${DATA_TABLES.TRANSFER_DETAIL} td
                                        WHERE i.id = td.invoice_id
                                          AND i."type" = '${INVOICE_TYPE.TRANSFERRING}'
                                          AND i.status = '${invoiceStatus}'
                                          AND td.to_position = '${position}'
                                        GROUP BY i.id`
            forSaleInvoiceQuery = `SELECT i.id             as invoice_id,
                                          i.sale_date,
                                          i.total_quantity as quantity,
                                          i.total_money,
                                          i."type"
                                   FROM ${DATA_TABLES.INVOICE} i,
                                        ${DATA_TABLES.INVOICE_DETAIL} id,
                                        ${DATA_TABLES.PRODUCT_STORAGE} ps
                                   WHERE i.id = id.invoice_id
                                     AND id.product_id = ps.product_id
                                     AND i."type" = '${INVOICE_TYPE.FOR_SALE}'
                                     AND i.status = '${invoiceStatus}'
                                     AND ps."position" = '${position}'
                                   GROUP BY i.id`
        }
        return Promise.all([
            this.pool.query(transferringInvoiceQuery),
            this.pool.query(forSaleInvoiceQuery),
        ]).then(([transferringInvoiceResult, forSaleInvoiceResult]) => {
            return [...transferringInvoiceResult.rows, ...forSaleInvoiceResult.rows]
        })
            .catch(e => {
                throw e;
            })
    }

    getTransferringInvoiceDetail(invoiceId = 0, position = PRODUCT_SOURCE.KAI) {
        const invoiceDetail = FOR_SALE_INVOICE;
        const transferringInvoiceDetailQuery = `SELECT p.id, p.name, p.imei, p.color, p.status, td.quantity, td.price, td.transfer_status
                                                FROM ${DATA_TABLES.INVOICE} i,
                                                     ${DATA_TABLES.TRANSFER_DETAIL} td,
                                                     ${DATA_TABLES.PRODUCT_STORAGE} ps,
                                                     ${DATA_TABLES.PRODUCT} p
                                                WHERE i.id = td.invoice_id
                                                  AND td.product_id = ps.product_id
                                                  AND p.id = ps.product_id
                                                  AND i."type" = '${INVOICE_TYPE.TRANSFERRING}'
                                                  AND ps.position = '${position}'
                                                  AND i.id = ${invoiceId};`;
        return this.pool.query(transferringInvoiceDetailQuery)
            .then(({rows}) => {
                invoiceDetail.products = rows;
                return this.pool.query(`SELECT id as invoice_id, sale_date, total_quantity as quantity, total_money
                                        FROM ${DATA_TABLES.INVOICE}
                                        WHERE id = ${invoiceId};`)
                    .then(({rows}) => {
                        if (rows.length > 0) {
                            return {...invoiceDetail, ...rows[0]};
                        }
                        return invoiceDetail;
                    })
                    .catch(e => {
                        throw e;
                    })
            })
            .catch(e => {
                throw e;
            });
    }

    _processForSaleInvoice(invoiceData = null) {
        const {quantity, sale_date, total_money} = invoiceData;

        const purchasingInvoiceQuery = `INSERT INTO ${DATA_TABLES.INVOICE} (sale_date, total_quantity, total_money, type, status)
                                        VALUES ($1, $2, $3, $4, $5)
                                        RETURNING *;`;
        return this.pool.query(purchasingInvoiceQuery, Object.values({
            sale_date,
            quantity,
            total_money,
            type: INVOICE_TYPE.FOR_SALE,
            status: INVOICE_STATUS.PROCESSING
        }))
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {id, total_quantity, total_money, sale_date} = rows[0];
                    return {
                        invoice_id: id,
                        sale_date,
                        quantity: total_quantity,
                        total_money
                    }
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    _processForSaleInvoiceDetail(forSaleInvoice = FOR_SALE_INVOICE, forSaleInvoiceProducts = []) {
        const {invoice_id} = forSaleInvoice;
        if (notEmpty(forSaleInvoiceProducts)) {
            const promises = [];
            forSaleInvoiceProducts.forEach((productItem) => {
                // For each product we run query to insert to invoice_detail and run other query to update quantity of product
                const insertInvoiceDetailQuery = `INSERT INTO ${DATA_TABLES.INVOICE_DETAIL} (invoice_id, product_id, quantity, price)
                                                  SELECT ${invoice_id}, ${productItem.id}, $1, $2
                                                  WHERE NOT EXISTS(
                                                          SELECT invoice_id, product_id
                                                          FROM ${DATA_TABLES.INVOICE_DETAIL}
                                                          WHERE invoice_id = ${invoice_id}
                                                            AND product_id = ${productItem.id}
                                                      );`
                promises.push(
                    this.pool.query(insertInvoiceDetailQuery, Object.values({
                        quantity: productItem.quantity,
                        price: productItem.price
                    }))
                )

                const updateProductQuantityQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                                    SET quantity = quantity - ${productItem.quantity}
                                                    WHERE id = ${productItem.id};`;
                promises.push(
                    this.pool.query(updateProductQuantityQuery)
                )
            });

            return Promise.all(promises)
                .then(() => {
                    return forSaleInvoice;
                })
                .catch(e => {
                    throw e;
                })

        } else {
            return Promise.resolve(forSaleInvoice)
        }
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

            listProducts.forEach((product) => {
                promises.push(this._saveProduct(product))
            })

            // Handle for customer
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

    _saveProduct(product) {
        const getProductByImeiQuery = `SELECT *
                                       FROM ${DATA_TABLES.PRODUCT}
                                       WHERE imei = '${product.imei}';`;
        return this.pool.query(getProductByImeiQuery).then(({rows}) => {
            const productParams = {
                name: product.name,
                imei: product.imei,
                color: product.color,
                status: product.status,
                quantity: product.quantity,
                price: product.price
            }
            let productQuery = `INSERT INTO ${DATA_TABLES.PRODUCT} (name, imei, color, status, quantity, price)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                RETURNING *;`;
            if (rows.length > 0) {
                // Exists quantity
                const {id, quantity} = rows[0];
                if (isEmpty(product.id)) {
                    productParams.quantity = quantity + product.quantity;
                }
                productQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                SET name     = $1,
                                    imei     = $2,
                                    color    = $3,
                                    status   = $4,
                                    quantity = $5,
                                    price    = $6
                                WHERE id = ${id}
                                RETURNING *;`;
            }
            return this.pool.query(productQuery, Object.values(productParams)).then(({rows}) => {
                return {
                    product: rows[0],
                    purchasing_quantity: product.quantity,
                    purchasing_price: product.price
                };
            })

        }).catch(e => {
            throw e;
        })
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

        // Update invoice_detail
        const {products, invoice_id} = purchasingInvoice;
        let listProducts = [];
        let listProductIds = [];
        products.forEach((invoiceProduct) => {
            // Get back the list product
            const {product, purchasing_price, purchasing_quantity} = invoiceProduct;
            listProducts.push(invoiceProduct.product);
            listProductIds.push(product.id);
            const invoiceDetailParams = {
                quantity: purchasing_quantity,
                price: purchasing_price
            }

            // Update anyway
            const updateInvoiceDetailQuery = `UPDATE ${DATA_TABLES.INVOICE_DETAIL}
                                              SET quantity = $1,
                                                  price    = $2
                                              WHERE invoice_id = ${invoice_id}
                                                AND product_id = ${product.id}`;
            promises.push(this.pool.query(updateInvoiceDetailQuery, Object.values(invoiceDetailParams)));

            // Insert if not exits
            const insertInvoiceDetailQuery = `INSERT INTO ${DATA_TABLES.INVOICE_DETAIL} (invoice_id, product_id, quantity, price)
                                              SELECT ${invoice_id}, ${product.id}, $1, $2
                                              WHERE NOT EXISTS(
                                                      SELECT invoice_id, product_id
                                                      FROM ${DATA_TABLES.INVOICE_DETAIL}
                                                      WHERE invoice_id = ${invoice_id}
                                                        AND product_id = ${product.id}
                                                  );`
            promises.push(this.pool.query(insertInvoiceDetailQuery, Object.values(invoiceDetailParams)));

        });

        // Delete removed invoice_item record
        promises.push(
            this.pool.query(`DELETE
                             FROM ${DATA_TABLES.INVOICE_DETAIL}
                             WHERE invoice_id = ${invoice_id}
                               AND product_id NOT IN (${listProductIds.join(',')});`)
        );

        promises.push(
            this.pool.query(`INSERT INTO ${DATA_TABLES.PURCHASING_DETAIL}
                             SELECT $1, $2
                             WHERE NOT EXISTS(
                                     SELECT invoice_id, customer_id
                                     FROM ${DATA_TABLES.PURCHASING_DETAIL}
                                     WHERE invoice_id = $1
                                       AND customer_id = $2
                                 );`, Object.values({invoice_id, customer_id: purchasingInvoice.customer.id}))
        );

        return Promise.all(promises).then(r => {
            purchasingInvoice.products = listProducts;
            return purchasingInvoice;
        }).catch(e => {
            throw e;
        });
    }
}

module.exports = {
    InvoicingService
}
