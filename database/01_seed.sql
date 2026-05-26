/*
EventFlow - Sample data
Run after `00_schema.sql`.
*/

USE `event-flow`;

-- =========================
-- Sample users (clients + administrator)
-- Password hashes generated with bcrypt for:
--   client123 / admin123 / client456 / client789
-- =========================

INSERT INTO `users` (
  `id`,
  `email`,
  `password_hash`,
  `full_name`,
  `phone`,
  `role_id`,
  `is_active`,
  `created_at`,
  `updated_at`
)
VALUES
  (1, 'client1@eventflow.local', '$2b$10$lmAdrjLL5pqv8dFVCXYTUO7Uy1Gu/vzfVYr9k2wWhtvsC6KOQdklG', 'Ana Silva', '11999990001', 1, TRUE, NOW(), NOW()),
  (2, 'client2@eventflow.local', '$2b$10$D2J2XYvspPB9gzjEcFOwIemaVKnf9sloGkslTsgcVy8OdByiAV0zi', 'Bruno Santos', '11999990002', 1, TRUE, NOW(), NOW()),
  (3, 'client3@eventflow.local', '$2b$10$vbyW2k9V7GD7Pm02CpgpSuzHia9Ykof/mok5A4B/pHgHHP9kYbkle', 'Carla Oliveira', '11999990003', 1, TRUE, NOW(), NOW()),
  (4, 'admin@eventflow.local',    '$2b$10$aBJPHgWpuHmtf4/VMtAZ0eEKFOwFg4G8ZkBP/NnVemW.2vCnuJ3XW', 'Admin EventFlow', '11999990004', 2, TRUE, NOW(), NOW());

-- =========================
-- Administrators (one-to-one with users.id)
-- =========================
INSERT INTO `administrators` (`user_id`, `admin_since`)
VALUES
  (4, NOW());

-- =========================
-- Categories
-- =========================
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_at`)
VALUES
  (1, 'Technology', 'tech', 'Workshops and tech conferences.', NOW()),
  (2, 'Music',      'music', 'Shows, live sessions and performers.', NOW()),
  (3, 'Sports',     'sports','Matches, leagues and sports events.', NOW());

-- =========================
-- Events
-- organizer_admin_user_id references administrators(user_id=4)
-- =========================
INSERT INTO `events` (
  `id`,
  `title`,
  `description`,
  `venue`,
  `start_datetime`,
  `end_datetime`,
  `capacity`,
  `event_status`,
  `organizer_admin_user_id`,
  `created_at`,
  `updated_at`
)
VALUES
  (1, 'Next.js Conf Local', 'A hands-on conference for modern web development.', 'Auditório Central', '2026-07-10 09:00:00', '2026-07-10 18:00:00', 500, 'active', 4, NOW(), NOW()),
  (2, 'Futebol de Sábado', 'Semi-pro match event with family activities.', 'Estádio Municipal', '2026-08-02 15:00:00', '2026-08-02 18:30:00', 300, 'cancelled', 4, NOW(), NOW()),
  (3, 'Tech Networking Night', 'Meetups, lightning talks and networking.', 'Espaço Cowork', '2026-07-25 19:00:00', NULL, 200, 'active', 4, NOW(), NOW());

-- =========================
-- event_categories (many-to-many)
-- =========================
INSERT INTO `event_categories` (`event_id`, `category_id`, `created_at`)
VALUES
  (1, 1, NOW()), -- Next.js Conf Local -> Technology
  (1, 2, NOW()), -- Next.js Conf Local -> Music
  (2, 3, NOW()), -- Futebol de Sábado -> Sports
  (3, 1, NOW()); -- Tech Networking Night -> Technology

-- =========================
-- favorites (many-to-many: users <-> events)
-- =========================
INSERT INTO `favorites` (`user_id`, `event_id`, `created_at`)
VALUES
  (1, 1, NOW()),
  (1, 2, NOW()),
  (2, 3, NOW());

-- =========================
-- comments (events -> comments, users -> comments)
-- =========================
INSERT INTO `comments` (`id`, `event_id`, `user_id`, `content`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, 'Amazing content and great speakers.', NOW(), NOW()),
  (2, 1, 2, 'Loved the hands-on labs. Would attend again.', NOW(), NOW()),
  (3, 3, 3, 'Great networking and friendly community!', NOW(), NOW());

-- =========================
-- ratings (one rating per user per event)
-- =========================
INSERT INTO `ratings` (`id`, `event_id`, `user_id`, `score`, `created_at`)
VALUES
  (1, 1, 1, 5, NOW()),
  (2, 1, 2, 4, NOW()),
  (3, 3, 3, 3, NOW());

-- =========================
-- tickets (ticket ownership)
-- =========================
INSERT INTO `tickets` (
  `id`,
  `event_id`,
  `owner_user_id`,
  `ticket_code`,
  `qr_code_value`,
  `status`,
  `purchased_at`,
  `approved_at`,
  `canceled_at`,
  `validated_at`
)
VALUES
  (1, 1, 1, '550e8400-e29b-41d4-a716-446655440000', 'EVFQR:550e8400-e29b-41d4-a716-446655440000', 'approved', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 6 DAY, NULL, NOW() - INTERVAL 1 DAY),
  (2, 1, 2, '550e8400-e29b-41d4-a716-446655440001', 'EVFQR:550e8400-e29b-41d4-a716-446655440001', 'pending', NOW() - INTERVAL 2 DAY, NULL, NULL, NULL),
  (3, 2, 1, '550e8400-e29b-41d4-a716-446655440002', 'EVFQR:550e8400-e29b-41d4-a716-446655440002', 'canceled', NOW() - INTERVAL 10 DAY, NULL, NOW() - INTERVAL 5 DAY, NULL),
  (4, 3, 3, '550e8400-e29b-41d4-a716-446655440003', 'EVFQR:550e8400-e29b-41d4-a716-446655440003', 'approved', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY, NULL, NOW() - INTERVAL 12 HOUR);

-- =========================
-- admin_logs
-- =========================
INSERT INTO `admin_logs` (`id`, `admin_user_id`, `action_type`, `entity_type`, `entity_id`, `detail`, `created_at`)
VALUES
  (1, 4, 'CREATE_EVENT', 'event', 1, 'Created event Next.js Conf Local', NOW() - INTERVAL 20 DAY),
  (2, 4, 'CREATE_EVENT', 'event', 2, 'Created event Futebol de Sábado', NOW() - INTERVAL 15 DAY),
  (3, 4, 'CANCEL_EVENT', 'event', 2, 'Cancelled event due to scheduling conflict', NOW() - INTERVAL 5 DAY),
  (4, 4, 'CREATE_EVENT', 'event', 3, 'Created event Tech Networking Night', NOW() - INTERVAL 7 DAY);

