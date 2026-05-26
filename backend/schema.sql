-- EventFlow Database Schema
-- Run this file to create all tables: mysql -u root -p Event-flow < schema.sql

CREATE DATABASE IF NOT EXISTS `Event-flow`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `Event-flow`;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('user','admin','banned') NOT NULL DEFAULT 'user',
  ban_reason    TEXT,
  banned_at     DATETIME,
  created_at    DATETIME NOT NULL DEFAULT NOW(),
  updated_at    DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  DATETIME NOT NULL DEFAULT NOW(),
  updated_at  DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;

-- Events
CREATE TABLE IF NOT EXISTS events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  date         DATETIME     NOT NULL,
  end_date     DATETIME,
  location     VARCHAR(255) NOT NULL,
  capacity     INT          NOT NULL DEFAULT 0,
  price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status       ENUM('draft','published','cancelled','completed') NOT NULL DEFAULT 'draft',
  category_id  INT,
  organizer_id INT          NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT NOW(),
  updated_at   DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (organizer_id) REFERENCES users(id)      ON DELETE CASCADE,
  INDEX idx_events_date     (date),
  INDEX idx_events_status   (status),
  INDEX idx_events_category (category_id)
) ENGINE=InnoDB;

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  event_id     INT           NOT NULL,
  quantity     INT           NOT NULL DEFAULT 1,
  total_price  DECIMAL(10,2) NOT NULL,
  status       ENUM('pending','confirmed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  purchased_at DATETIME NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_tickets_user  (user_id),
  INDEX idx_tickets_event (event_id)
) ENGINE=InnoDB;

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  event_id   INT  NOT NULL,
  content    TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_comments_event (event_id)
) ENGINE=InnoDB;

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  event_id   INT NOT NULL,
  score      TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  review     TEXT,
  created_at DATETIME NOT NULL DEFAULT NOW(),
  updated_at DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  UNIQUE KEY uq_user_event (user_id, event_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_ratings_event (event_id)
) ENGINE=InnoDB;

-- Seed: default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@eventflow.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Seed: default categories
INSERT IGNORE INTO categories (name, description) VALUES
  ('Music',       'Concerts, festivals and live music events'),
  ('Technology',  'Tech conferences, hackathons and workshops'),
  ('Sports',      'Sports competitions and fitness events'),
  ('Arts',        'Art exhibitions, theatre and cultural events'),
  ('Food & Drink','Food festivals, tastings and culinary events'),
  ('Business',    'Networking, seminars and business events'),
  ('Education',   'Courses, workshops and educational events');
