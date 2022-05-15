const {notEmpty} = require("../utils/data.utils");
const {DATA_TABLES, PRODUCT} = require("../constants/data.constant");
const {PRODUCT_SOURCE, TRANSFER_STATUS, INVOICE_STATUS} = require("../constants/common.constant");

class TransferringService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    getOutgoingProducts(source = PRODUCT_SOURCE.KAI, statuses = [TRANSFER_STATUS.PROCESSING]) {
        const transfer_status = statuses.map(x => `'${x}'`).join(',');
        let getIncomingProductsQuery = `SELECT p.id    as product_id,
                                               p.name,
                                               p.color,
                                               p.status,
                                               td.quantity,
                                               td.transfer_price as price,
                                               ip.imei,
                                               ip.transfer_status,
                                               ip.to_position,
                                               ip.transfer_date,
                                               ip.invoice_id,
                                               pg.name as group_name
                                        FROM ${DATA_TABLES.PRODUCT} p,
                                             ${DATA_TABLES.PRODUCT_GROUP} pg,
                                             ${DATA_TABLES.TRANSFER_DETAIL} td,
                                             (SELECT p.imei,
                                                     td.transfer_status,
                                                     td.to_position,
                                                     td.transfer_date,
                                                     td.invoice_id
                                              FROM ${DATA_TABLES.PRODUCT} p,
                                                   ${DATA_TABLES.TRANSFER_DETAIL} td
                                              WHERE td.product_id = p.id
                                                AND td.from_position = $1
                                                AND td.transfer_status IN (${transfer_status})
                                              GROUP BY p.imei, td.transfer_status, td.to_position, td.transfer_date,
                                                       td.invoice_id) ip
                                        WHERE p.imei = ip.imei
                                          AND td.invoice_id = ip.invoice_id
                                          AND td.product_id = p.id
                                          AND p.product_group_id = pg.id
                                        ORDER BY ip.transfer_date ASC;`;
        return this.pool.query(getIncomingProductsQuery, [source])
            .then(({rows}) => {
                return rows;
            })
            .catch(e => {
                throw e
            })

    }

    getTransferringProducts(source = PRODUCT_SOURCE.KAI, statuses = [TRANSFER_STATUS.TRANSFERRING]) {
        const transfer_status = statuses.map(x => `'${x}'`).join(',');
        let getTransferringProductsQuery = `SELECT p.id    as product_id,
                                                   p.name,
                                                   p.color,
                                                   p.status,
                                                   td.quantity,
                                                   td.transfer_price as price,
                                                   ip.imei,
                                                   ip.transfer_status,
                                                   ip.from_position,
                                                   ip.transfer_date,
                                                   ip.invoice_id,
                                                   pg.name as group_name
                                            FROM ${DATA_TABLES.PRODUCT} p,
                                                 ${DATA_TABLES.PRODUCT_GROUP} pg,
                                                 ${DATA_TABLES.TRANSFER_DETAIL} td,
                                                 (SELECT p.imei,
                                                         td.transfer_status,
                                                         td.from_position,
                                                         td.transfer_date,
                                                         td.invoice_id
                                                  FROM ${DATA_TABLES.PRODUCT} p,
                                                       ${DATA_TABLES.TRANSFER_DETAIL} td
                                                  WHERE td.product_id = p.id
                                                    AND td.to_position = $1
                                                    AND td.transfer_status IN (${transfer_status})
                                                  GROUP BY p.imei, td.transfer_status, td.from_position,
                                                           td.transfer_date,
                                                           td.invoice_id) ip
                                            WHERE p.imei = ip.imei
                                              AND td.invoice_id = ip.invoice_id
                                              AND td.product_id = p.id
                                              AND p.product_group_id = pg.id
                                            ORDER BY ip.transfer_date ASC;`;
        return this.pool.query(getTransferringProductsQuery, [source])
            .then(({rows}) => rows)
            .catch(e => {
                throw e
            })
    }

    getTransferredProducts(source = PRODUCT_SOURCE.KAI, statuses = [TRANSFER_STATUS.TRANSFERRED]) {
        const transfer_status = statuses.map(x => `'${x}'`).join(',');
        let getTransferringProductsQuery = `SELECT p.id    as product_id,
                                                   p.name,
                                                   p.color,
                                                   p.status,
                                                   td.quantity,
                                                   td.transfer_price as price,
                                                   ip.imei,
                                                   ip.transfer_status,
                                                   ip.from_position,
                                                   ip.transfer_date,
                                                   ip.receive_date,
                                                   ip.invoice_id,
                                                   pg.name as group_name
                                            FROM ${DATA_TABLES.PRODUCT} p,
                                                 ${DATA_TABLES.PRODUCT_GROUP} pg,
                                                 ${DATA_TABLES.TRANSFER_DETAIL} td,
                                                 (SELECT p.imei,
                                                         td.transfer_status,
                                                         td.from_position,
                                                         td.transfer_date,
                                                         td.receive_date,
                                                         td.invoice_id
                                                  FROM ${DATA_TABLES.PRODUCT} p,
                                                       ${DATA_TABLES.TRANSFER_DETAIL} td
                                                  WHERE td.product_id = p.id
                                                    AND td.to_position = $1
                                                    AND td.transfer_status IN (${transfer_status})
                                                  GROUP BY p.imei, td.transfer_status, td.from_position,
                                                           td.transfer_date,
                                                           td.receive_date,
                                                           td.invoice_id) ip
                                            WHERE p.imei = ip.imei
                                              AND td.invoice_id = ip.invoice_id
                                              AND td.product_id = p.id
                                              AND p.product_group_id = pg.id
                                            ORDER BY ip.transfer_date ASC;`;

        return this.pool.query(getTransferringProductsQuery, [source])
            .then(({rows}) => rows)
            .catch(e => {
                throw e
            })
    }

    getNotFoundProducts(source = PRODUCT_SOURCE.KAI, statuses = [TRANSFER_STATUS.NOT_FOUND]) {
        const transfer_status = statuses.map(x => `'${x}'`).join(',');
        let getTransferringProductsQuery = `SELECT p.id    as product_id,
                                                   p.name,
                                                   p.color,
                                                   p.status,
                                                   td.quantity,
                                                   td.transfer_price as price,
                                                   ip.imei,
                                                   ip.transfer_status,
                                                   ip.from_position,
                                                   ip.transfer_date,
                                                   ip.invoice_id,
                                                   pg.name as group_name
                                            FROM ${DATA_TABLES.PRODUCT} p,
                                                 ${DATA_TABLES.TRANSFER_DETAIL} td,
                                                 ${DATA_TABLES.PRODUCT_GROUP} pg,
                                                 (SELECT p.imei,
                                                         td.transfer_status,
                                                         td.from_position,
                                                         td.transfer_date,
                                                         td.invoice_id
                                                  FROM ${DATA_TABLES.PRODUCT} p,
                                                       ${DATA_TABLES.TRANSFER_DETAIL} td
                                                  WHERE td.product_id = p.id
                                                    AND td.to_position = $1
                                                    AND td.transfer_status IN (${transfer_status})
                                                  GROUP BY p.imei, td.transfer_status, td.from_position,
                                                           td.transfer_date,
                                                           td.invoice_id) ip
                                            WHERE p.imei = ip.imei
                                              AND td.invoice_id = ip.invoice_id
                                              AND td.product_id = p.id
                                              AND p.product_group_id = pg.id
                                            ORDER BY ip.transfer_date ASC;`;

        return this.pool.query(getTransferringProductsQuery, [source])
            .then(({rows}) => rows)
            .catch(e => {
                throw e
            })
    }

    transferProducts(productData = []) {
        if (notEmpty(productData)) {
            const promises = [];
            productData.forEach((item) => {
                promises.push(
                    this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                     SET transfer_status = $1,
                                         transfer_date   = $2
                                     WHERE invoice_id = $3
                                       AND product_id = $4`, [TRANSFER_STATUS.TRANSFERRING, 'now()', item.invoice_id, item.product_id])
                )
            })
            return Promise.all(promises)
                .then((r) => {
                    return true;
                })
                .catch(e => {
                    throw e
                })
        } else {
            return Promise.resolve(false);
        }
    }

    transferProduct(invoiceId = null, productId = null, isLost = false) {
        const transfer_status = notEmpty(isLost) && isLost ? TRANSFER_STATUS.NOT_FOUND : TRANSFER_STATUS.TRANSFERRING;
        return this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                SET transfer_status = $1,
                                    transfer_date   = $2
                                WHERE invoice_id = $3
                                  AND product_id = $4`, [transfer_status, 'now()', invoiceId, productId])
            .then(({rows}) => {
                return {invoice_id: invoiceId, product_id: productId}
            })
            .catch(e => {
                throw e
            })
    }

    receiveTransferProduct(invoiceId = null, productId = null, transferQuantity = null) {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.TRANSFER_DETAIL}
                                WHERE invoice_id = $1
                                  AND product_id = $2
                                  AND transfer_status IN (${[TRANSFER_STATUS.TRANSFERRING, TRANSFER_STATUS.NOT_FOUND].map(x => `'${x}'`).join(',')})`, [invoiceId, productId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {quantity, from_position, to_position, price, transfer_price} = rows[0];
                    let updateTransferDetailQuery = '';
                    let updateTransferDetailQueryParams = null;
                    if (transferQuantity < quantity && notEmpty(transferQuantity)) {
                        updateTransferDetailQuery = `UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                                     SET quantity     = $1,
                                                         receive_date = $2
                                                     WHERE invoice_id = $3
                                                       AND product_id = $4`;
                        updateTransferDetailQueryParams = {
                            quantity: quantity - transferQuantity,
                            receive_date: 'now()',
                            invoiceId,
                            productId
                        }

                    } else {
                        transferQuantity = quantity;
                        updateTransferDetailQuery = `UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                                     SET transfer_status = $1,
                                                         receive_date    = $2
                                                     WHERE invoice_id = $3
                                                       AND product_id = $4`;
                        updateTransferDetailQueryParams = {
                            transfer_status: TRANSFER_STATUS.TRANSFERRED,
                            transfer_date: 'now()',
                            invoiceId,
                            productId
                        }
                    }

                    return Promise.all([
                        this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                         SET quantity = quantity + $1,
                                             price    = $4
                                         WHERE product_id = $2
                                           AND position = $3 RETURNING *;`, [transferQuantity, productId, to_position, transfer_price])
                            .then(({rows}) => {
                                if (rows.length === 0) {
                                    // In-case can not update we will insert new one
                                    return this.pool.query(`INSERT INTO ${DATA_TABLES.PRODUCT_STORAGE} (product_id, quantity, price, position, source)
                                                            VALUES ($1, $2, $3, $4,
                                                                    $5) RETURNING *`, [productId, transferQuantity, transfer_price, to_position, from_position])
                                        .then(({rows}) => rows[0])
                                        .catch(e => {
                                            throw e
                                        })
                                } else {
                                    return Promise.resolve(true)
                                }
                            }),
                        this.pool.query(updateTransferDetailQuery, Object.values(updateTransferDetailQueryParams)),
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
                                                      AND status = '${INVOICE_STATUS.PROCESSING}' RETURNING *;`, [invoiceId])
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

    cancelTransferProduct(invoiceId = null, productId = null) {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.TRANSFER_DETAIL}
                                WHERE invoice_id = $1
                                  AND product_id = $2
                                  AND transfer_status IN (${[TRANSFER_STATUS.PROCESSING, TRANSFER_STATUS.TRANSFERRING].map(x => `'${x}'`).join(',')})`, [invoiceId, productId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {quantity, from_position, to_position, price} = rows[0];
                    const promises = [];

                    // Update transfer detail to CANCELED
                    promises.push(
                        this.pool.query(`UPDATE ${DATA_TABLES.TRANSFER_DETAIL}
                                         SET transfer_status = $1
                                         WHERE invoice_id = $2
                                           AND product_id = $3`, [TRANSFER_STATUS.CANCELED, invoiceId, productId])
                    )

                    // Increase storage quantity of product in from_position
                    promises.push(
                        this.pool.query(`UPDATE ${DATA_TABLES.PRODUCT_STORAGE}
                                         SET quantity = quantity + ${quantity}
                                         WHERE product_id = $1
                                           AND position = $2 RETURNING *;`, [productId, from_position])
                    )

                    return Promise.all(promises)
                        .then((r) => {
                            return this.pool.query(`UPDATE ${DATA_TABLES.INVOICE}
                                                    SET status = '${INVOICE_STATUS.TERMINATED}'
                                                    WHERE (SELECT count(*)
                                                           FROM ${DATA_TABLES.TRANSFER_DETAIL} tt
                                                           WHERE tt.invoice_id = $1
                                                             AND tt.transfer_status = '${TRANSFER_STATUS.PROCESSING}') =
                                                          0
                                                      AND id = $1
                                                      AND status = '${INVOICE_STATUS.PROCESSING}' RETURNING *;`, [invoiceId])
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

}

module.exports = {
    TransferringService
}
