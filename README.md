# Claims Manager

White-label claims management system for insurance brokers.

## Tech Stack

**Backend**

- Express 5.x with TypeScript
- Prisma ORM with PostgreSQL
- BetterAuth for authentication

**Frontend**

- React 19 with TypeScript
- Vite 7
- TanStack Router (file-based routing)
- TanStack Query (server state)
- Tailwind CSS 4 + shadcn/ui

**Tooling**

- npm workspaces (monorepo)
- ESLint 9 + Prettier
- Docker Compose for local database

## Prerequisites

- Node.js 22+
- Docker (for PostgreSQL)

## Getting Started

```bash
# Install dependencies
npm install

# Start PostgreSQL
npm run docker:up

# Setup database
npm run db:push -w @claims/api

# Start development servers
npm run dev
```

The API runs on http://localhost:3001 and the web app on http://localhost:5173.

## Available Commands

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Start both API and web servers |
| `npm run dev:api`     | Start API server only          |
| `npm run dev:web`     | Start web server only          |
| `npm run build`       | Build all workspaces           |
| `npm run typecheck`   | Type check all workspaces      |
| `npm run test`        | Run tests in all workspaces    |
| `npm run lint`        | Lint all files                 |
| `npm run lint:fix`    | Lint and fix issues            |
| `npm run format`      | Format all files               |
| `npm run docker:up`   | Start PostgreSQL container     |
| `npm run docker:down` | Stop PostgreSQL container      |

## Project Structure

```
├── apps/
│   ├── api/          # Express backend
│   │   ├── prisma/   # Database schema
│   │   └── src/
│   │       ├── lib/  # Auth, DB clients
│   │       └── routes/
│   └── web/          # React frontend
│       └── src/
│           ├── components/
│           ├── lib/  # API client, auth, query
│           └── routes/
├── packages/         # Shared packages (future)
├── docker-compose.yml
├── eslint.config.js
└── tsconfig.base.json
```
