const {PURCHASING_INVOICE, DATA_TABLES, FOR_SALE_INVOICE} = require("../constants/data.constant");
const {
    INVOICE_TYPE,
    INVOICE_STATUS,
    PRODUCT_SOURCE,
    TRANSFER_STATUS,
    PAYMENT_TYPE
} = require("../constants/common.constant");
const {notEmpty, isEmpty} = require("../utils/data.utils");
const {ProductService} = require("./product.service");

class InvoicingService {

    constructor(pool = null) {
        this.pool = pool; // Connection pool,
        this.productService = new ProductService(pool);
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
                            .then((purchasingInvoice) => {
                                const {payment_type, payment_detail, payment_create_date} = purchasingInvoiceData;
                                // Step 4: Process payment detail
                                return this._processPaymentDetail(purchasingInvoice, {
                                    payment_type,
                                    payment_detail,
                                    payment_create_date
                                }).then((purchasingInvoice) => purchasingInvoice)
                            })
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
                                          AND i.status != '${INVOICE_STATUS.TERMINATED}'
                                        ORDER BY pd.created_at ASC;`;

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
                                            i.payment_type,
                                            i.locked,
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
                    const getProductsQuery = `SELECT p.*, id.quantity, id.price, ps.position, ps.source
                                              FROM ${DATA_TABLES.INVOICE} i,
                                                   ${DATA_TABLES.INVOICE_DETAIL} id,
                                                   ${DATA_TABLES.PURCHASING_DETAIL} pd,
                                                   ${DATA_TABLES.PRODUCT} p,
                                                   ${DATA_TABLES.PRODUCT_STORAGE} ps
                                              WHERE i.id = id.invoice_id
                                                AND p.id = id.product_id
                                                AND p.id = ps.product_id
                                                AND i.id = pd.invoice_id
                                                AND i."type" = '${INVOICE_TYPE.PURCHASING}'
                                                AND ps."position" = '${PRODUCT_SOURCE.SHOP_JP}'
                                                AND i.id = $1
                                                AND pd.customer_id = $2
                                              ORDER BY p.display_order ASC;`;

                    const getInvoicePaymentQuery = `SELECT *
                                                    FROM ${DATA_TABLES.INVOICE_PAYMENT}
                                                    WHERE invoice_id = $1
                                                    LIMIT 1;`

                    return Promise.all([
                        this.pool.query(getCustomerQuery, [invoice.customer_id]),
                        this.pool.query(getProductsQuery, [invoiceId, invoice.customer_id]),
                        this.pool.query(getInvoicePaymentQuery, [invoiceId]),
                    ])
                        .then(([customerResult, productsResult, invoicePaymentDetail]) => {
                            return {
                                invoice_id: invoice.invoice_id,
                                quantity: invoice.quantity,
                                payment_type: invoice.payment_type,
                                total_money: invoice.total_money,
                                sale_date: invoice.sale_date,
                                locked: invoice.locked,
                                customer: customerResult.rows.length > 0 ? customerResult.rows[0] : null,
                                products: productsResult.rows.length > 0 ? productsResult.rows : [],
                                payment_detail: (invoicePaymentDetail.rows.length > 0) ? invoicePaymentDetail.rows[0] : null,
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

    lockPurchasingInvoice(invoiceId = 0) {
        const lockPurchasingInvoiceQuery = `UPDATE ${DATA_TABLES.INVOICE}
                                            SET locked = true
                                            WHERE id = ${invoiceId}
                                            RETURNING *;`;
        return this.pool.query(lockPurchasingInvoiceQuery)
            .then(({rows}) => {
                return rows.length > 0 ? rows[0] : null;
            })
            .catch(e => {
                throw e
            })
    }

    unlockPurchasingInvoice(invoiceId = 0) {
        const lockPurchasingInvoiceQuery = `UPDATE ${DATA_TABLES.INVOICE}
                                            SET locked = false
                                            WHERE id = ${invoiceId}
                                              AND locked = true
                                            RETURNING *;`;
        return this.pool.query(lockPurchasingInvoiceQuery)
            .then(({rows}) => {
                return rows.length > 0 ? rows[0] : null;
            })
            .catch(e => {
                throw e
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
                const purchasingShops = [PRODUCT_SOURCE.KAI, PRODUCT_SOURCE.SHOP_JP].map(x => `'${x}'`).join(',')
                rows.forEach((purchasingProduct) => {
                    const {product_id, purchasing_quantity} = purchasingProduct;
                    const updateProductQuantityQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                        SET quantity = quantity - ${purchasing_quantity}
                                                        WHERE product_id = ${product_id}
                                                          AND position IN (${purchasingShops});`;
                    promises.push(
                        this.pool.query(updateProductQuantityQuery)
                    )
                });
                return Promise.all(promises)
                    .then(r => {
                        // Step 2: Update status of invoice to TERMINATED and delete quanlychi record
                        const updateInvoicePromises = [
                            this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                SET status = '${INVOICE_STATUS.TERMINATED}'
                                                WHERE id = ${invoiceId}
                                                RETURNING id;`),
                            this.pool.query(`DELETE FROM ${DATA_TABLES.QUAN_LY_CHI}
                                                WHERE invoice_id = ${invoiceId}
                                                RETURNING id;`)
                        ];

                        return Promise.all(updateInvoicePromises)
                            .then(([invoiceResult, paymentResult]) => {
                                if (invoiceResult.rows.length > 0) {
                                    const {id} = invoiceResult.rows[0];
                                    return {id};
                                }
                                return null;
                            })
                            .catch(e => {
                                throw e
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
                        const purchasingShops = [PRODUCT_SOURCE.KAI, PRODUCT_SOURCE.SHOP_JP].map(x => `'${x}'`).join(',')
                        const updateProductQuantityQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                            SET quantity = quantity + ${invoiceItem.quantity}
                                                            WHERE product_id = ${invoiceItem.product_id}
                                                              AND position IN (${purchasingShops});`;
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
            products,
            transfer_date
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
                    const estimated_price = notEmpty(transferProduct.estimated_price) ? transferProduct.estimated_price : 0;
                    const product_id = transferProduct.id;
                    console.log(`>>>> TRANSFER PRODUCT: ID: ${product_id}, From: ${from_position}, TO: ${to_position}, quantity: ${quantity}, price: ${price}`);
                    // Calculate the total_money if transfer from other position to vn storage\
                    let transfer_price = price;
                    let transfer_estimated_price = estimated_price;
                    if (from_position !== to_position && to_position === PRODUCT_SOURCE.SHOP_VN) {
                        transfer_price = (+transfer_price * +exchange_rate) + +sub_fee;
                        transfer_estimated_price = (+estimated_price * +exchange_rate) + +sub_fee;
                    }

                    promises.push(
                        this.pool.query(`INSERT INTO ${DATA_TABLES.TRANSFER_DETAIL} (invoice_id, product_id,
                                                                                     from_position,
                                                                                     to_position, quantity,
                                                                                     price, exchange_rate,
                                                                                     sub_fee, transfer_price,
                                                                                     transfer_status, transfer_date)
                                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
                                transfer_status: TRANSFER_STATUS.PROCESSING,
                                transfer_date
                            })
                        )
                    )

                    promises.push(
                        this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                         SET quantity = quantity - ${quantity}
                                         WHERE product_id = ${product_id}
                                           AND position = '${from_position}'
                                         RETURNING *;`)
                    )

                    promises.push(
                        this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT}
                                         SET estimated_price = $1
                                         WHERE id = ${product_id}
                                         RETURNING *;`, [transfer_estimated_price])
                    )
                })
                return Promise.all(promises).then(r => {
                    return {
                        invoice_id: id
                    }
                }).catch(e => {
                    throw e
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
                                                            VALUES ($1, $2, $3, $4,
                                                                    $5)
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
                                         SET transfer_status = $1,
                                             transfer_date   = $2
                                         WHERE invoice_id = $3
                                           AND product_id = $4`, [TRANSFER_STATUS.TRANSFERRED, 'now()', invoiceId, productId]),
                    ])
                        .then((r) => {
                            return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                    SET status = '${INVOICE_STATUS.COMPLETED}'
                                                    WHERE (SELECT count(*)
                                                           FROM ${DATA_TABLES.TRANSFER_DETAIL} tt
                                                           WHERE tt.invoice_id = $1
                                                             AND tt.transfer_status = '${TRANSFER_STATUS.PROCESSING}') =
                                                          0
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
                } else {
                    this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                     SET transfer_date = $1
                                     WHERE invoice_id = $2
                                       AND product_id = $3`, ['now()', invoiceId, productId])
                        .then(({rows}) => {
                            return {invoice_id: invoiceId, product_id: productId}
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
                                                    WHERE (SELECT count(*)
                                                           FROM ${DATA_TABLES.TRANSFER_DETAIL} tt
                                                           WHERE tt.invoice_id = $1
                                                             AND tt.transfer_status = '${TRANSFER_STATUS.PROCESSING}') =
                                                          0
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
                                                                VALUES ($1, $2, $3, $4,
                                                                        $5)
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
        const transferringInvoiceDetailQuery = `SELECT p.id,
                                                       p.name,
                                                       p.imei,
                                                       p.color,
                                                       p.status,
                                                       td.quantity,
                                                       td.price,
                                                       td.transfer_status
                                                FROM ${DATA_TABLES.INVOICE} i,
                                                     ${DATA_TABLES.TRANSFER_DETAIL} td,
                                                     ${DATA_TABLES.PRODUCT_STORAGE} ps,
                                                     ${DATA_TABLES.PRODUCT} p
                                                WHERE i.id = td.invoice_id
                                                  AND td.product_id = ps.product_id
                                                  AND p.id = ps.product_id
                                                  AND i."type" = '${INVOICE_TYPE.TRANSFERRING}'
                                                  AND td.to_position = '${position}'
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
                // $2 WHERE NOT EXISTS(
                // For each product we run query to insert to invoice_detail and run other query to update quantity of product
                const insertInvoiceDetailQuery = `INSERT INTO ${DATA_TABLES.INVOICE_DETAIL} (invoice_id, product_id, quantity, price)
                                                  SELECT ${invoice_id},
                                                         ${productItem.id},
                                                         $1,
                                                         $2
                                                  WHERE NOT EXISTS(
                                                          SELECT invoice_id, product_id
                                                          FROM ${DATA_TABLES.INVOICE_DETAIL}
                                                          WHERE invoice_id = ${invoice_id}
                                                            AND product_id = ${productItem.id});`
                promises.push(
                    this.pool.query(insertInvoiceDetailQuery, Object.values({
                        quantity: productItem.quantity,
                        price: productItem.price
                    }))
                )
                const position = notEmpty(productItem.position) ? productItem.position : PRODUCT_SOURCE.KAI;
                const updateProductQuantityQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                    SET quantity = quantity - ${productItem.quantity}
                                                    WHERE product_id = ${productItem.id}
                                                      AND position = $1;`;
                promises.push(
                    this.pool.query(updateProductQuantityQuery, [position])
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
        const {invoice_id, quantity, sale_date, total_money, payment_type} = invoiceData;
        let purchasingInvoiceData = {
            sale_date,
            quantity,
            total_money,
            type: INVOICE_TYPE.PURCHASING,
            status: INVOICE_STATUS.COMPLETED,
            payment_type
        }

        let purchasingInvoiceQuery = `INSERT INTO ${DATA_TABLES.INVOICE} (sale_date, total_quantity, total_money, type, status, payment_type)
                                      VALUES ($1, $2, $3, $4, $5, $6)
                                      RETURNING *;`;
        purchasingInvoice.is_new_invoice = true;

        if (notEmpty(invoice_id)) {
            purchasingInvoiceQuery = `UPDATE ${DATA_TABLES.INVOICE}
                                      SET sale_date      = $1,
                                          total_quantity = $2,
                                          total_money    = $3,
                                          type           = $4,
                                          status         = $5,
                                          payment_type   = $6
                                      WHERE id = ${invoice_id}
                                      RETURNING *;`;
            purchasingInvoice.is_new_invoice = false;
        }

        return this.pool.query(purchasingInvoiceQuery, Object.values(purchasingInvoiceData))
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {id, total_quantity, total_money, sale_date, payment_type} = rows[0];
                    purchasingInvoice.invoice_id = id;
                    purchasingInvoice.sale_date = sale_date;
                    purchasingInvoice.quantity = total_quantity;
                    purchasingInvoice.total_money = total_money;
                    purchasingInvoice.payment_type = payment_type;
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

            const deleteProducts = [];
            listProducts.forEach((product) => {
                if (product.id !== -1) {
                    promises.push(this.productService.addOrUpdateProduct(product))
                } else {
                    deleteProducts.push(product);
                }
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

                    if (notEmpty(deleteProducts)) {
                        const deleteProductPromise = [];
                        deleteProducts.forEach((product) => {
                            deleteProductPromise.push(this._deleteProduct(product));
                        })
                        return Promise.all(deleteProductPromise).then((r) => {
                            return purchasingInvoice;
                        })
                            .catch(e => {
                                throw e;
                            })
                    } else {
                        return purchasingInvoice;
                    }
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

    _deleteProduct(product = null) {
        if (notEmpty(product)) {
            const {imei} = product;
            return this.pool.query(`DELETE
                                    FROM ${DATA_TABLES.PRODUCT}
                                    WHERE imei = $1`, [imei]);
        } else {
            return Promise.resolve(null);
        }
    }

    _addOrUpdateProduct(product) {
        if (notEmpty(product.imei)) {
            if (isEmpty(product.display_order)) {
                product.display_order = 0;
            }

            const {imei} = product;
            let isNewProduct = false;

            return this.pool.query(`SELECT *
                                    FROM ${DATA_TABLES.PRODUCT}
                                    WHERE imei = $1`, [imei])
                .then(({rows}) => {
                    let productQuery = ``;
                    let productParams = {
                        name: product.name,
                        imei: product.imei,
                        color: product.color,
                        status: product.status,
                        product_group_id: product.product_group_id,
                        display_order: product.display_order,
                    };
                    let productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                               SET quantity = $1,
                                                   price    = $2
                                               WHERE product_id = $3
                                                 AND position = $4
                                               RETURNING *;`;
                    let productStorageParams = {
                        quantity: product.quantity,
                        price: +product.price,
                        id: null,
                        position: product.position,
                    };
                    if (rows.length > 0) {
                        const {id} = rows[0];
                        // Exists product with imei

                        // Update product data:
                        productQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                        SET name             = $1,
                                            imei             = $2,
                                            color            = $3,
                                            status           = $4,
                                            product_group_id = $5,
                                            display_order    = $6
                                        WHERE id = ${id}
                                        RETURNING *;`

                        if (isEmpty(product.id)) {
                            // New product invoice: update increase quantity
                            productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                   SET quantity = quantity + $1,
                                                       price    = $2
                                                   WHERE product_id = $3
                                                     AND position = $4
                                                   RETURNING *;`;
                        }
                    } else {
                        if (isEmpty(product.id)) {
                            productQuery = `INSERT INTO ${DATA_TABLES.PRODUCT} (name, imei, color, status, product_group_id, display_order)
                                            VALUES ($1, $2, $3, $4, $5, $6)
                                            RETURNING *;`;
                        }
                    }

                    return this.pool.query(productQuery, Object.values(productParams))
                        .then(({rows}) => {
                            const {id} = rows[0];
                            productStorageParams.id = id;
                            return this.pool.query(productStorageQuery, Object.values(productStorageParams))
                                .then(({rows}) => {
                                    if (rows.length > 0) {
                                        const {product_id, quantity, price} = rows[0];
                                        product.id = product_id;
                                        return {
                                            product,
                                            purchasing_quantity: quantity,
                                            purchasing_price: price
                                        };
                                    } else {
                                        // In-case can not update productStorage, Insert new one.
                                        productStorageParams = {
                                            product_id: id,
                                            quantity: product.quantity,
                                            price: +product.price,
                                            position: product.position,
                                            source: product.source,
                                        }

                                        productStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                               VALUES ($1, $2, $3, $4, $5)
                                                               RETURNING *;`;
                                        return this.pool.query(productStorageQuery, Object.values(productStorageParams))
                                            .then(({rows}) => {
                                                const {product_id, quantity, price} = rows[0];
                                                product.id = product_id;
                                                return {
                                                    product,
                                                    purchasing_quantity: quantity,
                                                    purchasing_price: price
                                                };
                                            })
                                            .catch(e => {
                                                throw e
                                            })
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

    _processPaymentDetail(purchasingInvoice = PURCHASING_INVOICE, payment_info) {
        const {payment_type, payment_detail, payment_create_date} = payment_info;
        const {customer} = purchasingInvoice;
        if (notEmpty(payment_type)) {
            const {invoice_id, total_money} = purchasingInvoice;
            const quanlichiParam = {
                sotien: total_money,
                ngaytao: payment_create_date,
                mucdich: `Đơn Thu Mua ${customer.name_vietnamese}`,
                hinhthucthanhtoan: payment_type,
                vitri: PRODUCT_SOURCE.SHOP_JP,
                invoice_id
            }
            if (payment_type === PAYMENT_TYPE.CASH) {
                return this.pool.query(`UPDATE quanlychi
                                        SET sotien            = $1,
                                            ngaytao           = $2,
                                            mucdich           = $3,
                                            hinhthucthanhtoan = $4,
                                            vitri             = $5,
                                            invoice_id        = $6
                                        WHERE invoice_id = ${invoice_id}
                                        RETURNING *;`, Object.values(quanlichiParam))
                    .then(({rows}) => {
                        if (rows.length === 0) {
                            return this.pool.query(`INSERT INTO quanlychi (sotien, ngaytao, mucdich, hinhthucthanhtoan, vitri, invoice_id)
                                                    VALUES ($1, $2, $3, $4, $5,
                                                            $6)
                                                    RETURNING *;`, Object.values(quanlichiParam))
                                .then(({rows}) => {
                                    return purchasingInvoice;
                                })
                                .catch(e => {
                                    throw e
                                })
                        } else {
                            return purchasingInvoice;
                        }
                    })
                    .catch(e => {
                        throw e
                    })
            } else {
                const promises = [];
                promises.push(
                    this.pool.query(`UPDATE quanlychi
                                     SET sotien            = $1,
                                         ngaytao           = $2,
                                         mucdich           = $3,
                                         hinhthucthanhtoan = $4,
                                         vitri             = $5,
                                         invoice_id        = $6
                                     WHERE invoice_id = ${invoice_id}
                                     RETURNING *;`, Object.values(quanlichiParam))
                        .then(({rows}) => {
                            if (rows.length === 0) {
                                return this.pool.query(`INSERT INTO quanlychi (sotien, ngaytao, mucdich, hinhthucthanhtoan, vitri, invoice_id)
                                                        VALUES ($1, $2, $3, $4, $5,
                                                                $6)
                                                        RETURNING *;`, Object.values(quanlichiParam))
                                    .then(({rows}) => {
                                        return purchasingInvoice;
                                    })
                                    .catch(e => {
                                        throw e
                                    })
                            } else {
                                return purchasingInvoice;
                            }
                        })
                        .catch(e => {
                            throw e
                        })
                )

                const paymentDetail = {
                    invoice_id,
                    invoice_code: payment_detail.invoice_code,
                    bank_id: payment_detail.bank_id,
                    bank_name: payment_detail.bank_name,
                    branch_name: payment_detail.branch_name,
                    account_name: payment_detail.account_name,
                    payment_method: payment_detail.payment_method,
                }

                promises.push(
                    this.pool.query(`UPDATE ${DATA_TABLES.INVOICE_PAYMENT}
                                     SET invoice_id     = $1,
                                         invoice_code   = $2,
                                         bank_id        = $3,
                                         bank_name      = $4,
                                         branch_name    = $5,
                                         account_name   = $6,
                                         payment_method = $7
                                     WHERE invoice_id = ${invoice_id}
                                     RETURNING *;`, Object.values(paymentDetail))
                        .then(({rows}) => {
                            if (rows.length === 0) {
                                return this.pool.query(`INSERT INTO ${DATA_TABLES.INVOICE_PAYMENT} (invoice_id,
                                                                                                    invoice_code,
                                                                                                    bank_id, bank_name,
                                                                                                    branch_name,
                                                                                                    account_name,
                                                                                                    payment_method)
                                                        VALUES ($1, $2, $3, $4, $5, $6,
                                                                $7)
                                                        RETURNING *;`, Object.values(paymentDetail))
                                    .then(({rows}) => {
                                        return purchasingInvoice;
                                    })
                                    .catch(e => {
                                        throw e
                                    })
                            } else {
                                return purchasingInvoice;
                            }
                        })
                        .catch(e => {
                            throw e
                        })
                )

                return Promise.all(promises)
                    .then((r) => {
                        return purchasingInvoice;
                    })
                    .catch(e => {
                        throw e
                    })
            }
        } else {
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
                quantity: product.quantity,
                price: product.price
                // imei: product.imei //tri update imei
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
                                              SELECT ${invoice_id},
                                                     ${product.id},
                                                     $1,
                                                     $2
                                              WHERE NOT EXISTS(
                                                      SELECT invoice_id, product_id
                                                      FROM ${DATA_TABLES.INVOICE_DETAIL}
                                                      WHERE invoice_id = ${invoice_id}
                                                        AND product_id = ${product.id});`
            promises.push(this.pool.query(insertInvoiceDetailQuery, Object.values(invoiceDetailParams)));

        });

        promises.push(
            this.pool.query(`SELECT *
                             FROM ${DATA_TABLES.PURCHASING_DETAIL}
                             WHERE invoice_id = $1;`, [invoice_id])
                .then(({rows}) => {
                    if (rows.length === 0) {
                        return this.pool.query(`INSERT INTO ${DATA_TABLES.PURCHASING_DETAIL}
                                                SELECT $1,
                                                       $2
                                                WHERE NOT EXISTS(
                                                        SELECT invoice_id, customer_id
                                                        FROM ${DATA_TABLES.PURCHASING_DETAIL}
                                                        WHERE invoice_id = $1
                                                          AND customer_id = $2);`, Object.values({
                            invoice_id,
                            customer_id: purchasingInvoice.customer.id
                        }))
                    } else {
                        return this.pool.query(`UPDATE ${DATA_TABLES.PURCHASING_DETAIL}
                                                SET customer_id = $1
                                                WHERE invoice_id = $2`, [purchasingInvoice.customer.id, invoice_id])
                    }
                })
                .catch(e => {
                    throw e
                })
        );

        return Promise.all(promises).then(r => {
            purchasingInvoice.products = listProducts;
            return purchasingInvoice;
        }).catch(e => {
            throw e;
        });
    }

    _processPurchasingProduct(productData = null, is_new_invoice = false) {
        if (notEmpty(productData)) {
            if (isEmpty(productData.display_order)) {
                productData.display_order = 0;
            }
            let is_duplicate = false;
            const {imei, position, name, color, status, product_group_id, display_order, quantity, price, source} = productData;
            return this.productService.getProductInfo(imei, position)
                .then((productInfo) => {
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
                                                 AND position = $4
                                               RETURNING *;`;
                    let productStorageParams = {
                        quantity: quantity,
                        price: +productData.price, //Trick to convert string to number
                        product_id: null,
                        position: position,
                    };

                    if (notEmpty(productInfo)) {
                        // Exists product with imei

                        // Enrich product_id for product_storage
                        productStorageParams.product_id = productInfo.id;

                        // Setup product query for update
                        productQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                        SET name             = $1,
                                            imei             = $2,
                                            color            = $3,
                                            status           = $4,
                                            product_group_id = $5,
                                            display_order    = $6
                                        WHERE id = ${productInfo.id}
                                        RETURNING *;`;

                        if (notEmpty(productInfo.position)) {
                            // Update product_storage
                            // If duplicate imei, status, price: increase product quantity
                            if (notEmpty(productInfo.price) && status === productInfo.status && price === productInfo.price) {
                                is_duplicate = true;
                                productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                       SET quantity = quantity + $1,
                                                           price    = $2
                                                       WHERE product_id = $3
                                                         AND position = $4
                                                       RETURNING *;`;
                            } else {
                                productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                       SET quantity = $1,
                                                           price    = $2
                                                       WHERE product_id = $3
                                                         AND position = $4
                                                       RETURNING *;`;
                            }
                        } else {
                            // productInfo.position is empty, this is a new product_storage insert it
                            productStorageParams = {
                                product_id: null,
                                quantity: productStorageParams.quantity,
                                price: productStorageParams.price,
                                position: productStorageParams.position,
                                source
                            }
                            productStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                   VALUES ($1, $2, $3, $4, $5)
                                                   RETURNING *;`;
                        }
                    } else {
                        // In-case: Not found product by imei it could be a new product or update imei number
                        if (isEmpty(productData.id)) {
                            productQuery = `INSERT INTO ${DATA_TABLES.PRODUCT} (name, imei, color, status, product_group_id, display_order)
                                            VALUES ($1, $2, $3, $4, $5, $6)
                                            RETURNING *;`;

                            productStorageParams = {
                                product_id: null,
                                quantity: productStorageParams.quantity,
                                price: productStorageParams.price,
                                position: productStorageParams.position,
                                source
                            }
                            productStorageQuery = `INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                   VALUES ($1, $2, $3, $4, $5)
                                                   RETURNING *;`;
                        } else {
                            productQuery = `UPDATE ${DATA_TABLES.PRODUCT}
                                        SET name             = $1,
                                            imei             = $2,
                                            color            = $3,
                                            status           = $4,
                                            product_group_id = $5,
                                            display_order    = $6
                                        WHERE id = ${productData.id}
                                        RETURNING *;`;
                            productStorageQuery = `UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                                   SET quantity = $1,
                                                       price    = $2
                                                   WHERE product_id = $3
                                                     AND position = $4
                                                   RETURNING *;`;
                        }
                    }

                    return this.pool.query(productQuery, Object.values(productParams))
                        .then(({rows}) => {
                            const {id} = rows[0];
                            if (isEmpty(productStorageParams.product_id)) {
                                productStorageParams.product_id = id;
                            }

                            return this.pool.query(productStorageQuery, Object.values(productStorageParams))
                                .then(({rows}) => {
                                    if (rows.length > 0) {
                                        const {product_id, quantity, price} = rows[0];
                                        if (isEmpty(productData.id)) {
                                            productData.id = product_id;
                                        }
                                        return {
                                            product: productData,
                                            purchasing_quantity: quantity,
                                            purchasing_price: price,
                                            is_duplicate
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
    InvoicingService
}
