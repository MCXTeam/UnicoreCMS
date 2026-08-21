import { defineModule } from 'unicore-api/server'
import { DemoChannel } from './demo.channel'
import { DemoModule } from './demo.module'
import { DemoNote } from './entities/note.entity'
import ru from '../locales/ru.json'
import en from '../locales/en.json'

export default defineModule({
  id: 'demo',
  entities: [DemoNote],
  nestModules: [DemoModule],
  webhookChannels: [new DemoChannel()],
  permissions: ['mod.demo.read', 'mod.demo.write'],
  config: [
    { key: 'greeting', type: 'string', default: 'Привет', public: true, label: 'mod.demo.config_greeting' },
    { key: 'limit', type: 'number', default: 10, min: 1, max: 100, label: 'mod.demo.config_limit' },
  ],
  locales: { ru, en },
  setup(context) {
    context.logger.log('Демо-модуль подключён')

    const note = async (uuid: string | null, text: string) => {
      await context
        .core()
        .db.getRepository(DemoNote)
        .save({ uuid, text })
    }

    context.events.on(
      'payment.paid',
      async (payload) => {
        await note(payload.uuid, `Оплата ${payload.amount} через ${payload.method}`)
      },
      context.id,
    )

    context.events.on(
      'gift.activated',
      async (payload) => {
        await note(payload.uuid, `Активирован промокод ${payload.promocode}`)
      },
      context.id,
    )

    context.events.on(
      'user.registered',
      async (payload) => {
        await note(payload.uuid, `Регистрация ${payload.username}`)
      },
      context.id,
    )

    context.events.on(
      'purchase.completed',
      async (payload) => {
        await note(payload.uuid, `Покупка ${payload.kind} #${payload.itemId} на сервере ${payload.serverId}`)
      },
      context.id,
    )

    context.events.on(
      'user.login',
      async (payload) => {
        await note(payload.uuid, `Вход ${payload.username} с ${payload.ip || 'неизвестного адреса'}`)
      },
      context.id,
    )

    context.events.on(
      'user.password.changed',
      async (payload) => {
        await note(payload.uuid, `Смена пароля ${payload.username}`)
      },
      context.id,
    )

    context.events.on(
      'core.ready',
      async () => {
        const core = context.core()
        const [online, methods] = await Promise.all([core.servers.online(), core.payments.methods()])

        context.logger.log(
          `Серверов онлайн: ${online.filter((server) => server.online).length} из ${online.length}, ` +
            `каналы вебхуков: ${core.webhooks.channels().join(', ')}, ` +
            `платёжные методы: ${methods.length ? methods.join(', ') : 'нет'}`,
        )
      },
      context.id,
    )
  },
})
