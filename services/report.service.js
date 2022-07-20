const {DATA_TABLES} = require("../constants/data.constant");
const {PRODUCT_SOURCE} = require("../constants/common.constant");

class ReportService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    sellingInvoiceReport(invoiceId = 0, position = PRODUCT_SOURCE.SHOP_JP) {
        return Promise.all([
            this._sellingInvoiceReportHeaderAndSummary(invoiceId),
            this._sellingInvoiceReportData(invoiceId, position)
        ])
            .then(([headerAndSummary, products]) => {
                const {
                    madonhang,
                    ngayban,
                    giatien,
                    tenkhachhang
                } = headerAndSummary;
                return {
                    reportHeader: {
                        madonhang,
                        ngayban,
                        tenkhachhang,
                    },
                    position,
                    summary: {
                        giatien
                    },
                    products
                }
            })
            .catch(e => {
                throw e;
            })
    }

    _sellingInvoiceReportHeaderAndSummary(invoiceId = 0) {
        const sellingDetailQuery = `SELECT *
                                    FROM danhsachdonhang
                                    WHERE madonhang = ($1)
                                    LIMIT 1;`;
        return this.pool.query(sellingDetailQuery, [invoiceId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {madonhang, ngayban, giatien, tenkhachhang} = rows[0];
                    return {
                        madonhang,
                        ngayban,
                        giatien,
                        tenkhachhang
                    }
                }
                return null;
            })
            .catch(e => {
                console.log('>>>> e: ', e.message);
                throw e;
            })
    }

    _sellingInvoiceReportData(invoiceId = 0, position = PRODUCT_SOURCE.SHOP_JP) {
        const sellingInvoiceDataQuery = `select p.tensanpham, p.giatien, p.soluong, p.thoihanbaohanh, p.imei
                                         from danhsachdonhang
                                                  inner join danhsachsanphamdaban p
                                                             on danhsachdonhang.transactionkey = p.transactionkey
                                                  inner join product on p.productid = Cast(product.id as varchar)
                                         where danhsachdonhang.vitri = ($1)
                                           and madonhang = ($2)
                                         order by madonhang DESC;`;
        return this.pool.query(sellingInvoiceDataQuery, [position, invoiceId])
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

    kaiPurchasingInvoiceReport(invoiceId = 0) {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.PURCHASING_DETAIL}
                                WHERE invoice_id = ${invoiceId}
                                LIMIT 1;`)
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {invoice_id, customer_id} = rows[0];
                    return Promise.all([
                        this._kaiPurchasingInvoiceReportHeader(customer_id),
                        this._kaiPurchasingInvoiceReportSummary(invoice_id),
                        this._kaiPurchasingInvoiceReportData(invoice_id)
                    ])
                        .then(([reportHeader, summary, products]) => {
                            return {
                                reportHeader,
                                summary,
                                products
                            }
                        })
                        .catch(e => {
                            throw e;
                        })
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    kaiPurchasingInvoiceReportTransferPayment(invoiceId = 0) {
        return this.pool.query(`SELECT *
                                FROM ${DATA_TABLES.PURCHASING_DETAIL}
                                WHERE invoice_id = ${invoiceId}
                                LIMIT 1;`)
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {invoice_id, customer_id} = rows[0];
                    return Promise.all([
                        this._kaiPurchasingInvoiceReportHeader(customer_id),
                        this._kaiPurchasingInvoiceReportSummary(invoice_id),
                        this._kaiPurchasingInvoiceReportData(invoice_id),
                        this._kaiPurchasingInvoiceReportPaymentDetail(invoice_id)
                    ])
                        .then(([reportHeader, summary, products, paymentDetail]) => {
                            return {
                                reportHeader,
                                summary,
                                products,
                                paymentDetail
                            }
                        })
                        .catch(e => {
                            throw e;
                        })
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    _kaiPurchasingInvoiceReportPaymentDetail(invoiceId = 0) {
        const paymentDetailSql = `SELECT *
                                  FROM ${DATA_TABLES.INVOICE_PAYMENT}
                                  WHERE invoice_id = $1
                                  LIMIT 1;`;
        return this.pool.query(paymentDetailSql, [invoiceId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {
                        invoice_id,
                        invoice_code,
                        bank_id,
                        bank_name,
                        branch_name,
                        account_name,
                        payment_method
                    } = rows[0];
                    return {
                        invoice_id,
                        invoice_code,
                        bank_id,
                        bank_name,
                        branch_name,
                        account_name,
                        payment_method
                    }
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    _kaiPurchasingInvoiceReportHeader(customerId = 0) {
        const customerDataSql = `SELECT *
                                 FROM ${DATA_TABLES.CUSTOMER}
                                 WHERE id = $1`;
        return this.pool.query(customerDataSql, [customerId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {job, phone, address, birthday, name_japanese, name_vietnamese} = rows[0];
                    return {
                        name_japanese,
                        name_vietnamese,
                        job,
                        phone,
                        address,
                        birthday
                    }
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    _kaiPurchasingInvoiceReportSummary(invoiceId = 0) {
        const invoiceSummarySql = `SELECT reportSummary.*,
                                          i.sale_date
                                   FROM invoice i,
                                        (SELECT pd.invoice_id,
                                                SUM(id.quantity) AS quantity,
                                                SUM(id.price)    AS total_money
                                         FROM purchasing_detail pd,
                                              invoice_detail id,
                                              invoice i,
                                              product p
                                         WHERE i.id = id.invoice_id
                                           AND i.id = pd.invoice_id
                                           AND p.id = id.product_id
                                         GROUP BY pd.invoice_id
                                         HAVING pd.invoice_id = $1) reportSummary
                                   WHERE reportSummary.invoice_id = i.id
                                   LIMIT 1`;
        return this.pool.query(invoiceSummarySql, [invoiceId])
            .then(({rows}) => {
                if (rows.length > 0) {
                    const {invoice_id, quantity, total_money, sale_date} = rows[0];
                    return {sale_date, invoice_id, quantity: parseInt(quantity), total_money: parseInt(total_money)}
                }
                return null;
            })
            .catch(e => {
                throw e;
            })
    }

    _kaiPurchasingInvoiceReportData(invoiceId = 0) {
        const invoiceReportDataQuery = `SELECT p.id,
                                               p.name,
                                               p.imei,
                                               p.color,
                                               p.status,
                                               id.quantity,
                                               id.price
                                        FROM product p,
                                             purchasing_detail pd,
                                             invoice_detail id,
                                             invoice i
                                        WHERE i.id = id.invoice_id
                                          AND i.id = pd.invoice_id
                                          AND p.id = id.product_id
                                          AND pd.invoice_id = $1
                                        ORDER BY p.display_order ASC;`;
        return this.pool.query(invoiceReportDataQuery, [invoiceId])
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

}

module.exports = {
    ReportService
}
