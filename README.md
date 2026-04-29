# Funny Movies

## Introduction

Funny Movies is a Rails + React app for sharing YouTube videos. Users can register, log in, share a video, browse previously shared videos, and receive real-time notifications when another user shares a new one.

## Prerequisites

- Ruby `3.3.6`
- Bundler `2.5.22`
- Node.js `20+`
- npm bundled with Node.js
- PostgreSQL
- Redis
- Docker Desktop with Docker Compose v2 for the containerized setup

## Recommended Environment

This project was developed and tested in a WSL2 Ubuntu on Windows.

The manual Ruby/Rails setup assumes a Unix-like shell environment. The Docker Compose setup should work on Windows with Docker Desktop.

For the most reliable local setup, use Docker Compose. A manual setup path is also included below for Ubuntu/WSL.

## Installation & Configuration

```bash
git clone https://github.com/vodacbaoan/Youtube-Video-Sharing.git
cd Youtube-Video-Sharing
```

The manual setup below assumes the prerequisite versions of Ruby, Bundler, Node.js, and npm are already installed. On Ubuntu/WSL, avoid `apt install nodejs npm`; it can install Node `18.x`, which causes `npm install` `EBADENGINE` warnings.

Install Node with a version manager such as `nvm`:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
exec "$SHELL"
nvm install 20
nvm use 20
node --version
npm --version
```

Backend:

```bash
cd backend
bundle _2.5.22_ install
```

Frontend:

```bash
cd ../frontend
npm install
```

Important defaults:

- Backend DB port: `5432`
- Redis URL: `redis://localhost:6379/0`
- Frontend origin: `http://localhost:5173`
- Frontend API URL default: `http://localhost:3000`

Useful env vars:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_URL`
- `CABLE_REDIS_URL`
- `FRONTEND_ORIGIN`
- `VITE_API_URL`

No additional environment variables are required for the default local setup. Override the values above only if your local ports, hosts, or service URLs differ from the defaults.

## Database Setup

Start PostgreSQL first. If you do not already have a local PostgreSQL service running, start one with Docker:

```bash
docker run --name funny-movies-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

If the container already exists:

```bash
docker start funny-movies-postgres
```

From `backend/`:

```bash
bin/rails db:prepare
```

No seed data is required.

## Running the Application

Start Redis first. If you do not already have a local Redis service running, start one with Docker:

```bash
docker run --name funny-movies-redis -p 6379:6379 -d redis:7
```

If the container already exists:

```bash
docker start funny-movies-redis
```

Backend:

```bash
cd backend
bin/rails db:prepare
bin/rails server
```

Sidekiq worker:

```bash
cd backend
bin/jobs
```

Frontend:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/cable`
- Redis: `redis://localhost:6379/0`

Run tests:

```bash
cd backend
bin/rails test
```

```bash
cd frontend
npm test
```

```bash
cd frontend
npm run build
npm run lint
```

## Docker Deployment

A full local Docker Compose setup is included for PostgreSQL, Redis, Rails, Sidekiq, and the React frontend.

Start the full stack:

```bash
docker compose up --build
```

Or run it detached:

```bash
docker compose up -d --build
```

Open the app:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- WebSocket: `ws://localhost:3000/cable`

Useful Docker commands:

```bash
docker compose logs -f
docker compose down
docker compose down -v
```

Notes:

- The backend container runs `bin/rails db:prepare` on startup.
- Compose healthchecks wait for PostgreSQL and Redis to be ready before Rails starts.
- The Sidekiq worker starts only after the backend is healthy, so notification jobs do not race the initial boot.
- The frontend image is a production-style static build served by Nginx.
- `docker compose down -v` removes the PostgreSQL and Redis volumes if you want a clean reset.

## Usage

1. Register or log in.
2. Share a YouTube URL.
3. See the video appear in the list.
4. Other logged-in users receive a real-time notification banner.

## Troubleshooting

- `bin/rails db:prepare` fails:
  Check that PostgreSQL is running and that the port matches `5432` or your override.
- `bundle install` fails with a Bundler version mismatch or `/var/lib/gems/...` permission error:
  Check that you are using Ruby `3.3.6` and Bundler `2.5.22`, not the Ubuntu system Ruby/Bundler packages.
- Notifications do not appear:
  Check that Redis is running and `bin/jobs` is running.
- Frontend shows `Backend is unreachable`:
  Check that Rails is running on `3000` and `VITE_API_URL` is correct.
- Frontend shows `Request timed out after 10000ms`:
  The backend was reachable but too slow to respond.
- `docker compose up --build` fails because ports are already in use:
  Stop anything already bound to `3000`, `5173`, `5432`, or `6379`, or change the published ports in `docker-compose.yml`.
- `docker compose up --build` stalls while starting services:
  Run `docker compose ps` and `docker compose logs backend worker postgres redis` to see which healthcheck is failing.
- Two tabs appear to switch to the same logged-in user:
  This app uses cookie-based authentication, so tabs in the same browser profile share the same session. To test notifications between different users, use two different browsers, two separate browser profiles, or two different devices.
- Some YouTube videos cannot play in the iframe:
  This is a YouTube embedding restriction.
