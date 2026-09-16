-- Сохранённый расчёт: CALL calculate_order_material_costs();
DELIMITER //
CREATE PROCEDURE calculate_order_material_costs()
READS SQL DATA
SQL SECURITY INVOKER
BEGIN
-- Модуль 3. Материальная стоимость каждого заказа на дату документа.
-- NULL означает неполные данные; неполную сумму не выдаём за полный итог.
SELECT o.id AS order_id, o.doc_no,
       CASE WHEN COUNT(l.id)=0 THEN 0
            WHEN SUM(CASE WHEN s.id IS NULL OR sm.material_id IS NULL OR p.amount IS NULL THEN 1 ELSE 0 END)>0 THEN NULL
            ELSE ROUND(SUM(l.qty / s.output_qty * sm.qty * p.amount), 2)
       END AS material_cost
FROM customer_order o
LEFT JOIN customer_order_line l ON l.order_id=o.id
LEFT JOIN specification s ON s.product_id=l.product_id
LEFT JOIN specification_material sm ON sm.specification_id=s.id
LEFT JOIN price p ON p.item_id=sm.material_id
 AND p.valid_from=(SELECT MAX(p2.valid_from) FROM price p2 WHERE p2.item_id=sm.material_id AND p2.valid_from<=o.doc_date)
GROUP BY o.id,o.doc_no
ORDER BY o.id;

END//
DELIMITER ;
