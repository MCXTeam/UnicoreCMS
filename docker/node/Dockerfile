FROM node:16-alpine

# Installing deps
RUN apk update && apk add --no-cache \
    yarn \
    tini \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /usr/local/app

# Installing UnicoreCMS
COPY . .

RUN npm i lerna@4.0.0 -g
RUN lerna bootstrap
RUN npm run build
RUN npm link -w unicore-server

USER node

CMD ["yarn", "start"]
