# ChatUp client

React and Vite frontend for the ChatUp chat application. The browser calls the backend through same-origin `/api` requests and connects to Socket.IO at the same origin. In development, Vite proxies both paths to the backend.

## Local development

Requirements: Node.js 22 or newer and a running backend at `http://localhost:7777`.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. If the backend is running elsewhere, set `VITE_BACKEND_URL` before starting Vite:

```sh
VITE_BACKEND_URL=http://localhost:7777 npm run dev
```

The backend must allow the frontend origin (`http://localhost:5173`) in `CORS_ORIGIN` and use `NODE_ENV=development` for local HTTP cookies.

## Validation

```sh
npm run lint
npm run build
npm run preview
```

## Production container

Build from this directory so the Docker build uses the client lockfile and files:

```sh
docker build -f Dockerfile -t chatup-client .
```

Run the frontend container with `BACKEND_HOST` and `BACKEND_PORT` pointing to the backend service reachable from the container network. Nginx serves the SPA, proxies `/api/` and `/socket.io/` to the backend, and serves `/health` for container health checks. Use HTTPS at the public load balancer so the backend's production auth cookie is sent by browsers.
