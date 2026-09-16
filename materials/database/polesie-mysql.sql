-- Учебная база Полесье. Импортируйте в новую пустую базу UTF8MB4.
-- Содержит таблицы, данные и calculate_order_material_costs.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `counterparty` (
  `id` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `inn` varchar(20) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `is_salesman` tinyint(1) NOT NULL DEFAULT 0,
  `is_buyer` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `counterparty` WRITE;
/*!40000 ALTER TABLE `counterparty` DISABLE KEYS */;
INSERT INTO `counterparty` VALUES ('000000001','ООО \"Поставка\"','','г.Пятигорск','+79198634592',1,1),('000000002','ООО \"Кинотеатр Квант\"','26320045123','г. Железноводск, ул. Мира, 123','+79884581555',1,0),('000000003','ООО \"Ромашка\"','4140784214','г. Омск, ул. Строителей, 294','+79882584546',0,1),('000000008','ООО \"Новый JDTO\"','26320045111','г. Железноводсу','+79884581555',1,0),('000000009','ООО \"Ипподром\"','5874045632','г. Уфа, ул. Набережная,  37','+79627486389',1,1),('000000010','ООО \"Ассоль\"','2629011278','г. Калуга, ул. Пушкина, 94','+79184572398',0,1);
/*!40000 ALTER TABLE `counterparty` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_no` varchar(64) NOT NULL,
  `doc_date` date NOT NULL,
  `customer_id` varchar(32) NOT NULL,
  `executor_id` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doc_no` (`doc_no`),
  KEY `customer_id` (`customer_id`),
  KEY `executor_id` (`executor_id`),
  CONSTRAINT `customer_order_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `counterparty` (`id`),
  CONSTRAINT `customer_order_ibfk_2` FOREIGN KEY (`executor_id`) REFERENCES `counterparty` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_order` WRITE;
/*!40000 ALTER TABLE `customer_order` DISABLE KEYS */;
INSERT INTO `customer_order` VALUES (1,'ЗП-001','2026-03-01','000000003','000000001'),(2,'ЗП-002','2026-03-02','000000003','000000001'),(3,'ЗП-003','2026-03-03','000000003','000000001');
/*!40000 ALTER TABLE `customer_order` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_order_line` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` decimal(12,3) NOT NULL CHECK (`qty` > 0),
  `sale_price` decimal(12,2) NOT NULL CHECK (`sale_price` >= 0),
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `customer_order_line_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `customer_order` (`id`),
  CONSTRAINT `customer_order_line_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `item` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `customer_order_line` WRITE;
/*!40000 ALTER TABLE `customer_order_line` DISABLE KEYS */;
INSERT INTO `customer_order_line` VALUES (1,1,4,10.000,45.00),(2,1,5,5.000,60.00),(3,2,4,3.000,45.00),(4,2,5,2.000,60.00),(5,3,4,7.000,45.00),(6,3,5,1.000,60.00);
/*!40000 ALTER TABLE `customer_order_line` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `kind` varchar(16) NOT NULL CHECK (`kind` in ('product','material')),
  `unit` varchar(16) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (1,'MAT-01','Молоко','material','л'),(2,'MAT-02','Сахар','material','кг'),(3,'MAT-03','Какао','material','кг'),(4,'PRD-01','Йогурт','product','шт'),(5,'PRD-02','Какао-напиток','product','шт');
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `price` (
  `item_id` int(11) NOT NULL,
  `valid_from` date NOT NULL,
  `amount` decimal(12,2) NOT NULL CHECK (`amount` >= 0),
  PRIMARY KEY (`item_id`,`valid_from`),
  CONSTRAINT `price_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `price` WRITE;
/*!40000 ALTER TABLE `price` DISABLE KEYS */;
INSERT INTO `price` VALUES (1,'2026-01-01',80.00),(1,'2026-04-01',90.00),(2,'2026-01-01',65.00),(3,'2026-01-01',500.00);
/*!40000 ALTER TABLE `price` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `production` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_no` varchar(64) NOT NULL,
  `doc_date` date NOT NULL,
  `manufacturer_id` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doc_no` (`doc_no`),
  KEY `manufacturer_id` (`manufacturer_id`),
  CONSTRAINT `production_ibfk_1` FOREIGN KEY (`manufacturer_id`) REFERENCES `counterparty` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `production` WRITE;
/*!40000 ALTER TABLE `production` DISABLE KEYS */;
INSERT INTO `production` VALUES (1,'ПР-001','2026-03-01','000000001');
/*!40000 ALTER TABLE `production` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `production_material` (
  `production_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `qty` decimal(12,3) NOT NULL CHECK (`qty` > 0),
  PRIMARY KEY (`production_id`,`material_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `production_material_ibfk_1` FOREIGN KEY (`production_id`) REFERENCES `production` (`id`),
  CONSTRAINT `production_material_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `item` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `production_material` WRITE;
/*!40000 ALTER TABLE `production_material` DISABLE KEYS */;
INSERT INTO `production_material` VALUES (1,1,4.000),(1,2,0.400),(1,3,0.050);
/*!40000 ALTER TABLE `production_material` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `production_product` (
  `production_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` decimal(12,3) NOT NULL CHECK (`qty` > 0),
  PRIMARY KEY (`production_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `production_product_ibfk_1` FOREIGN KEY (`production_id`) REFERENCES `production` (`id`),
  CONSTRAINT `production_product_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `item` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `production_product` WRITE;
/*!40000 ALTER TABLE `production_product` DISABLE KEYS */;
INSERT INTO `production_product` VALUES (1,4,10.000),(1,5,5.000);
/*!40000 ALTER TABLE `production_product` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `specification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `output_qty` decimal(12,3) NOT NULL CHECK (`output_qty` > 0),
  `manufacturer_id` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  KEY `manufacturer_id` (`manufacturer_id`),
  CONSTRAINT `specification_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `item` (`id`),
  CONSTRAINT `specification_ibfk_2` FOREIGN KEY (`manufacturer_id`) REFERENCES `counterparty` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `specification` WRITE;
/*!40000 ALTER TABLE `specification` DISABLE KEYS */;
INSERT INTO `specification` VALUES (1,4,'Йогурт — 1 шт',1.000,'000000001'),(2,5,'Какао — 1 шт',1.000,'000000001');
/*!40000 ALTER TABLE `specification` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `specification_material` (
  `specification_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `qty` decimal(12,3) NOT NULL CHECK (`qty` > 0),
  PRIMARY KEY (`specification_id`,`material_id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `specification_material_ibfk_1` FOREIGN KEY (`specification_id`) REFERENCES `specification` (`id`),
  CONSTRAINT `specification_material_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `item` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `specification_material` WRITE;
/*!40000 ALTER TABLE `specification_material` DISABLE KEYS */;
INSERT INTO `specification_material` VALUES (1,1,0.250),(1,2,0.030),(2,1,0.300),(2,2,0.020),(2,3,0.010);
/*!40000 ALTER TABLE `specification_material` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(16) NOT NULL CHECK (`role` in ('admin','user')),
  `failed_attempts` int(11) NOT NULL DEFAULT 0 CHECK (`failed_attempts` >= 0),
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','UG9sZXNpZURlbW8yMDI2ISE=:B85hzdkDAWgSS5H8GsSkzz/k4PdGzdBhi4SVoGiHIAg=','admin',0,0),(2,'user','UG9sZXNpZURlbW8yMDI2ISE=:L/VOKskOzPCY0JTqZTsEbDRC+KfdY3+0DHU68wyR4EE=','user',0,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
DELIMITER ;;
CREATE PROCEDURE `calculate_order_material_costs`()
    READS SQL DATA
    SQL SECURITY INVOKER
BEGIN


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

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
