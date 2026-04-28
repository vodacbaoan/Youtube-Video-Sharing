# Funny Movies

## Introduction

Funny Movies is a Rails + React app for sharing YouTube videos. Users can register, log in, share a video, browse previously shared videos, and receive real-time notifications when another user shares a new one.

## Prerequisites

- Ruby `3.3.6`
- Bundler
- Node.js `20+`
- npm
- PostgreSQL

## Installation & Configuration

```bash
git clone <repo-url>
cd youtube_share_project
```

Backend:

```bash
cd backend
bundle install
```

Frontend:

```bash
cd ../frontend
npm install
```

Important defaults:

- Backend DB port: `5432`
- Frontend origin: `http://localhost:5173`
- Frontend API URL default: `http://<current-hostname>:3000`

Useful env vars:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `FRONTEND_ORIGIN`
- `VITE_API_URL`

## Database Setup

From `backend/`:

```bash
bin/rails db:prepare
```

No seed data is required.

## Running the Application

Backend:

```bash
cd backend
bin/rails db:prepare
bin/rails server
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

Run tests:

```bash
cd backend
bin/rails test
```

```bash
cd frontend
npm run build
npm run lint
```

## Docker Deployment

A production-oriented Rails Dockerfile exists at `backend/Dockerfile`. A full local Docker Compose setup is not included yet.

Build the backend image:

```bash
cd backend
docker build -t funny-movies-backend .
```

Run PostgreSQL:

```bash
docker run --name youtube-share-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:16
```

Run the backend container:

```bash
docker run --rm \
  -p 3000:80 \
  -e POSTGRES_HOST=host.docker.internal \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  funny-movies-backend
```

Note:

- the Dockerfile is production-oriented
- frontend Docker setup is not included
- on Linux, `host.docker.internal` may need an alternative host mapping depending on your Docker setup

## Usage

1. Register or log in.
2. Share a YouTube URL.
3. See the video appear in the list.
4. Other logged-in users receive a real-time notification banner.

## Troubleshooting

- `bin/rails db:prepare` fails:
  Check that PostgreSQL is running and that the port matches `5432` or your override.
- Frontend shows `Backend is unreachable`:
  Check that Rails is running on `3000` and `VITE_API_URL` is correct.
- Frontend shows `Request timed out after 10000ms`:
  The backend was reachable but too slow to respond.
- Some YouTube videos cannot play in the iframe:
  This is a YouTube embedding restriction, not a local app bug.
