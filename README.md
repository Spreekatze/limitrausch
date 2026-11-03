# Limitrausch

Limitrausch is a community project for **Final Fantasy XIV**, combining event management with plans for gaming guides and other community features.

The project is organized as an npm workspace monorepo:

- `frontend/` — Vue 3 application built with Quasar
- `backend/` — Express API written in TypeScript
- `contracts/` — Shared TypeScript schemas and API contracts

## Prerequisites

- Node.js and npm
- Docker and Docker Compose
- Git

## Getting Started

### 1. Install dependencies

Clone the repository and install the dependencies from the project root:

```bash
npm install
```

### 2. Configure environment variables

Copy the relevant `.env.example` files to `.env` files and configure the required variables for your local environment.

Environment files are intentionally excluded from version control. Never commit real credentials, API keys, or secrets.

### 3. Start PostgreSQL

Start the local PostgreSQL service using Docker Compose:

```bash
docker compose up -d
docker compose ps
```

The database uses a persistent Docker volume, so its data survives container restarts.

The default development connection URL is:

```text
postgresql://limitrausch:limitrausch-dev-only@localhost:5432/limitrausch
```

To change the development password or host port, configure `POSTGRES_PASSWORD` or `POSTGRES_PORT` in the root `.env` file and update the backend connection URL accordingly.

**Important:** These credentials are for local development only. Do not use them in production.

To stop the services:

```bash
docker compose down
```

This does not remove the persistent database volume. Use `docker compose down -v` only if you intentionally want to delete the persisted database data.

### 4. Start the application

Start the frontend and backend in separate terminals from the repository root:

```bash
npm run dev --workspace=frontend
```

```bash
npm run dev --workspace=backend
```

The backend listens on port `3000` by default. The frontend uses the development server configured by Quasar.

Make sure the environment variables and database are configured before starting the backend.

## Development Commands

Run the following commands from the repository root.

| Command             | Description                                            |
| ------------------- | ------------------------------------------------------ |
| `npm run typecheck` | Type-check the shared contracts, frontend, and backend |
| `npm run lint`      | Check code style and lint rules                        |
| `npm run lint:fix`  | Automatically fix supported lint issues                |
| `npm test`          | Run the available workspace tests                      |
| `npm run build`     | Build the contracts, frontend, and backend             |

The shared contracts are built before the frontend and backend where required.

The test command runs Vitest suites for all three workspaces. Frontend component
tests run in jsdom; backend route integration tests use an ephemeral local HTTP
server. Tests mock Discord and PostgreSQL boundaries, so they do not require
credentials, a running database, or external network access. To run one
workspace only, use `npm test --workspace=frontend`,
`npm test --workspace=backend`, or
`npm test --workspace=@limitrausch/contracts`.

## Database Migrations

Database migrations are managed with `node-pg-migrate`.

Run the following commands from the repository root:

```bash
# Create a new migration
npm run create-migration --workspace=backend -- <migration-name>

# Preview pending migrations without applying them
npm run migrate-dry --workspace=backend

# Apply pending migrations
npm run migrate --workspace=backend
```

The migration commands load environment variables from the root `.env` file.

Review generated migrations before applying them to a database.

## Project Status

Limitrausch is under active development. Features, APIs, and setup instructions may change as the project evolves.
