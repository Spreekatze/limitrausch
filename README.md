# limitrausch

The project is split into `frontend/` (Quasar/Vue) and `backend/` (Express).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Useful commands: `npm run typecheck`, `npm run lint:check`, and `npm run build`.
See [Quasar configuration](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file).

## Backend

```bash
cd backend
npm install
npm run dev
```

The server listens on port `3000` by default (override with `PORT`)

## PostgreSQL (local development)

Docker Compose starts a local PostgreSQL database with a persistent Docker
volume:

```bash
docker compose up -d postgres
docker compose ps
docker compose down
```

The default development connection URL is
`postgresql://limitrausch:limitrausch-dev-only@localhost:5432/limitrausch`. To change the
development password or host port, set `POSTGRES_PASSWORD` or `POSTGRES_PORT`
in a root `.env` file; update the password in the connection URL accordingly.
These defaults are for local development only, not production.

The backend's event store is still in memory and does not use this database yet.
The Compose setup only provides the local PostgreSQL service; connecting the
event store and adding its schema is a separate step.

Generate migrations with `npx node-pg-migrate create <name of migration>`.
