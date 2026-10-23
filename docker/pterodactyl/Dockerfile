ARG NODE_MAJOR=22
FROM node:${NODE_MAJOR}-trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends tini git mariadb-server mariadb-client python3 make g++ pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev ca-certificates curl && rm -rf /var/lib/apt/lists/*
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate && chmod -R a+rX /opt/corepack && usermod -l container -d /home/container node && groupmod -n container node && mkdir -p /home/container && chown container:container /home/container
COPY workspaces/updater /opt/unicore/updater
COPY compat/release-signing-public.pem /opt/unicore/release-signing-public.pem
ENV HOME=/home/container
ENV CI=true
ENV UNICORE_UPDATER_PTERODACTYL=1
WORKDIR /home/container
USER container
ENTRYPOINT ["/usr/bin/tini", "-g", "--", "node", "/opt/unicore/updater/src/pterodactyl-start.mjs", "/home/container"]
