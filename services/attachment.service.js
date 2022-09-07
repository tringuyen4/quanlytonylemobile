const {DATA_TABLES} = require("../constants/data.constant");

class AttachmentService {
    constructor(dbPool) {
        this.pool = dbPool;
    }

    /**
     * Get All Customers
     * @return {*}
     */
    getAllAttachments() {
        const getAttachmentQuery = `SELECT *
                                  FROM ${DATA_TABLES.ATTACHMENTS};`

        return this.pool.query(getAttachmentQuery)
            .then(({ rows }) => {
                return rows
            }).catch(e => {
                throw e;
            })
    }

    upload(files) {
        return Promise.resolve(files);

    }
}

module.exports = {
    AttachmentService
}
