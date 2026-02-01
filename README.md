# Scalable E‑commerce (Backend)

**A Node.js + TypeScript backend for a scalable e-commerce demo.**

---

## Highlights

- **Express (TypeScript)** server with Object Oriented approach (Products, Orders)
- **Prisma** ORM with MariaDB/MySQL adapter
- **Apache Kafka (kafkajs)** for event-driven flows (order events, inventory management and email service)
- **MongoDB** used for document storage via Mongoose (Text search, autocomplete, and fuzzy search)
- Docker Compose snippets for Kafka, Zookeeper and Nginx

---

## Tech Stack

- Node.js + TypeScript
- Express
- Prisma (+ @prisma/adapter-mariadb)
- Kafka (kafkajs)
- MongoDB (mongoose)
- Docker / Docker Compose

---

## Quick note

- The repo also contains a json file for the postman collection that you can import and use.

---

## System Architecture

![alt text](<Scalable Ecommerce.png>)

---

## Quick start

1. Clone the repository

   ```bash
   git clone <repo-url>
   cd scalableEcommerce
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` in project root and set the required environment variables (example below).

4. Start developer server

   ```bash
   npm run dev
   ```

   - The server uses `tsx` for fast TS reloads. Default port: `3000` (configurable via `PORT`).

---

## Environment variables

Create a `.env` file with at least these variables:

```
PORT=3000
NODE_ENV=development
MONGO_URI= <your_url>

# MariaDB / MySQL (used by Prisma adapter)
DATABASE_URL= <your_url>
DATABASE_HOST= <your_host>
DATABASE_USER= <your_user>
DATABASE_PASSWORD= <your_password>
DATABASE_NAME= ecommerce
```

> The project expects a MariaDB/MySQL-compatible server for Prisma. See `prisma/schema.prisma` for schema and `src/lib/prisma.ts` for adapter configuration.

---

## Setup Notes

- Kafka brokers are configured to `localhost:9092` by default. Docker Compose provided includes Zookeeper and a Kafka service (see `docker-compose.yml`).
- Mongo connection is handled by `src/config/mongo.ts`. Ensure `MONGO_URI` points to a running MongoDB instance.
- Prisma models and migrations are in `prisma/`.

---

## Prisma: generate & migrations

- Generate client:

  ```bash
  npx prisma generate
  ```

- Create and apply a migration (development):

  ```bash
  npx prisma migrate dev --name <migration_name>
  ```

- You can inspect migrations in `prisma/migrations/`.

---

## Docker

- Start Kafka & Zookeeper (and Nginx if needed):

  ```bash
  docker compose up -d
  ```

- If you prefer, add MariaDB / MySQL and MongoDB services to `docker-compose.yml` or run them separately.

---

## 🛠 Development tips

- Main entry: `src/index.ts` (bootstraps Kafka producers/consumers, Mongo connection, and routes)
- Dev script: `npm run dev` (uses `tsx watch` for fast iteration)
- Build: `npm run build` (TypeScript compiler)

---

## Important files

- `src/` — application code (routes, services, config)
- `prisma/` — Prisma schema & migrations
- `docker-compose.yml` — Kafka/Zookeeper/Nginx services
- `nginx/nginx.conf` — Nginx config used by compose
