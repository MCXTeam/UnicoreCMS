FROM node:22-bookworm-slim
COPY --from=docker:cli /usr/local/bin/docker /usr/local/bin/docker
RUN apt-get update && apt-get install -y --no-install-recommends git mariadb-client python3 make g++ pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate
ENV CI=true
ENV DOCKER_BUILDKIT=0
WORKDIR /app
