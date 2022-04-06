const {REPORT_TYPE, INVOICE_STATUS, INVOICE_TYPE} = require("../constants/common.constant");
const {DATA_TABLES} = require("../constants/data.constant");

class StatisticsService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    getKaiStatistics(type = REPORT_TYPE.MONTH, fromDate = null, toDate = null) {
        const promises = [];
        switch (type) {
            case REPORT_TYPE.DATE_RANGE:
                promises.push(this._kaiInvoiceStatisticsByDates(fromDate, toDate))
                promises.push(this._kaiOrderStatisticsByDates(fromDate, toDate))
                break;
            case REPORT_TYPE.MONTH:
            default:
                promises.push(this._kaiInvoiceStatisticsByMonth(fromDate, toDate))
                promises.push(this._kaiOrderStatisticsByMonth(fromDate, toDate))
                break;
        }

        return Promise.all(promises)
            .then(([purchasing_statistics, for_sale_statistics]) => {
                return {
                    purchasing_statistics,
                    for_sale_statistics
                }
            });
    }

    _kaiOrderStatisticsByDates(fromDate, toDate) {
        const queryString = `SELECT d.date as sale_date,
                                    CASE WHEN data.quantity IS NULL THEN 0 ELSE data.quantity END,
                                    CASE WHEN data.total_money IS NULL THEN 0 ELSE data.total_money END
                             FROM (select CURRENT_DATE + i as date
                                   FROM generate_series(date '${fromDate}' - CURRENT_DATE,
                                                        date '${toDate}' - CURRENT_DATE) i) d
                                      LEFT JOIN (SELECT sale_date,
                                                        sum(total_quantity) as quantity,
                                                        sum(total_money)    as total_money
                                                 FROM ${DATA_TABLES.INVOICE}
                                                 WHERE status = '${INVOICE_STATUS.COMPLETED}'
                                                   AND type = '${INVOICE_TYPE.FOR_SALE}'
                                                   AND sale_date >= '${fromDate}'
                                                   AND sale_date <= '${toDate}'
                                                 GROUP BY sale_date) data ON d.date = data.sale_date`;
        return this.pool.query(queryString)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

    _kaiOrderStatisticsByMonth(fromDate, toDate) {
        const queryString = `SELECT date.dateyear as year_date,
                                    date.datemonth as month_date,
                                    CASE WHEN data.quantity IS NULL THEN 0 ELSE data.quantity END,
                                    CASE WHEN data.total_money IS NULL THEN 0 ELSE data.total_money END
                             FROM (select DISTINCT EXTRACT(YEAR FROM CURRENT_DATE + i)  as dateyear,
                                                   EXTRACT(MONTH FROM CURRENT_DATE + i) as datemonth
                                   FROM generate_series(date '${fromDate}' - CURRENT_DATE, date '${toDate}' -
                                                                                           CURRENT_DATE) i) date
                                      LEFT JOIN (SELECT EXTRACT(YEAR FROM sale_date)  as dateyear,
                                                        EXTRACT(MONTH FROM sale_date) as datemonth,
                                                        sum(total_quantity)           as quantity,
                                                        sum(total_money)              as total_money
                                                 FROM ${DATA_TABLES.INVOICE}
                                                 WHERE status = '${INVOICE_STATUS.COMPLETED}'
                                                   AND type = '${INVOICE_TYPE.FOR_SALE}'
                                                   AND EXTRACT(YEAR FROM sale_date) >=
                                                       EXTRACT(YEAR FROM TIMESTAMP '${fromDate}')
                                                   AND EXTRACT(MONTH FROM sale_date) >=
                                                       EXTRACT(MONTH FROM TIMESTAMP '${fromDate}')
                                                   AND EXTRACT(YEAR FROM sale_date) <=
                                                       EXTRACT(YEAR FROM TIMESTAMP '${toDate}')
                                                   AND EXTRACT(MONTH FROM sale_date) <=
                                                       EXTRACT(MONTH FROM TIMESTAMP '${toDate}')
                                                 GROUP BY dateyear, datemonth
                                                 ORDER BY EXTRACT(YEAR FROM sale_date), EXTRACT(MONTH FROM sale_date)) as data
                                                on date.dateyear = data.dateyear AND data.datemonth = date.datemonth`;
        return this.pool.query(queryString)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

    _kaiInvoiceStatisticsByDates(fromDate, toDate) {
        const queryString = `SELECT d.date as sale_date,
                                    CASE WHEN data.quantity IS NULL THEN 0 ELSE data.quantity END,
                                    CASE WHEN data.total_money IS NULL THEN 0 ELSE data.total_money END
                             FROM (select CURRENT_DATE + i as date
                                   FROM generate_series(date '${fromDate}' - CURRENT_DATE,
                                                        date '${toDate}' - CURRENT_DATE) i) d
                                      LEFT JOIN (SELECT sale_date,
                                                        sum(total_quantity) as quantity,
                                                        sum(total_money)    as total_money
                                                 FROM ${DATA_TABLES.INVOICE}
                                                 WHERE type = '${INVOICE_TYPE.PURCHASING}'
                                                   AND status = '${INVOICE_STATUS.COMPLETED}'
                                                   AND sale_date >= '${fromDate}'
                                                   AND sale_date <= '${toDate}'
                                                 GROUP BY sale_date) data ON d.date = data.sale_date`;
        return this.pool.query(queryString)
            .then(({rows}) => rows)
            .catch(e => {
                throw e
            });
    }

    _kaiInvoiceStatisticsByMonth(fromDate, toDate) {
        const statisticByMonthQuery = `SELECT date.dateyear as year_date,
                                              date.datemonth as month_date,
                                              CASE WHEN data.quantity IS NULL THEN 0 ELSE data.quantity END,
                                              CASE WHEN data.total_money IS NULL THEN 0 ELSE data.total_money END
                                       FROM (select DISTINCT EXTRACT(YEAR FROM CURRENT_DATE + i)  as dateyear,
                                                             EXTRACT(MONTH FROM CURRENT_DATE + i) as datemonth
                                             FROM generate_series(date '${fromDate}' - CURRENT_DATE, date '${toDate}' -
                                                                                                     CURRENT_DATE) i) date
                                                LEFT JOIN (SELECT EXTRACT(YEAR FROM sale_date)  as dateyear,
                                                                  EXTRACT(MONTH FROM sale_date) as datemonth,
                                                                  sum(total_quantity)           as quantity,
                                                                  sum(total_money)              as total_money
                                                           FROM ${DATA_TABLES.INVOICE}
                                                           WHERE type = '${INVOICE_TYPE.PURCHASING}'
                                                             AND status = '${INVOICE_STATUS.COMPLETED}'
                                                             AND EXTRACT(YEAR FROM sale_date) >=
                                                                 EXTRACT(YEAR FROM TIMESTAMP '${fromDate}')
                                                             AND EXTRACT(MONTH FROM sale_date) >=
                                                                 EXTRACT(MONTH FROM TIMESTAMP '${fromDate}')
                                                             AND EXTRACT(YEAR FROM sale_date) <=
                                                                 EXTRACT(YEAR FROM TIMESTAMP '${toDate}')
                                                             AND EXTRACT(MONTH FROM sale_date) <=
                                                                 EXTRACT(MONTH FROM TIMESTAMP '${toDate}')
                                                           GROUP BY dateyear, datemonth
                                                           ORDER BY EXTRACT(YEAR FROM sale_date), EXTRACT(MONTH FROM sale_date)) as data
                                                          on date.dateyear = data.dateyear AND data.datemonth = date.datemonth`;
        return this.pool.query(statisticByMonthQuery)
            .then(({rows}) => rows)
            .catch(e => {
                throw e;
            })
    }

}

module.exports = {
    StatisticsService
}
