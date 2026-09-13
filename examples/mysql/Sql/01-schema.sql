-- Выполнить в новой пустой базе rassvet_demo_2026 (utf8mb4).
SET NAMES utf8mb4;
SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_BACKSLASH_ESCAPES';

CREATE TABLE counterparty (
 id VARCHAR(32) PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 inn VARCHAR(20), address VARCHAR(500), phone VARCHAR(64),
 is_salesman BOOLEAN NOT NULL DEFAULT FALSE, is_buyer BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE item (
 id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(64) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL,
 kind VARCHAR(16) NOT NULL CHECK(kind IN ('product','material')), unit VARCHAR(16) NOT NULL
);
CREATE TABLE price (
 item_id INT NOT NULL REFERENCES item(id), valid_from DATE NOT NULL,
 amount DECIMAL(12,2) NOT NULL CHECK(amount>=0),
 PRIMARY KEY(item_id,valid_from), FOREIGN KEY(item_id) REFERENCES item(id)
);
CREATE TABLE specification (
 id INT AUTO_INCREMENT PRIMARY KEY, product_id INT NOT NULL UNIQUE,
 name VARCHAR(255) NOT NULL, output_qty DECIMAL(12,3) NOT NULL CHECK(output_qty>0),
 manufacturer_id VARCHAR(32),
 FOREIGN KEY(product_id) REFERENCES item(id), FOREIGN KEY(manufacturer_id) REFERENCES counterparty(id)
);
CREATE TABLE specification_material (
 specification_id INT NOT NULL, material_id INT NOT NULL,
 qty DECIMAL(12,3) NOT NULL CHECK(qty>0), PRIMARY KEY(specification_id,material_id),
 FOREIGN KEY(specification_id) REFERENCES specification(id), FOREIGN KEY(material_id) REFERENCES item(id)
);
CREATE TABLE customer_order (
 id INT AUTO_INCREMENT PRIMARY KEY, doc_no VARCHAR(64) NOT NULL UNIQUE, doc_date DATE NOT NULL,
 customer_id VARCHAR(32) NOT NULL, executor_id VARCHAR(32),
 FOREIGN KEY(customer_id) REFERENCES counterparty(id), FOREIGN KEY(executor_id) REFERENCES counterparty(id)
);
CREATE TABLE customer_order_line (
 id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, product_id INT NOT NULL,
 qty DECIMAL(12,3) NOT NULL CHECK(qty>0), sale_price DECIMAL(12,2) NOT NULL CHECK(sale_price>=0),
 FOREIGN KEY(order_id) REFERENCES customer_order(id), FOREIGN KEY(product_id) REFERENCES item(id)
);
CREATE TABLE production (
 id INT AUTO_INCREMENT PRIMARY KEY, doc_no VARCHAR(64) NOT NULL UNIQUE, doc_date DATE NOT NULL,
 manufacturer_id VARCHAR(32) NOT NULL, FOREIGN KEY(manufacturer_id) REFERENCES counterparty(id)
);
CREATE TABLE production_product (
 production_id INT NOT NULL, product_id INT NOT NULL, qty DECIMAL(12,3) NOT NULL CHECK(qty>0),
 PRIMARY KEY(production_id,product_id), FOREIGN KEY(production_id) REFERENCES production(id), FOREIGN KEY(product_id) REFERENCES item(id)
);
CREATE TABLE production_material (
 production_id INT NOT NULL, material_id INT NOT NULL, qty DECIMAL(12,3) NOT NULL CHECK(qty>0),
 PRIMARY KEY(production_id,material_id), FOREIGN KEY(production_id) REFERENCES production(id), FOREIGN KEY(material_id) REFERENCES item(id)
);
CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY, login VARCHAR(64) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
 role VARCHAR(16) NOT NULL CHECK(role IN ('admin','user')),
 failed_attempts INT NOT NULL DEFAULT 0 CHECK(failed_attempts>=0), is_locked BOOLEAN NOT NULL DEFAULT FALSE
);
