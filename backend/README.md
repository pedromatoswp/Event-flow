# EventFlow Backend

Express.js + TypeScript + MySQL2 REST API — MVC Architecture.

## Setup

```bash
cd backend
npm install
# Create the database and tables:
mysql -u root -p < schema.sql
# Copy and fill env:
cp .env .env.local
npm run dev
```

Server runs on `http://localhost:3001`

### Demo accounts (after running `database/00_schema.sql` + `01_seed.sql`)

| Role  | Email                     | Password   |
|-------|---------------------------|------------|
| User  | client1@eventflow.local   | client123  |
| Admin | admin@eventflow.local     | admin123   |

You can also register any new account via `POST /api/v1/auth/register` (password min. 6 characters).

---

## Environment Variables

| Variable        | Default          | Description              |
|-----------------|------------------|--------------------------|
| DB_HOST         | localhost        | MySQL host               |
| DB_PORT         | 3306             | MySQL port               |
| DB_USER         | root             | MySQL user               |
| DB_PASSWORD     | senai103         | MySQL password           |
| DB_NAME         | Event-flow       | Database name            |
| PORT            | 3001             | API port                 |
| JWT_SECRET      | —                | JWT signing secret       |
| JWT_EXPIRES_IN  | 7d               | JWT expiry               |
| BCRYPT_ROUNDS   | 10               | Bcrypt cost factor       |
| FRONTEND_URL    | http://localhost:3000 | CORS origin        |

---

## API Reference  `BASE: /api/v1`

### Auth
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| POST   | /auth/register            | —        | Register user       |
| POST   | /auth/login               | —        | Login               |
| GET    | /auth/me                  | Bearer   | Current user        |
| PUT    | /auth/change-password     | Bearer   | Change password     |

### Users
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| GET    | /users                    | Admin    | List all users      |
| POST   | /users                    | Admin    | Create user         |
| GET    | /users/:id                | Bearer   | Get user            |
| PUT    | /users/:id                | Bearer   | Update user         |
| DELETE | /users/:id                | Admin    | Delete user         |
| GET    | /users/:id/events         | —        | User's events       |
| GET    | /users/:id/tickets        | Bearer   | User's tickets      |

### Events
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| GET    | /events                   | Optional | List events         |
| POST   | /events                   | Bearer   | Create event        |
| GET    | /events/:id               | Optional | Get event           |
| PUT    | /events/:id               | Bearer   | Update event        |
| DELETE | /events/:id               | Bearer   | Delete event        |
| GET    | /events/:id/comments      | —        | Event comments      |
| GET    | /events/:id/ratings       | —        | Event ratings       |

### Tickets
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| GET    | /tickets                  | Admin    | List all tickets    |
| POST   | /tickets                  | Bearer   | Purchase ticket     |
| GET    | /tickets/:id              | Bearer   | Get ticket          |
| PUT    | /tickets/:id/cancel       | Bearer   | Cancel ticket       |
| PUT    | /tickets/:id/status       | Admin    | Update status       |

### Categories
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| GET    | /categories               | —        | List categories     |
| POST   | /categories               | Admin    | Create category     |
| GET    | /categories/:id           | —        | Get category        |
| GET    | /categories/:id/events    | —        | Category events     |
| PUT    | /categories/:id           | Admin    | Update category     |
| DELETE | /categories/:id           | Admin    | Delete category     |

### Comments
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| GET    | /comments                 | Admin    | List all comments   |
| POST   | /comments                 | Bearer   | Post comment        |
| GET    | /comments/:id             | —        | Get comment         |
| PUT    | /comments/:id             | Bearer   | Edit comment        |
| DELETE | /comments/:id             | Bearer   | Delete comment      |

### Ratings
| Method | Endpoint                  | Auth     | Description         |
|--------|---------------------------|----------|---------------------|
| GET    | /ratings                  | Admin    | List all ratings    |
| POST   | /ratings                  | Bearer   | Submit rating       |
| GET    | /ratings/:id              | —        | Get rating          |
| PUT    | /ratings/:id              | Bearer   | Edit rating         |
| DELETE | /ratings/:id              | Bearer   | Delete rating       |

### Admin
| Method | Endpoint                       | Auth  | Description          |
|--------|--------------------------------|-------|----------------------|
| GET    | /admin/dashboard               | Admin | Dashboard stats      |
| GET    | /admin/reports/revenue         | Admin | Revenue report       |
| GET    | /admin/reports/events          | Admin | Events stats         |
| PUT    | /admin/users/:id/ban           | Admin | Ban user             |
| PUT    | /admin/users/:id/unban         | Admin | Unban user           |
| DELETE | /admin/events/:id              | Admin | Force delete event   |

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # MySQL pool
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── usersController.ts
│   │   ├── eventsController.ts
│   │   ├── ticketsController.ts
│   │   ├── categoriesController.ts
│   │   ├── commentsController.ts
│   │   ├── ratingsController.ts
│   │   └── adminController.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT authenticate / requireAdmin
│   │   ├── errorHandler.ts   # Global error handler
│   │   └── validate.ts       # Request body validation
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── events.ts
│   │   ├── tickets.ts
│   │   ├── categories.ts
│   │   ├── comments.ts
│   │   ├── ratings.ts
│   │   └── admin.ts
│   ├── utils/
│   │   ├── db.ts             # query / execute / queryOne helpers
│   │   ├── jwt.ts            # signToken / verifyToken
│   │   └── response.ts       # sendSuccess / sendError helpers
│   ├── types/
│   │   └── index.ts          # AuthRequest, ApiResponse, etc.
│   ├── app.ts                # Express app + routes mount
│   └── server.ts             # Entry point
├── schema.sql                # DB schema + seed data
├── .env
├── package.json
└── tsconfig.json
```

## Default Admin

After running `schema.sql`:
- **Email:** admin@eventflow.com  
- **Password:** password
