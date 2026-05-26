# EventFlow relational model (Phase 2)

This document explains how the schema implements the required relationship types using real MySQL foreign keys and junction tables.

## One-to-One

### `users` ↔ `administrators`
- **Table mapping:** `administrators.user_id` is both:
  - a **PRIMARY KEY** (unique per administrator)
  - a **FOREIGN KEY** referencing `users.id`
- **Constraint:** `fk_administrators_user_id`
- **Effect:** Each administrator is exactly one user account, and each user account can be an administrator at most once.

## One-to-Many

### `events` → `comments`
- `comments.event_id` is a foreign key to `events.id`
- A single event can have many comments.

### `users` → `comments`
- `comments.user_id` is a foreign key to `users.id`
- A single user can write many comments (across different events).

### `events` → `ratings`
- `ratings.event_id` is a foreign key to `events.id`
- An event can receive many ratings.

### `users` → `ratings`
- `ratings.user_id` is a foreign key to `users.id`
- A user can rate many different events.

### `events` → `tickets`
- `tickets.event_id` references `events.id`
- An event can have many tickets.

### `users` → `tickets` (ticket ownership)
- `tickets.owner_user_id` references `users.id`
- Each ticket belongs to exactly one user (ticket ownership).

## Many-to-Many

### `events` ↔ `categories` (event categories)
- Implemented by the junction table: `event_categories`
- **Primary key:** (`event_id`, `category_id`)
- **Foreign keys:**
  - `event_categories.event_id` → `events.id` (CASCADE)
  - `event_categories.category_id` → `categories.id` (RESTRICT)
- **Effect:** An event can have multiple categories; a category can be used by multiple events.

### `users` ↔ `events` (user favorites)
- Implemented by the junction table: `favorites`
- **Primary key:** (`user_id`, `event_id`)
- **Foreign keys:**
  - `favorites.user_id` → `users.id` (CASCADE)
  - `favorites.event_id` → `events.id` (CASCADE)
- **Effect:** A user can favorite many events, and an event can be favorited by many users.

## Rating uniqueness rule

Although `ratings` is modeled as a one-to-many pattern (events/users → ratings), it also enforces:
- **One rating per user per event**
- Implemented via a **UNIQUE KEY:** (`event_id`, `user_id`)

This matches typical event platforms and prevents duplicate rating submissions.

## Ticket identity + QR payload readiness

The schema includes stable, unique values needed for QR functionality:
- `tickets.ticket_code` (UNIQUE)
- `tickets.qr_code_value` (UNIQUE)

During the later backend phase, the backend will generate QR codes using `tickets.qr_code_value` and embed validation using the same stable identifier.

