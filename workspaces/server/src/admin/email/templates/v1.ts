import { EmailMessageType } from '../enums/email-message-type.enum';

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<div style="margin:24px 0;padding:16px;background:#f4f7f8;border-radius:10px;"><p style="margin:0 0 8px;color:#606770;font-size:14px;">${label}</p><p style="margin:0;font-weight:700;overflow-wrap:anywhere;word-break:break-word;">${value}</p></div>`;
}

function code(): string {
  return `<div style="margin:24px 0;padding:24px 16px;background:#f5e9f7;border:1px solid #e8cbed;border-radius:10px;text-align:center;"><p style="margin:0 0 8px;color:#606770;font-size:14px;">Код подтверждения</p><p style="margin:0;color:#7b1fa2;font-family:Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:4px;">{CODE}</p></div>`;
}

function layout(title: string, preheader: string, body: string, note: string): string {
  return `<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f7f8;color:#212529;font-family:'Segoe UI',Arial,sans-serif;font-size:16px;line-height:1.5;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f8;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;table-layout:fixed;">
<tr><td style="padding:0 8px 24px;color:#7b1fa2;font-size:20px;font-weight:700;overflow-wrap:anywhere;word-break:break-word;">{SITENAME}</td></tr>
<tr><td style="padding:32px 24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow-wrap:anywhere;word-break:break-word;">
<h1 style="margin:0 0 24px;color:#212529;font-size:24px;line-height:1.3;font-weight:700;">${title}</h1>
${paragraph('Привет, {USERNAME}!')}${body}
<p style="margin:24px 0 0;padding-top:24px;border-top:1px solid #e5e7eb;color:#606770;font-size:14px;">${note}</p>
</td></tr>
<tr><td style="padding:24px 8px 0;color:#606770;font-size:12px;overflow-wrap:anywhere;word-break:break-word;">Письмо от {SITENAME} · Уведомления аккаунта</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export const EMAIL_TEMPLATES_V1 = [
  {
    id: EmailMessageType.Activation,
    title: '{SITENAME} — подтверждение регистрации',
    content: layout('Добро пожаловать!', 'Остался один шаг — подтвердите почту на {SITENAME}.',
      paragraph('Рады видеть вас на {SITENAME}. Введите этот код на сайте, чтобы подтвердить почту и завершить регистрацию.') + code(),
      'Если вы не регистрировались, просто проигнорируйте письмо. Никому не сообщайте код.'),
  },
  {
    id: EmailMessageType.Reset,
    title: '{SITENAME} — восстановление доступа',
    content: layout('Восстановление доступа', 'Ссылка для смены пароля на {SITENAME}.',
      paragraph('Получили запрос на смену пароля вашего аккаунта. Нажмите кнопку, чтобы задать новый пароль.') +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td bgcolor="#9c27b0" style="border-radius:10px;text-align:center;mso-padding-alt:12px 24px;"><a href="{LINK}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">Задать новый пароль</a></td></tr></table>` +
      `<p style="margin:0 0 16px;color:#606770;font-size:14px;">Если кнопка не работает, скопируйте ссылку в браузер:<br><a href="{LINK}" style="color:#7b1fa2;overflow-wrap:anywhere;word-break:break-all;">{LINK}</a></p>` +
      detail('IP-адрес запроса', '{IP}'),
      'Не запрашивали смену пароля? Просто проигнорируйте письмо — ваш пароль останется прежним.'),
  },
  {
    id: EmailMessageType.Device,
    title: '{SITENAME} — вход с нового устройства',
    content: layout('Новый вход в аккаунт', 'Проверьте, что это были вы.',
      paragraph('В ваш аккаунт на {SITENAME} вошли с нового устройства.') + detail('IP-адрес', '{IP}'),
      'Если это были вы, ничего делать не нужно. Если нет — сразу смените пароль и завершите другие сеансы в настройках аккаунта.'),
  },
  {
    id: EmailMessageType.Gift,
    title: '{SITENAME} — вам подарок!',
    content: layout('Вам подарок!', '{SENDER} отправил вам подарок на {SITENAME}.',
      paragraph('Игрок {SENDER} приготовил для вас подарок на {SITENAME}.') + detail('Ваш подарок', '{GIFT}') +
      paragraph('Он уже выдан. Загляните в личный кабинет!'),
      'Это уведомление о полученном подарке. Подтверждать получение или платить за него не нужно.'),
  },
  {
    id: EmailMessageType.EmailChange,
    title: '{SITENAME} — подтверждение новой почты',
    content: layout('Подтвердите новую почту', 'Код для смены почты аккаунта на {SITENAME}.',
      paragraph('Этот адрес указан как новая почта вашего аккаунта на {SITENAME}. Введите код на сайте, чтобы подтвердить изменение.') + code(),
      'Если вы не меняли почту, не вводите и никому не сообщайте код. Прежний адрес останется привязан к аккаунту.'),
  },
  {
    id: EmailMessageType.EmailChanged,
    title: '{SITENAME} — почта аккаунта изменена',
    content: layout('Почта аккаунта изменена', 'Новый адрес почты вашего аккаунта на {SITENAME}.',
      paragraph('У вашего аккаунта на {SITENAME} теперь другой адрес почты.') + detail('Новая почта', '{EMAIL}'),
      'Если вы не меняли почту, срочно свяжитесь с администрацией проекта, чтобы вернуть доступ к аккаунту.'),
  },
];
