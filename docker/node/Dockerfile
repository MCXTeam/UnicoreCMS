# syntax=docker/dockerfile:1

# ---- builder ----
FROM node:26-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@11.20.0 --activate
WORKDIR /usr/local/app

# Install all workspace deps (frozen to the committed pnpm-lock.yaml)
COPY . .
ENV CI=true
RUN pnpm install --frozen-lockfile

# Build common + server + frontends
RUN pnpm run build

# ---- runtime ----
FROM node:26-bookworm-slim AS runtime

ENV NODE_ENV=production

# tini for PID1 signal handling + runtime shared libs required by node-canvas (skin rendering)
RUN corepack enable \
 && corepack prepare pnpm@11.20.0 --activate \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      tini \
      libcairo2 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libjpeg62-turbo \
      libgif7 \
      librsvg2-2 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/local/app
COPY --from=builder --chown=node:node /usr/local/app .

RUN mkdir -p storage logs && chown -R node:node storage logs && chown node:node /usr/local/app

USER node

ENTRYPOINT ["tini", "--"]
CMD ["pnpm", "run", "start"]
