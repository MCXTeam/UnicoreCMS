import { EmailMessageType } from '../enums/email-message-type.enum';

export const LEGACY_EMAIL_TEMPLATES = [
  {
    id: EmailMessageType.Activation,
    title: 'Подтверждение регистрации',
    content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>Добро пожаловать на {SITENAME}!</p><p>Код активации вашего аккаунта:</p><h2>{CODE}</h2>`,
  },
  {
    id: EmailMessageType.Reset,
    title: 'Восстановление доступа',
    content: `<h1>Сбросить пароль?</h1><p><br></p><p>Вы запросили сброс пароля для {USERNAME}, перейдите по ссылке подтверждения ниже, чтобы завершить процесс. </p><p>{LINK}</p><p><br></p><p>Запрос отправлен с IP: {IP}</p>`,
  },
  {
    id: EmailMessageType.Device,
    title: 'Вход с нового устройства',
    content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>В ваш аккаунт был выполнен вход с нового устройства, если это не вы, немедленно смените пароль!</p><p><br></p><p>IP-адресс: {IP}</p>`,
  },
  {
    id: EmailMessageType.Gift,
    title: 'Вам подарок',
    content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>Игрок {SENDER} сделал вам подарок на {SITENAME}: {GIFT}.</p><p>Подарок уже выдан, загляните в личный кабинет.</p>`,
  },
  {
    id: EmailMessageType.EmailChange,
    title: 'Подтверждение новой почты',
    content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>Этот адрес указан как новая почта аккаунта на {SITENAME}.</p><p>Код подтверждения:</p><h2>{CODE}</h2><p><br></p><p>Если вы этого не делали, просто не вводите код — почта останется прежней.</p>`,
  },
  {
    id: EmailMessageType.EmailChanged,
    title: 'Почта аккаунта изменена',
    content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>Почта аккаунта на {SITENAME} изменена на {EMAIL}.</p><p>Если это были не вы, срочно свяжитесь с администрацией: доступ к аккаунту нужно вернуть.</p>`,
  },
];
