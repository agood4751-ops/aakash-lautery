-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: newschema
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bets`
--

DROP TABLE IF EXISTS `bets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `draw_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `chosen_number` int DEFAULT NULL,
  `chosen_color` enum('RED','GREEN','BLUE','YELLOW') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','WON','LOST') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `payout` decimal(10,2) DEFAULT '0.00',
  `placed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `game_type_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `draw_id` (`draw_id`),
  CONSTRAINT `bets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `bets_ibfk_2` FOREIGN KEY (`draw_id`) REFERENCES `draws` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bets`
--

LOCK TABLES `bets` WRITE;
/*!40000 ALTER TABLE `bets` DISABLE KEYS */;
INSERT INTO `bets` VALUES (1,1,1,1000.00,12,NULL,'LOST',0.00,'2025-12-09 13:20:21',NULL),(2,1,1,1.00,1,NULL,'LOST',0.00,'2025-12-13 10:48:20',NULL),(3,1,1,1.00,1,NULL,'LOST',0.00,'2025-12-13 10:48:20',NULL),(4,1,1,1.00,1,NULL,'LOST',0.00,'2025-12-13 10:48:20',NULL),(5,1,4,12.00,12,NULL,'LOST',0.00,'2025-12-13 13:42:57',NULL),(6,1,4,12.00,12,NULL,'LOST',0.00,'2025-12-13 13:42:57',NULL),(7,1,4,12.00,12,NULL,'LOST',0.00,'2025-12-13 13:42:57',NULL),(8,1,4,12.00,12,NULL,'LOST',0.00,'2025-12-13 13:42:57',NULL),(9,1,4,12.00,12,NULL,'LOST',0.00,'2025-12-13 13:42:57',NULL),(10,4,5,11.00,NULL,NULL,'LOST',0.00,'2025-12-23 13:27:13',NULL),(11,4,5,2.00,NULL,NULL,'LOST',0.00,'2025-12-23 16:46:07',NULL),(12,1,6,2.00,34,NULL,'LOST',0.00,'2025-12-23 17:09:01',NULL),(13,1,5,11.00,NULL,NULL,'LOST',0.00,'2025-12-23 17:10:49',NULL),(14,1,5,11.00,12,NULL,'LOST',0.00,'2025-12-24 12:58:35',1),(15,2,10,10.00,45,NULL,'WON',100.00,'2025-12-24 16:51:18',1),(16,2,11,100.00,25,NULL,'LOST',0.00,'2025-12-24 16:52:48',3),(17,1,12,10.00,45,NULL,'WON',100.00,'2025-12-25 14:38:44',1),(18,1,13,100.00,25,NULL,'WON',4000.00,'2025-12-26 04:50:02',3),(19,1,15,50.00,5,NULL,'PENDING',2000.00,'2025-12-26 05:29:19',3),(20,1,15,2.00,1,NULL,'PENDING',80.00,'2025-12-26 05:30:48',3),(21,1,15,2.00,2,NULL,'PENDING',80.00,'2025-12-26 05:30:52',3),(22,1,15,3.00,3,NULL,'PENDING',120.00,'2025-12-26 05:30:58',3),(23,1,15,4.00,4,NULL,'PENDING',160.00,'2025-12-26 05:31:02',3);
/*!40000 ALTER TABLE `bets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `draws`
--

DROP TABLE IF EXISTS `draws`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `draws` (
  `id` int NOT NULL AUTO_INCREMENT,
  `draw_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `game_type_id` int NOT NULL,
  `draw_time` datetime NOT NULL,
  `winning_number` int DEFAULT NULL,
  `winning_color` enum('RED','GREEN','BLUE','YELLOW') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_closed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `game_type_id` (`game_type_id`),
  CONSTRAINT `draws_ibfk_1` FOREIGN KEY (`game_type_id`) REFERENCES `game_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `draws`
--

LOCK TABLES `draws` WRITE;
/*!40000 ALTER TABLE `draws` DISABLE KEYS */;
INSERT INTO `draws` VALUES (1,NULL,1,'2121-12-21 11:21:00',32,NULL,1,'2025-12-09 13:19:25'),(2,NULL,2,'1212-12-12 12:12:00',NULL,'RED',1,'2025-12-09 13:20:52'),(3,NULL,2,'2025-12-19 18:43:00',NULL,'GREEN',1,'2025-12-13 13:14:39'),(4,NULL,3,'2025-12-15 19:05:00',2,NULL,1,'2025-12-13 13:35:43'),(5,NULL,1,'2025-12-23 14:10:00',88,NULL,1,'2025-12-23 08:38:54'),(6,NULL,3,'2025-12-23 22:38:00',50,NULL,1,'2025-12-23 17:08:42'),(7,NULL,1,'2025-12-24 08:40:00',99,NULL,1,'2025-12-24 03:10:01'),(8,NULL,1,'2025-12-24 08:40:00',1,NULL,1,'2025-12-24 03:10:54'),(9,NULL,3,'2025-12-24 08:42:00',22,NULL,1,'2025-12-24 03:11:44'),(10,NULL,1,'2025-12-24 22:17:00',45,NULL,1,'2025-12-24 16:46:23'),(11,NULL,3,'2025-12-24 22:17:00',25,NULL,1,'2025-12-24 16:46:30'),(12,NULL,1,'2025-12-25 20:09:00',45,NULL,1,'2025-12-25 14:38:27'),(13,NULL,3,'2025-12-26 10:22:00',25,NULL,1,'2025-12-26 04:49:49'),(14,NULL,1,'2025-12-26 10:25:00',NULL,NULL,0,'2025-12-26 04:52:03'),(15,NULL,3,'2025-12-26 10:30:00',NULL,NULL,0,'2025-12-26 04:58:46'),(16,NULL,1,'2025-12-26 19:00:00',NULL,NULL,0,'2025-12-26 13:28:40');
/*!40000 ALTER TABLE `draws` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_types`
--

DROP TABLE IF EXISTS `game_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `game_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_types`
--

LOCK TABLES `game_types` WRITE;
/*!40000 ALTER TABLE `game_types` DISABLE KEYS */;
INSERT INTO `game_types` VALUES (1,'NUMBER','Sprint 70x'),(2,'COLOR','Color Lottery'),(3,'NUMBER50','Mid-Day 40x');
/*!40000 ALTER TABLE `game_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('FG3D5pbQur_m1cRYQxt3q8TVKpgOD0IF',1766897427,'{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-12-27T13:28:40.175Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"user\":{\"id\":1,\"name\":\"Faizan Raza\",\"email\":\"ryan@gmail.com\",\"is_admin\":true,\"balance\":\"4842.00\"}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `balance` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Faizan Raza','ryan@gmail.com',NULL,'$2b$10$L6DF.pLMNPYgtwIzMozfTO56zMHrhSHWHrelHnvtGsbXMDsqjjL8e',1,4842.00,'2025-12-09 10:56:59'),(2,'Sourabh','test@yopmail.com',NULL,'$2b$10$7n.5V9VuotzjMSMNqIIJwesmQtktjd.YynTFKalUKDdwytfVFQtRy',0,990.00,'2025-12-20 21:13:16'),(3,'Sourabh','sourabhsheoran1237@gmail.com',NULL,'$2b$10$KtEQYkM08dIqVSrGpgtA6.Mc3NWr5RgTE1hTOz.94NJLXgOg7N.pS',0,1000.00,'2025-12-21 15:39:36'),(4,'Sourabh','sourabhsheoran7477@gmail.com',NULL,'$2b$10$X/HtF1CsP.vI.y/vIM/Q9e0J/xV6GALQ0nwQT2yu56puKu/OYFhmG',0,987.00,'2025-12-21 15:40:38');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-27 13:08:44
