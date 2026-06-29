# syntax=docker/dockerfile:1
# ============================================================================
# Convexa dashboard (React 19 + Vite + MUI) — multi-stage image.
#
# BUILD CONTEXT = REPO ROOT (mandatory). The dashboard imports @org/api from
# libs/api as SOURCE (resolved via the @org/source customCondition + the npm
# workspace link), so building from apps/dashboard alone FAILS — the build needs
# libs/api/src, the root package.json + package-lock.json, nx.json, and
# tsconfig.base.json. Build it from the repo root:
#   docker build -f apps/dashboard/Dockerfile -t convexa-web .
# The root .dockerignore keeps the context tight (excludes node_modules/.git/dist/
# .env*/apps/api/.venv/etc.) while KEEPING libs/ + apps/dashboard/ source.
#
# No secrets: the static bundle is server-side-key-free (ANTHROPIC_API_KEY etc.
# are all backend-only). NON-GOAL (noted, not built): in production the static
# bundle commonly ships to a CDN / object storage rather than a container; that
# is a `deploy`-time decision, intentionally not designed here.
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1 — builder: install the workspace + build the dashboard through Nx.
# ----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Bring in the whole (dockerignore-filtered) workspace, then install. We copy
# everything because the Nx project graph + the @org/source workspace resolution
# need the root manifests AND libs/api source present together. node_modules is
# excluded by .dockerignore, so `npm ci` materializes the workspace symlinks
# (node_modules/@org/api -> libs/api) deterministically from package-lock.json.
COPY . .
RUN npm ci

# Build via Nx (NOT raw `vite build`): the project graph + the @org/source
# customCondition are what make @org/api-as-source resolve. Output: the Vite
# build.outDir './dist' (relative to apps/dashboard) => /app/apps/dashboard/dist.
RUN npx nx build @org/dashboard

# ----------------------------------------------------------------------------
# Stage 2 — runtime: serve the static bundle with non-root nginx.
# ----------------------------------------------------------------------------
# nginxinc/nginx-unprivileged runs as a non-root user and listens on 8080 by
# default — purpose-built for this, no hand-rolled chown/pid dance, no USER root.
FROM nginxinc/nginx-unprivileged:1.27-alpine

# SPA + /api proxy config (replaces the default server block).
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

# The built static bundle.
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

EXPOSE 8080

# Liveness probe: busybox wget (present in alpine) against the SPA index.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# Image default CMD (nginx -g 'daemon off;') is inherited; stays non-root.
