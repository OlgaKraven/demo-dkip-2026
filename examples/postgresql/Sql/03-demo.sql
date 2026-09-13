-- Выполнить в новой пустой базе rassvet_demo_2026, схема public.
-- Учебные записи; исходный справочник заказчиков сохранён отдельно.
INSERT INTO item(id,code,name,kind,unit) VALUES
(1,'MAT-01','Молоко','material','л'),(2,'MAT-02','Сахар','material','кг'),(3,'MAT-03','Какао','material','кг'),
(4,'PRD-01','Йогурт','product','шт'),(5,'PRD-02','Какао-напиток','product','шт');
INSERT INTO price(item_id,valid_from,amount) VALUES (1,'2026-01-01',80),(2,'2026-01-01',65),(3,'2026-01-01',500),(1,'2026-04-01',90);
INSERT INTO specification(id,product_id,name,output_qty,manufacturer_id) VALUES (1,4,'Йогурт — 1 шт',1,'000000001'),(2,5,'Какао — 1 шт',1,'000000001');
INSERT INTO specification_material VALUES(1,1,0.25),(1,2,0.03),(2,1,0.30),(2,2,0.02),(2,3,0.01);
INSERT INTO customer_order(id,doc_no,doc_date,customer_id,executor_id) VALUES
(1,'ЗП-001','2026-03-01','000000003','000000001'),(2,'ЗП-002','2026-03-02','000000003','000000001'),(3,'ЗП-003','2026-03-03','000000003','000000001');
INSERT INTO customer_order_line(order_id,product_id,qty,sale_price) VALUES(1,4,10,45),(1,5,5,60),(2,4,3,45),(2,5,2,60),(3,4,7,45),(3,5,1,60);
INSERT INTO production(id,doc_no,doc_date,manufacturer_id) VALUES(1,'ПР-001','2026-03-01','000000001');
INSERT INTO production_product VALUES(1,4,10),(1,5,5);
INSERT INTO production_material VALUES(1,1,4),(1,2,0.4),(1,3,0.05);
-- Только учебные учётные записи: admin / DemoAdmin!2026, user / DemoUser!2026.
INSERT INTO users(login,password_hash,role) VALUES('admin','UG9sZXNpZURlbW8yMDI2ISE=:B85hzdkDAWgSS5H8GsSkzz/k4PdGzdBhi4SVoGiHIAg=','admin'),('user','UG9sZXNpZURlbW8yMDI2ISE=:L/VOKskOzPCY0JTqZTsEbDRC+KfdY3+0DHU68wyR4EE=','user');
SELECT setval(pg_get_serial_sequence('item','id'),5);
SELECT setval(pg_get_serial_sequence('specification','id'),2);
SELECT setval(pg_get_serial_sequence('customer_order','id'),3);
SELECT setval(pg_get_serial_sequence('production','id'),1);
