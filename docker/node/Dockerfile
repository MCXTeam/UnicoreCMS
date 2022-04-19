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

RUN yarn global add nuxt
RUN npx lerna bootstrap
RUN yarn workspace unicore-common build
RUN yarn workspace unicore-server build
RUN yarn workspace unicore-admin build
RUN yarn workspace unicore-client build
RUN npm link -w unicore-server

USER node

CMD ["yarn", "start"]