-- Init KAI Schemas
CREATE TABLE product
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR   NOT NULL,
    imei       VARCHAR   NOT NULL,
    color      VARCHAR   NOT NULL,
    status     VARCHAR   NOT NULL,
    quantity   INT       NOT NULL DEFAULT 1,
    price      BIGINT    NOT NULL DEFAULT 0,
    group_name VARCHAR   NULL,
    type_name  VARCHAR   NULL,
    capacity   VARCHAR   NULL,
    version    VARCHAR   NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE customer
(
    id              INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name_vietnamese VARCHAR(100) NOT NULL,
    name_japanese   VARCHAR(100) NOT NULL,
    birthday        DATE         NOT NULL,
    age             INTEGER      NOT NULL,
    address         VARCHAR      NOT NULL,
    phone           VARCHAR      NOT NULL,
    job             VARCHAR      NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fresh create table
CREATE TABLE invoice
(
    id             INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    sale_date      DATE      NOT NULL,
    total_quantity INT       NOT NULL,
    total_money    BIGINT    NOT NULL,
    type           VARCHAR   NULL, -- PURCHASING, FOR_SALE
    status         VARCHAR   NULL, -- NEW, PROCESSING, COMPLETED, CANCELED
    created_at     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_detail
(
    invoice_id INT       NOT NULL,
    product_id INT       NOT NULL,
    quantity   INT       NOT NULL DEFAULT 1,
    price      BIGINT    NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (invoice_id, product_id),
    CONSTRAINT fk_invoice_detail
        FOREIGN KEY (invoice_id)
            REFERENCES invoice (id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_product
        FOREIGN KEY (product_id)
            REFERENCES product (id) ON DELETE CASCADE
);

CREATE TABLE purchasing_detail
(
    invoice_id  INT       NOT NULL,
    customer_id INT       NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (invoice_id, customer_id),
    CONSTRAINT fk_purchasing_invoice
        FOREIGN KEY (invoice_id)
            REFERENCES invoice (id) ON DELETE CASCADE,
    CONSTRAINT fk_purchasing_customer
        FOREIGN KEY (customer_id)
            REFERENCES customer(id) ON DELETE CASCADE
);

-- DB Migrations

