<img src="https://github.com/MCXTeam/UnicoreCMS/blob/main/unicorecms.png?raw=true?v=2" />

# UnicoreCMS

[![Build Status](https://github.com/MCXTeam/UnicoreCMS/actions/workflows/build.yml/badge.svg)](https://github.com/MCXTeam/UnicoreCMS/actions)
<p>
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-05122A?style=flat&logo=TypeScript"/>&nbsp;
  <img alt="Nuxt.js" src="https://img.shields.io/badge/-Nuxt.js-05122A?style=flat&logo=Nuxt.js"/>&nbsp;
 </p>

<p>
  <a href="https://unicorecms.ru/docs/" target="_blank">Документация</a> |
  <a href="https://github.com/MCXTeam/UnicoreCMS/archive/refs/heads/main.zip">Скачать</a> |
  <a href="https://discord.gg/wn8fPjpvDn">Discord-сервер</a> |
  <a href="https://unicorecms.ru/screens" target="_blank">Картинки</a>
</p>

> **UnicoreCMS** - Headless CMS для модовых проектов Minecraft. Современные технологии и профессиональный подход, невероятная производительность и скорость. 

## Преимущества
- ***Современная***. Построен по последним технологиям. 
- ***Надёжная***. Проверена в производственной среде. 
- ***Быстрая***. Каждый компонент оптимизирован и обработает сверх-много запросов за сверх-мало времени. 
- ***Безопасная***. На ряду с актуальными версиями пакетов и современным концептом работы — неуязвима. 
- ***Не зависима от БД***. Поддерживает MySQL, MariaDB, MongoDB, Postgres, CockroachDB, SQLite, Microsoft SQL Server, Oracle или SAP Hana.
- ***Простая установка***. Docker или Manual? В обеих случаях установка довольно проста и описана [тут](install).
- ***Легко интегрируема***. Свои решения для простой интеграции с лаунчером и серверами ([UnicoreProvider](https://unicorecms.ru/docs/settings/unicore-provider) и [UnicoreConnect](https://unicorecms.ru/docs/settings/unicore-connect)). 
- ***OpenSource***. Нам нечего скрывать и вы можете лично в этом убедиться.

## Экосистема
Админ-панель, клиент и сервер разделены на 3 независимых приложения. Система может работать, как одно целое или, как вам угодно. 

## TechStack
- Клиент и админ-панель разработаны на Nuxt.JS, PrimeVue и Vuesax. 
- Сервер разработан на NestJS, Fastify и TypeORM. 
- ([UnicoreProvider](https://unicorecms.ru/docs/settings/unicore-provider) и [UnicoreConnect](https://unicorecms.ru/docs/settings/unicore-connect)) разработаны на Kotlin

### Интегрированные компоненты
- 👥 Система учётных записей пользователей. 
- 👀 **Публичные** профили пользователей. 
- 💼 Загрузка/Удаление скинов/плащей.
- 👑 Система [ролей и прав](https://unicorecms.ru/docs/admin/roles-and-perms) пользователей, принцип работы схож с PEX/LuckPerms. Встроенные группы для default и banned (например можно запретить перевод денег заблокированным на серверах пользователям) 
- 🔑 Авторизация на основе JWT- токенов (Access/Refresh). 
- 📜 Система сеансов, история авторизаций. 
- 📱 **Двухфакторная авторизация**. 
- 🔒 Смена/Восстановление пароля подтверждение Email. 
- 💪 **Админ-Панель**, охватывающая весь функционал системы (далее ПУ) 
- 📚 [Статические страницы](https://unicorecms.ru/docs/admin/pages), автоматически генерируемые **статические страницы для описания серверов и донат-групп**. 
- 🛡 **Логирование действий** в ЛК и магазине. 
- ⚔️ Сбор внутриигровой статистики PlayTime (мультисерверно). 
- 📊 **Real-Time мониторинг** на веб-сокетах. 
- 💡 [Новости](https://unicorecms.ru/docs/admin/news). Парсинг новостей с помощью [VK Longpoll](https://unicorecms.ru/docs/settings/vk-longpoll), копирование в Discord-канал за счёт [Вебхуков](https://unicorecms.ru/docs/admin/webhooks).
- 💎 ***E-Commerce***
  - Поддержка 7 [платёжных систем](https://unicorecms.ru/docs/settings/payment).
  - **Полная мультисерверность** двух следующих компонентов, **пересечения между серверами**. 
  - Продажа внутриигровых [товаров и китов](https://unicorecms.ru/docs/admin/store), группирование по **категориям**. 
  - Продажа внутриигровых [прав/групп](https://unicorecms.ru/docs/admin/donate-groups-and-perms)
  - Продажа [веб-прав](https://unicorecms.ru/docs/admin/roles-and-perms) (Например возможность загрузки HD-скина и т. д.) 
  - [Вознаграждения при голосовании](https://unicorecms.ru/docs/settings/votes) в мониторингах (TopCraft, MCTop, Minecraft-Raiting). 
  - Ежемесячные подарки для топ-голосующих. 
  - **Внутриигровая экономика** (мультисерверно). Перевод валюты между серверами, игроками, обмен валюты. 
### Внешние компоненты
- **UnicoreConnect** - **Sponge/Spigot-плагин** для двухнаправленной интеграции экономики, прав, групп, склада-покупок, банов и сбора статистики между сайтом и серверами. [Подробнее](https://unicorecms.ru/docs/settings/unicore-connect).
- **UnicoreProvider** - серверный модуль **GravitLauncher** для интеграции сервисов авторизации. [Подробнее](https://unicorecms.ru/docs/settings/unicore-provider).
