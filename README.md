# Automation Platform

This project is a production-grade automation platform centered around n8n workflows, API integrations, and a React-based visualization dashboard.

## Architecture

- **n8n**: Workflow orchestration engine.
- **Backend**: Node.js/Express API handling authentication, logs, metrics, and n8n triggering.
- **Frontend**: React (Vite + MUI) dashboard for monitoring executions and metrics.
- **Database**: PostgreSQL storing logs, user data, and n8n internal data.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (for local development)

### Running with Docker (Recommended)

1. Copy `.env.example` to `.env` and configure secrets.
   ```bash
   cp .env.example .env
   ```
2. Start the stack:
   ```bash
   docker compose up -d
   ```
3. Access services:
   - **Frontend**: http://localhost:3000 (Login: admin / admin123)
   - **n8n Editor**: http://localhost:5678
   - **Backend API**: http://localhost:8080

### Local Development

**Backend**:

```bash
cd backend
npm install
npm start
```

**Frontend**:

```bash
cd frontend
npm install
npm run dev
```

## Features

- **Auth**: JWT-based authentication with user management in PostgreSQL.
- **Visualization**: Real-time charts for success/failure rates.
- **Logs**: Centralized logging of workflow executions via database.
- **Integration**: REST APIs to trigger workflows and fetch status.

## Default Credentials

- **Platform Admin**: `admin` / `admin123`
- **n8n**: Setup required on first launch.

## License

MIT
