FROM ubuntu:latest

WORKDIR /usr/local/app

# Installing node & deps
RUN apt-get update && apt upgrade --yes
RUN apt-get install --yes curl
RUN curl --silent --location https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install --yes nodejs
RUN apt-get install --yes build-essential
RUN npm install --global yarn

# Installing UnicoreCMS
COPY . .
RUN mkdir -p ./node_modules
RUN mkdir -p ./workspaces/admin/node_modules
RUN mkdir -p ./workspaces/client/node_modules
RUN mkdir -p ./workspaces/common/node_modules
RUN mkdir -p ./workspaces/server/node_modules
RUN mkdir -p ./workspaces/admin/dist
RUN mkdir -p ./workspaces/admin/.nuxt
RUN mkdir -p ./workspaces/client/dist
RUN mkdir -p ./workspaces/client/.nuxt
RUN mkdir -p ./workspaces/common/dist
RUN mkdir -p ./workspaces/server/dist
RUN npx lerna bootstrap
RUN yarn build
COPY --from=unicorecms ./node_modules ./