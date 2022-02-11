FROM node:16-alpine

WORKDIR /usr/local/app
COPY . .

RUN yarn global add lerna @nestjs/cli 2> >(grep -v warning 1>&2)
RUN npx lerna bootstrap 2> >(grep -v warning 1>&2)
RUN npm run build -w unicore-common
COPY ./.env .
RUN yarn lerna run build --stream --parallel