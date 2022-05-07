-- Init KAI Schemas

-- Product
CREATE TABLE product
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR   NOT NULL,
    imei       VARCHAR   NOT NULL,
    color      VARCHAR   NOT NULL,
    status     VARCHAR   NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product Storage
CREATE TABLE product_storage
(
    product_id INT       NOT NULL,
    quantity   INT       NOT NULL DEFAULT 1,
    price      DECIMAL   NOT NULL DEFAULT 0,
    position   VARCHAR NULL DEFAULT 'KAI',
    source     VARCHAR NULL DEFAULT 'KAI',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, position),
    CONSTRAINT fk_storage_product
        FOREIGN KEY (product_id)
            REFERENCES product (id) ON DELETE CASCADE
);

-- Customer
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
    total_money    DECIMAL   NOT NULL,
    type           VARCHAR NULL, -- PURCHASING, FOR_SALE
    status         VARCHAR NULL, -- NEW, PROCESSING, COMPLETED, CANCELED
    created_at     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Invoice detail for general
CREATE TABLE invoice_detail
(
    invoice_id INT       NOT NULL,
    product_id INT       NOT NULL,
    quantity   INT       NOT NULL DEFAULT 1,
    price      DECIMAL   NOT NULL DEFAULT 0,
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
            REFERENCES customer (id) ON DELETE CASCADE
);

-- Invoice transfer detail
CREATE TABLE transfer_detail
(
    invoice_id      INT       NOT NULL,
    product_id      INT       NOT NULL,
    from_position   VARCHAR NULL DEFAULT 'KAI',
    to_position     VARCHAR NULL DEFAULT 'KAI',
    quantity        INT       NOT NULL DEFAULT 1,
    price           DECIMAL   NOT NULL DEFAULT 0,
    exchange_rate   DECIMAL   NOT NULL DEFAULT 1,
    sub_fee         DECIMAL   NOT NULL DEFAULT 0,
    transfer_price  DECIMAL   NOT NULL DEFAULT 0,
    transfer_status VARCHAR NULL, -- NEW, PROCESSING, TRANSFERRED, CANCELED
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (invoice_id, product_id),
    CONSTRAINT fk_transfer_invoice_detail
        FOREIGN KEY (invoice_id)
            REFERENCES invoice (id) ON DELETE CASCADE,
    CONSTRAINT fk_transfer_invoice_product
        FOREIGN KEY (product_id)
            REFERENCES product (id) ON DELETE CASCADE
);

CREATE TABLE product_group
(
    id         INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name       VARCHAR NULL DEFAULT NULL,
    sort_order INT       NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO product_group(name) values('DEFAULT');

ALTER TABLE product
    ADD COLUMN product_group_id INT NOT NULL DEFAULT 1;

ALTER TABLE product
    ADD CONSTRAINT fk_product_group FOREIGN KEY (product_group_id) REFERENCES product_group (id);


ALTER TABLE transfer_detail
    ADD COLUMN transfer_date DATE NULL DEFAULT NULL;

ALTER TABLE transfer_detail
    ADD COLUMN receive_date DATE NULL DEFAULT NULL;
