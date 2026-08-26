import type { FieldOption, FieldSettings, FieldCondition } from './constants'

export interface PresetField {
  key: string
  type: string
  label: string
  hint?: string
  placeholder?: string
  required?: boolean
  half?: boolean
  options?: FieldOption[]
  settings?: FieldSettings
  visible_if?: FieldCondition
}

export interface PresetForm {
  id: string
  name: string
  summary: string
  icon: string
  admin_icon: string
  slug: string
  title: string
  description: string
  submit_label?: string
  success_text: string
  auth_only: boolean
  once: boolean
  cooldown_hours: number
  fields: PresetField[]
}

export const FORM_PRESETS: PresetForm[] = [
  {
    id: 'staff',
    name: 'mod.forms.preset_staff',
    summary: 'mod.forms.preset_staff_summary',
    icon: 'bx bx-user-plus',
    admin_icon: 'pi pi-user-plus',
    slug: 'staff',
    title: 'Заявка в команду',
    description: 'Расскажите о себе — заявку прочитает администрация и ответит в личном кабинете.',
    submit_label: 'Отправить заявку',
    success_text: 'Заявка принята. Ответ придёт в раздел «Мои заявки».',
    auth_only: true,
    once: false,
    cooldown_hours: 720,
    fields: [
      { key: 'age', type: 'number', label: 'Возраст', required: true, half: true, settings: { min: 12, max: 80 } },
      { key: 'timezone', type: 'text', label: 'Часовой пояс', placeholder: 'МСК+2', half: true, settings: { max_length: 32 } },
      { key: 'server', type: 'server', label: 'Сервер', hint: 'Сервер, на котором вы хотите помогать.', required: true, half: true },
      {
        key: 'role',
        type: 'select',
        label: 'Должность',
        required: true,
        half: true,
        options: [
          { value: 'helper', label: 'Хелпер' },
          { value: 'moder', label: 'Модератор' },
          { value: 'builder', label: 'Строитель' },
          { value: 'dev', label: 'Разработчик' },
        ],
      },
      { key: 'hours', type: 'slider', label: 'Часов в игре за неделю', required: true, settings: { min: 1, max: 40, step: 1 } },
      { key: 'contact', type: 'text', label: 'Discord', hint: 'Ник в Discord — по нему с вами свяжутся.', required: true, half: true, settings: { max_length: 64 } },
      { key: 'experience', type: 'textarea', label: 'Опыт', hint: 'Где и кем работали раньше, если работали.', settings: { max_length: 1500, rows: 4 } },
      { key: 'about', type: 'textarea', label: 'Почему вы', hint: 'Чем вы будете полезны команде.', required: true, settings: { min_length: 80, max_length: 2000, rows: 5 } },
      { key: 'rules', type: 'checkbox', label: 'Я прочитал правила проекта', required: true },
    ],
  },
  {
    id: 'feedback',
    name: 'mod.forms.preset_feedback',
    summary: 'mod.forms.preset_feedback_summary',
    icon: 'bx bx-message-dots',
    admin_icon: 'pi pi-comments',
    slug: 'feedback',
    title: 'Обратная связь',
    description: 'Напишите, что понравилось, что мешает и чего не хватает.',
    submit_label: 'Отправить',
    success_text: 'Спасибо, сообщение получено.',
    auth_only: false,
    once: false,
    cooldown_hours: 1,
    fields: [
      {
        key: 'topic',
        type: 'select',
        label: 'Тема',
        required: true,
        options: [
          { value: 'idea', label: 'Предложение' },
          { value: 'problem', label: 'Проблема' },
          { value: 'payment', label: 'Оплата' },
          { value: 'other', label: 'Другое' },
        ],
      },
      { key: 'message', type: 'textarea', label: 'Сообщение', required: true, settings: { min_length: 20, max_length: 3000, rows: 6 } },
      { key: 'rating', type: 'rating', label: 'Оценка проекта', settings: { stars: 5 } },
    ],
  },
  {
    id: 'bug',
    name: 'mod.forms.preset_bug',
    summary: 'mod.forms.preset_bug_summary',
    icon: 'bx bx-bug',
    admin_icon: 'pi pi-wrench',
    slug: 'bug',
    title: 'Сообщить о баге',
    description: 'Опишите поломку так, чтобы её можно было повторить.',
    submit_label: 'Отправить баг',
    success_text: 'Баг записан. Если понадобятся подробности, с вами свяжутся.',
    auth_only: true,
    once: false,
    cooldown_hours: 0,
    fields: [
      { key: 'server', type: 'server', label: 'Сервер', required: true, half: true },
      {
        key: 'severity',
        type: 'select',
        label: 'Насколько мешает',
        required: true,
        half: true,
        options: [
          { value: 'low', label: 'Мелочь' },
          { value: 'medium', label: 'Мешает играть' },
          { value: 'high', label: 'Играть невозможно' },
        ],
      },
      { key: 'what', type: 'textarea', label: 'Что произошло', required: true, settings: { min_length: 20, max_length: 2000, rows: 4 } },
      { key: 'steps', type: 'textarea', label: 'Как повторить', hint: 'По шагам: что нажали, куда пришли, что увидели.', required: true, settings: { max_length: 2000, rows: 4 } },
      { key: 'screenshot', type: 'file', label: 'Скриншот', settings: { accept: 'image/*', max_size: 8 } },
    ],
  },
  {
    id: 'complaint',
    name: 'mod.forms.preset_complaint',
    summary: 'mod.forms.preset_complaint_summary',
    icon: 'bx bx-shield-x',
    admin_icon: 'pi pi-flag',
    slug: 'complaint',
    title: 'Жалоба на игрока',
    description: 'Без доказательств жалобу не рассмотрят — приложите скриншот или ссылку на запись.',
    submit_label: 'Отправить жалобу',
    success_text: 'Жалоба принята, решение придёт в раздел «Мои заявки».',
    auth_only: true,
    once: false,
    cooldown_hours: 0,
    fields: [
      { key: 'nickname', type: 'text', label: 'Ник нарушителя', required: true, half: true, settings: { max_length: 32 } },
      { key: 'server', type: 'server', label: 'Сервер', required: true, half: true },
      {
        key: 'rule',
        type: 'select',
        label: 'Что нарушил',
        required: true,
        options: [
          { value: 'cheats', label: 'Читы' },
          { value: 'grief', label: 'Гриферство' },
          { value: 'chat', label: 'Оскорбления в чате' },
          { value: 'scam', label: 'Обман при обмене' },
          { value: 'other', label: 'Другое' },
        ],
      },
      { key: 'when', type: 'date', label: 'Когда это было', required: true, half: true },
      { key: 'proof_link', type: 'url', label: 'Ссылка на запись', hint: 'YouTube, Google Диск — что угодно, лишь бы открывалось.', half: true },
      { key: 'proof_file', type: 'file', label: 'Скриншот', settings: { accept: 'image/*', max_size: 8 } },
      { key: 'details', type: 'textarea', label: 'Что случилось', required: true, settings: { min_length: 30, max_length: 2000, rows: 4 } },
    ],
  },
  {
    id: 'unban',
    name: 'mod.forms.preset_unban',
    summary: 'mod.forms.preset_unban_summary',
    icon: 'bx bx-lock-open',
    admin_icon: 'pi pi-unlock',
    slug: 'unban',
    title: 'Заявка на разбан',
    description: 'Одна заявка на игрока. Пока её рассматривают, новую отправить нельзя.',
    submit_label: 'Отправить заявку',
    success_text: 'Заявка на рассмотрении, решение придёт в раздел «Мои заявки».',
    auth_only: true,
    once: true,
    cooldown_hours: 0,
    fields: [
      { key: 'nickname', type: 'text', label: 'Ник в игре', required: true, half: true, settings: { max_length: 32 } },
      { key: 'server', type: 'server', label: 'Сервер', required: true, half: true },
      { key: 'reason', type: 'textarea', label: 'За что забанили', required: true, settings: { max_length: 1000, rows: 3 } },
      { key: 'guilty', type: 'switch', label: 'Согласен с баном' },
      { key: 'why', type: 'textarea', label: 'Почему стоит разбанить', required: true, settings: { min_length: 50, max_length: 2000, rows: 5 } },
      { key: 'rules', type: 'checkbox', label: 'Обязуюсь соблюдать правила', required: true },
    ],
  },
]

export const presetById = (id: string): PresetForm | undefined => FORM_PRESETS.find((item) => item.id === id)
