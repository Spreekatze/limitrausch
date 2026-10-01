# Aetheris

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

The server listens on port `3001` by default (override with `PORT`) and exposes
`GET /api/health`.
