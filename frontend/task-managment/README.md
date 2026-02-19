# Frontend - Task & Team Management

## Run locally
```bash
npm install
cp .env.example .env
npm run dev
```

## Build
```bash
npm run build
```

## Environment
- `VITE_API_URL`: backend base URL

## Key UI Modules
- `src/components/ui`: reusable primitives (Button, Card, FormInput, Modal, Skeleton, Badge)
- `src/components/task`: task board and task card
- `src/layouts`: app shell with sidebar/navbar
- `src/pages`: auth, teams, projects, dashboard
- `src/services`: API layer and request handling
- `src/contexts`: global auth/workspace state
