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
RUN npx lerna bootstrap
RUN yarn build