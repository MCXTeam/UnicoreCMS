# UnicoreCMS

<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-05122A?style=flat&logo=TypeScript"/>&nbsp;
  <img alt="Nuxt.js" src="https://img.shields.io/badge/-Nuxt.js-05122A?style=flat&logo=Nuxt.js"/>&nbsp;
 </p>
 
[![Build Status](https://github.com/UnicoreProject/UnicoreCMS/actions/workflows/build.yml/badge.svg)](https://github.com/UnicoreProject/UnicoreCMS/actions)

> ...

# Docker Commands

docker exec -t -i unicorecms npm run sync
docker exec -t -i unicorecms npm run seed
docker exec -t -i unicorecms npm run build

# Starting
## Full
docker-compose --profile nginx --profile prod up

## Without Nginx
docker-compose --profile app up

## Dev-mode
docker-compose --profile dev up