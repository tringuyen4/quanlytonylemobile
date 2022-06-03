const ExcelJs = require('exceljs');
const {
    getAgeText,
    dateFormat,
    getJobText,
    getDeviceStatusText,
    priceWithFormat,
    getPaymentMethod
} = require("../utils/common.utils");
const {notEmpty} = require("../utils/data.utils");

const EXPORT_TEMPLATES = {
    INVOICE: './exports/invoice_template.xlsx',
    TRANSFER_PAYMENT_INVOICE: './exports/transfer_payment_invoice_template.xlsx'
}

const INVOICE_EXPORT_CELLS = {
    SALE_DATE: 'B2',
    JAPANESE_NAME: 'C5',
    VIETNAMESE_NAME: 'C6',
    BIRTHDAY: 'E5',
    PHONE: 'E6',
    AGE: 'G5',
    JOB: 'G7',
    ADDRESS: 'C7',

    PAYMENT_INVOICE_CODE: 'C9',
    PAYMENT_BANK_NAME: 'C10',
    PAYMENT_PAYMENT_METHOD: 'D10',
    PAYMENT_BRANCH_NAME: 'C11',
    PAYMENT_BANK_ID: 'F10',
    PAYMENT_ACCOUNT_NAME: 'F11',

    MOBILE_TABLE_START_ROW: 11,
    PRODUCT_TABLE_START_ROW: 13,
    NO_COLUMN: 'A',
    MOBILE_NAME_COLUMN: 'B',
    MOBILE_NAME_ALTER_COLUMN: 'C',
    MOBILE_COLOR_COLUMN: 'D',
    MOBILE_STATUS_COLUMN: 'E',
    MOBILE_IMEI_COLUMN: 'F',
    MOBILE_PRICE_COLUMN: 'G',
    MOBILE_PRICE_ALTER_COLUMN: 'H',
    SUMMARY_QUANTITY_COLUMN: 'F',
    SUMMARY_MONEY_COLUMN: 'G',
}


class ExportService {
    constructor() {
    }

    /**
     * Invoice Report
     * @param reportDetail
     * @return {Promise<Buffer>}
     */
    async invoiceReport(reportDetail) {
        let invoiceTemplate = await this._readTemplate(EXPORT_TEMPLATES.INVOICE);
        const {reportHeader, summary, products} = reportDetail;
        // Write fixed heading
        invoiceTemplate = this._writeInvoiceReportHeader(invoiceTemplate, reportHeader);
        // Write devices list
        invoiceTemplate = this._writeInvoiceReportItems(invoiceTemplate, products);
        // Write the summary values
        const summaryRowIndex = INVOICE_EXPORT_CELLS.MOBILE_TABLE_START_ROW + (notEmpty(products) ? products.length : 1);
        invoiceTemplate = this._writeInvoiceReportSummary(invoiceTemplate, summary, summaryRowIndex);
        // Write workbook as a arrayBuffer
        return invoiceTemplate.xlsx.writeBuffer().then((buffer) => buffer).catch((e) => {
            console.log('>>> ExportService:invoiceReport Error: ', e);
        });
    }


    async invoiceReportTransferPayment(reportDetail) {
        let invoiceTemplate = await this._readTemplate(EXPORT_TEMPLATES.TRANSFER_PAYMENT_INVOICE);
        const {reportHeader, summary, products, paymentDetail} = reportDetail;
        // Write fixed heading
        invoiceTemplate = this._writeInvoiceReportHeader(invoiceTemplate, reportHeader);
        // Write fixed heading
        invoiceTemplate = this._writeInvoiceReportPaymentDetail(invoiceTemplate, paymentDetail);
        // Write devices list
        invoiceTemplate = this._writeInvoiceReportItems(invoiceTemplate, products, INVOICE_EXPORT_CELLS.PRODUCT_TABLE_START_ROW);
        // Write the summary values
        const summaryRowIndex = INVOICE_EXPORT_CELLS.PRODUCT_TABLE_START_ROW + (notEmpty(products) ? products.length : 1);
        invoiceTemplate = this._writeInvoiceReportSummary(invoiceTemplate, summary, summaryRowIndex);
        // Write workbook as a arrayBuffer
        return invoiceTemplate.xlsx.writeBuffer().then((buffer) => buffer).catch((e) => {
            console.log('>>> ExportService:invoiceReport Error: ', e);
        });
    }

    _writeInvoiceReportPaymentDetail(wb, paymentDetail) {
        const ws = wb.getWorksheet(1);
        const {invoice_id, invoice_code, bank_id, bank_name, branch_name, account_name, payment_method} = paymentDetail;
        ws.getCell(INVOICE_EXPORT_CELLS.PAYMENT_INVOICE_CODE).value = invoice_code;
        ws.getCell(INVOICE_EXPORT_CELLS.PAYMENT_BANK_ID).value = bank_id;
        ws.getCell(INVOICE_EXPORT_CELLS.PAYMENT_BANK_NAME).value = bank_name;
        ws.getCell(INVOICE_EXPORT_CELLS.PAYMENT_PAYMENT_METHOD).value = getPaymentMethod(payment_method);
        ws.getCell(INVOICE_EXPORT_CELLS.PAYMENT_BRANCH_NAME).value = branch_name;
        ws.getCell(INVOICE_EXPORT_CELLS.PAYMENT_ACCOUNT_NAME).value = account_name;
        return wb;
    }

    /**
     * Write Invoice Report Header
     * @param wb
     * @return {*}
     * @private
     */
    _writeInvoiceReportHeader(wb, invoiceHeader) {
        const ws = wb.getWorksheet(1);
        const {sale_date, name_vietnamese, name_japanese, birthday, phone, job, address} = invoiceHeader;
        ws.getCell(INVOICE_EXPORT_CELLS.JAPANESE_NAME).value = name_japanese;
        ws.getCell(INVOICE_EXPORT_CELLS.VIETNAMESE_NAME).value = name_vietnamese;
        ws.getCell(INVOICE_EXPORT_CELLS.PHONE).value = phone;
        ws.getCell(INVOICE_EXPORT_CELLS.ADDRESS).value = address;
        ws.getCell(INVOICE_EXPORT_CELLS.JOB).value = getJobText(job);
        ws.getCell(INVOICE_EXPORT_CELLS.AGE).value = getAgeText(birthday);
        // ws.getCell(INVOICE_EXPORT_CELLS.SALE_DATE).value = dateFormat(sale_date);
        ws.getCell(INVOICE_EXPORT_CELLS.BIRTHDAY).value = dateFormat(birthday);
        return wb;
    }

    _writeInvoiceReportSummary(wb, summaryData, summaryRowIndex = INVOICE_EXPORT_CELLS.MOBILE_TABLE_START_ROW + 1) {
        const ws = wb.getWorksheet(1);
        const {quantity, total_money, sale_date} = summaryData;
        const quantityAddress = `${INVOICE_EXPORT_CELLS.SUMMARY_QUANTITY_COLUMN}${summaryRowIndex}`;
        ws.getCell(quantityAddress).value = quantity;
        const totalMoneyAddress = `${INVOICE_EXPORT_CELLS.SUMMARY_MONEY_COLUMN}${summaryRowIndex}`;
        ws.getCell(totalMoneyAddress).value = priceWithFormat(total_money);
        ws.getCell(INVOICE_EXPORT_CELLS.SALE_DATE).value = dateFormat(sale_date);
        return wb;
    }

    _writeInvoiceReportItems(wb, mobiles = [], itemsRowIndex = INVOICE_EXPORT_CELLS.MOBILE_TABLE_START_ROW) {
        const ws = wb.getWorksheet(1);
        if (notEmpty(mobiles)) {

            // Prepare the Rows layout, duplicate the rows
            if (mobiles.length > 1) {
                ws.duplicateRow(itemsRowIndex, mobiles.length - 1, true);
            }

            // Write data to cell
            mobiles.forEach((mobile, index) => {
                const rowIndex = itemsRowIndex + index;
                const noIndex = index + 1;
                const currentRow = ws.getRow(rowIndex);
                const {name, color, status, imei, price} = mobile;
                currentRow.getCell(`${INVOICE_EXPORT_CELLS.NO_COLUMN}`).value = noIndex;
                currentRow.getCell(`${INVOICE_EXPORT_CELLS.MOBILE_NAME_COLUMN}`).value = name;
                currentRow.getCell(`${INVOICE_EXPORT_CELLS.MOBILE_COLOR_COLUMN}`).value = color;
                currentRow.getCell(`${INVOICE_EXPORT_CELLS.MOBILE_STATUS_COLUMN}`).value = getDeviceStatusText(status);
                currentRow.getCell(`${INVOICE_EXPORT_CELLS.MOBILE_IMEI_COLUMN}`).value = imei;
                currentRow.getCell(`${INVOICE_EXPORT_CELLS.MOBILE_PRICE_COLUMN}`).value = priceWithFormat(price);
                currentRow.commit();
            });

            // Merge cell: Name, Price
            if (mobiles.length > 1) {
                for (let i = 1; i < mobiles.length; i++) {
                    // Merge cell name
                    const defaultCellName = `${INVOICE_EXPORT_CELLS.MOBILE_NAME_COLUMN}${itemsRowIndex + i}`;
                    const alterCellName = `${INVOICE_EXPORT_CELLS.MOBILE_NAME_ALTER_COLUMN}${itemsRowIndex + i}`;
                    const mergeCellName = `${defaultCellName}:${alterCellName}`;
                    if (!ws.getCell(mergeCellName).isMerged) {
                        ws.getCell(alterCellName).merge(ws.getCell(defaultCellName));
                    }

                    // Merge cell price
                    const defaultCellPrice = `${INVOICE_EXPORT_CELLS.MOBILE_PRICE_COLUMN}${itemsRowIndex + i}`;
                    const alterCellPrice = `${INVOICE_EXPORT_CELLS.MOBILE_PRICE_ALTER_COLUMN}${itemsRowIndex + i}`;
                    const mergeCellPrice = `${defaultCellPrice}:${alterCellPrice}`;
                    if (!ws.getCell(mergeCellPrice).isMerged) {
                        ws.getCell(alterCellPrice).merge(ws.getCell(defaultCellPrice));
                        const mergeCellPriceBorder = ws.getCell(mergeCellPrice).border;
                        if (notEmpty(mergeCellPriceBorder)) {
                            mergeCellPriceBorder.right = {style: 'thin'};
                        }
                    }
                }
            }
        }
        return wb;
    }


    async _readTemplate(templatePath) {
        const templateFile = notEmpty(templatePath) ? templatePath : EXPORT_TEMPLATES.INVOICE;
        const wb = new ExcelJs.Workbook();
        return await wb.xlsx.readFile(templateFile).then((wb) => wb).catch((e) => {
            console.log('>>> ExportService:_readTemplate Error: ', e);
        });
    }


}

module.exports = {
    ExportService,
    EXPORT_TEMPLATES
}
