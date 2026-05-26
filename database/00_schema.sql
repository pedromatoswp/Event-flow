/*
EventFlow - MySQL schema
Database: `event-flow`

How to run:
  1) Open MySQL Workbench (or run in CLI)
  2) Execute this script first

Notes:
  - Uses InnoDB + utf8mb4 for production-ready defaults.
  - Includes all required tables plus 2 junction tables for many-to-many relationships:
      - event_categories
      - favorites

If you want a clean re-run during local development, you can execute this script as-is.
*/

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `event-flow`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `event-flow`;

-- Re-run safety for local dev
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `ratings`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `event_categories`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `admin_logs`;
DROP TABLE IF EXISTS `administrators`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- users (clients/admin accounts)
-- =========================
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `role_id` TINYINT UNSIGNED NOT NULL DEFAULT 1, -- 1=Client, 2=Administrator
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_id` (`role_id`),
  CONSTRAINT `chk_users_role_id` CHECK (`role_id` IN (1, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- administrators (one-to-one with users)
-- =========================
CREATE TABLE `administrators` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `admin_since` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_administrators_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- categories
-- =========================
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(90) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- events
-- =========================
CREATE TABLE `events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `venue` VARCHAR(200) NULL,
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME NULL,
  `capacity` INT UNSIGNED NOT NULL,
  `event_status` ENUM('active', 'cancelled', 'draft') NOT NULL DEFAULT 'active',
  `organizer_admin_user_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_event_status` (`event_status`),
  KEY `idx_events_start_datetime` (`start_datetime`),
  KEY `idx_events_organizer_admin_user_id` (`organizer_admin_user_id`),
  CONSTRAINT `fk_events_organizer_admin_user_id`
    FOREIGN KEY (`organizer_admin_user_id`) REFERENCES `administrators` (`user_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- event_categories (many-to-many: events <-> categories)
-- =========================
CREATE TABLE `event_categories` (
  `event_id` BIGINT UNSIGNED NOT NULL,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`, `category_id`),
  KEY `idx_event_categories_category_id` (`category_id`),
  CONSTRAINT `fk_event_categories_event_id`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_event_categories_category_id`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- tickets (ticket ownership)
-- =========================
CREATE TABLE `tickets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,

  -- Unique ticket identity displayed on ticket page / QR payload
  `ticket_code` CHAR(36) NOT NULL,
  `qr_code_value` VARCHAR(128) NOT NULL,

  `status` ENUM('pending', 'approved', 'canceled') NOT NULL DEFAULT 'pending',
  `purchased_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` TIMESTAMP NULL,
  `canceled_at` TIMESTAMP NULL,
  `validated_at` TIMESTAMP NULL,

  PRIMARY KEY (`id`),

  UNIQUE KEY `uq_tickets_ticket_code` (`ticket_code`),
  UNIQUE KEY `uq_tickets_qr_code_value` (`qr_code_value`),

  KEY `idx_tickets_event_id` (`event_id`),
  KEY `idx_tickets_owner_user_id` (`owner_user_id`),
  KEY `idx_tickets_status` (`status`),

  CONSTRAINT `fk_tickets_event_id`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_tickets_owner_user_id`
    FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- favorites (many-to-many: users <-> events)
-- =========================
CREATE TABLE `favorites` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `event_id`),
  KEY `idx_favorites_event_id` (`event_id`),
  CONSTRAINT `fk_favorites_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_favorites_event_id`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- comments (one-to-many: events -> comments, users -> comments)
-- =========================
CREATE TABLE `comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_comments_event_id` (`event_id`),
  KEY `idx_comments_user_id` (`user_id`),
  CONSTRAINT `fk_comments_event_id`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- ratings (one-to-many: events -> ratings, users -> ratings)
-- plus rule: one rating per user per event (unique constraint)
-- =========================
CREATE TABLE `ratings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `score` TINYINT UNSIGNED NOT NULL, -- 1..5
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ratings_event_id_user_id` (`event_id`, `user_id`),
  KEY `idx_ratings_event_id` (`event_id`),
  CONSTRAINT `fk_ratings_event_id`
    FOREIGN KEY (`event_id`) REFERENCES `events` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_ratings_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `chk_ratings_score_1_5` CHECK (`score` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- admin_logs
-- =========================
CREATE TABLE `admin_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `action_type` VARCHAR(60) NOT NULL,
  `entity_type` VARCHAR(60) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL,
  `detail` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_logs_admin_user_id` (`admin_user_id`),
  KEY `idx_admin_logs_action_type` (`action_type`),
  KEY `idx_admin_logs_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_admin_logs_admin_user_id`
    FOREIGN KEY (`admin_user_id`) REFERENCES `administrators` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- End schema
-- =========================

