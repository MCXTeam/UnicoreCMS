import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, IsNull, LessThan, Not, Repository } from 'typeorm'
import { core } from 'unicore-api/server'
import type { ServerRecord, UserRecord } from 'unicore-api'
import {
  answerError,
  DEFAULT_MAX_SIZE_MB,
  fieldType,
  isEmptyAnswer,
  RESERVED_SLUGS,
  visibleFields,
  type AnswerValue,
  type ClosedReason,
  type FormFieldShape,
} from '../shared/constants'
import { GUEST_EMAIL, GUEST_NAME } from '../shared/constants'
import { presetById } from '../shared/presets'
import { FieldInput } from './dto/field.input'
import { FormCreateInput, FormInput } from './dto/form.input'
import { ReviewInput, SubmitInput } from './dto/submit.input'
import { FormField } from './entities/field.entity'
import { Form } from './entities/form.entity'
import { FormSubmission, SubmissionAnswer } from './entities/submission.entity'

const HOUR = 60 * 60 * 1000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DAY = 24 * HOUR
const INBOX_PAGE = 25

export interface FormAvailability {
  open: boolean
  reason?: ClosedReason
  until?: Date
}

export interface PublicForm {
  form: Form
  availability: FormAvailability
  servers: ServerRecord[]
  authorized: boolean
}

export interface InboxQuery {
  form?: number
  status?: string
  page?: number
}

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(Form) private readonly forms: Repository<Form>,
    @InjectRepository(FormField) private readonly fields: Repository<FormField>,
    @InjectRepository(FormSubmission) private readonly submissions: Repository<FormSubmission>,
  ) {}

  async list(): Promise<unknown[]> {
    const forms = await this.forms.find({ order: { nav_order: 'ASC', id: 'ASC' } })

    if (!forms.length) return []

    const counts = await this.submissions
      .createQueryBuilder('s')
      .leftJoin('s.form', 'form')
      .select('form.id', 'form')
      .addSelect('COUNT(s.id)', 'total')
      .addSelect("SUM(CASE WHEN s.status = 'new' THEN 1 ELSE 0 END)", 'fresh')
      .groupBy('form.id')
      .getRawMany()

    const byId = new Map(counts.map((row) => [Number(row.form), { total: Number(row.total), fresh: Number(row.fresh) }]))

    return forms.map((form) => ({ ...form, total: byId.get(form.id)?.total || 0, fresh: byId.get(form.id)?.fresh || 0 }))
  }

  async one(id: number): Promise<Form> {
    const form = await this.forms.findOne({ where: { id }, relations: ['fields'] })

    if (!form) throw new NotFoundException()

    form.fields = this.sorted(form.fields)

    return form
  }

  async create(input: FormCreateInput): Promise<Form> {
    const preset = input.preset ? presetById(input.preset) : null
    const source: FormInput = preset
      ? {
          slug: input.slug || preset.slug,
          title: input.title || preset.title,
          description: preset.description,
          icon: input.icon || preset.icon,
          submit_label: preset.submit_label,
          success_text: preset.success_text,
          auth_only: preset.auth_only,
          once: preset.once,
          cooldown_hours: preset.cooldown_hours,
          fields: preset.fields as FieldInput[],
        }
      : input

    if (!source.title) throw new BadRequestException('Форме нужно название')

    const form = this.forms.create({
      slug: await this.freeSlug(source.slug || 'form'),
      title: source.title,
      description: source.description || null,
      icon: source.icon || null,
      enabled: false,
      submit_label: source.submit_label || null,
      success_text: source.success_text || null,
      auth_only: source.auth_only ?? true,
      once: source.once ?? false,
      cooldown_hours: source.cooldown_hours ?? 0,
    })

    await this.forms.save(form)

    if (source.fields?.length) await this.syncFields(form, source.fields)

    return this.one(form.id)
  }

  async update(id: number, input: FormInput): Promise<Form> {
    const form = await this.one(id)

    if (input.slug && input.slug !== form.slug) form.slug = await this.freeSlug(input.slug, form.id)

    for (const key of [
      'title',
      'description',
      'icon',
      'enabled',
      'in_nav',
      'nav_order',
      'auth_only',
      'permission',
      'once',
      'cooldown_hours',
      'max_total',
      'open_from',
      'open_to',
      'closed_text',
      'success_text',
      'submit_label',
      'notify_channels',
      'notify_author',
    ] as const)
      if (input[key] !== undefined) (form as unknown as Record<string, unknown>)[key] = input[key]

    await this.forms.save(form)

    if (input.fields) await this.syncFields(form, input.fields)

    return this.one(id)
  }

  async remove(id: number): Promise<void> {
    const form = await this.one(id)

    await this.fields.remove(form.fields)
    await this.forms.remove(form)
  }

  async navList(): Promise<Form[]> {
    return this.forms.find({
      where: { enabled: true },
      select: { id: true, slug: true, title: true, icon: true, nav_order: true, in_nav: true },
      order: { nav_order: 'ASC', id: 'ASC' },
    })
  }

  async catalog(): Promise<Form[]> {
    return this.forms.find({ where: { enabled: true }, order: { nav_order: 'ASC', id: 'ASC' } })
  }

  async open(slug: string, user: UserRecord | null, ip: string): Promise<PublicForm> {
    const form = await this.forms.findOne({ where: { slug }, relations: ['fields'] })

    if (!form || !form.enabled) throw new NotFoundException()

    form.fields = this.sorted(form.fields)

    const availability = await this.availability(form, user, ip)
    const servers = form.fields.some((field) => field.type === 'server') ? await core().servers.all() : []

    return { form, availability, servers, authorized: Boolean(user) }
  }

  async submit(slug: string, input: SubmitInput, user: UserRecord | null, ip: string): Promise<FormSubmission> {
    const form = await this.forms.findOne({ where: { slug }, relations: ['fields'] })

    if (!form || !form.enabled) throw new NotFoundException()

    form.fields = this.sorted(form.fields)

    const availability = await this.availability(form, user, ip)

    if (!availability.open) throw new ForbiddenException(availability.reason)

    const answers = this.normalize(form.fields, input.answers || {})
    const shown = visibleFields(form.fields as unknown as FormFieldShape[], answers)
    const servers = await this.serverNames(shown, answers)
    const errors: Record<string, string> = {}

    for (const field of shown) {
      const error = answerError(field, answers[field.key] ?? null)
      const unknownServer =
        field.type === 'server' && !isEmptyAnswer(answers[field.key]) && !servers.has(String(answers[field.key]))

      if (error || unknownServer) errors[field.key] = error || 'mod.forms.error_option'
    }

    const guestName = String(input.username || '').trim()
    const guestEmail = String(input.email || '').trim()

    if (!user) {
      if (!guestName) errors[GUEST_NAME] = 'mod.forms.error_required'
      if (form.notify_author && !guestEmail) errors[GUEST_EMAIL] = 'mod.forms.error_required'
      if (guestEmail && !EMAIL_PATTERN.test(guestEmail)) errors[GUEST_EMAIL] = 'mod.forms.error_email'
    }

    if (Object.keys(errors).length) throw new BadRequestException({ errors })

    const submission = this.submissions.create({
      form,
      user_uuid: user?.uuid || null,
      username: user?.username || guestName || null,
      email: user?.email || guestEmail || this.emailFromAnswers(shown, answers),
      ip,
      answers: this.snapshot(shown, answers, servers),
      status: 'new',
    })

    await this.submissions.save(submission)
    await this.announce(form, submission)

    return submission
  }

  async mine(uuid: string): Promise<FormSubmission[]> {
    return this.submissions.find({ where: { user_uuid: uuid }, order: { created_at: 'DESC' } })
  }

  async inbox(query: InboxQuery): Promise<{ items: FormSubmission[]; total: number }> {
    const where: Record<string, unknown> = {}

    if (query.form) where.form = { id: query.form }
    if (query.status) where.status = query.status

    const [items, total] = await this.submissions.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: ((query.page || 1) - 1) * INBOX_PAGE,
      take: INBOX_PAGE,
    })

    return { items, total }
  }

  async review(id: number, input: ReviewInput, reviewer: UserRecord): Promise<FormSubmission> {
    const submission = await this.submissions.findOne({ where: { id } })

    if (!submission) throw new NotFoundException()

    const changed = submission.status !== input.status

    submission.status = input.status
    submission.comment = input.comment || null
    submission.reviewer_uuid = reviewer?.uuid || null
    submission.reviewed_at = new Date()

    await this.submissions.save(submission)

    if (changed && submission.form?.notify_author) await this.notifyAuthor(submission)

    return submission
  }

  async removeSubmission(id: number): Promise<void> {
    await this.submissions.delete({ id })
  }

  async cleanup(days: number): Promise<number> {
    if (!days) return 0

    const result = await this.submissions.delete({
      status: In(['rejected', 'accepted']),
      reviewed_at: LessThan(new Date(Date.now() - days * DAY)),
    })

    return result.affected || 0
  }

  async maxFileSize(slug: string, user: UserRecord | null, ip: string): Promise<number> {
    const form = await this.forms.findOne({ where: { slug }, relations: ['fields'] })

    if (!form || !form.enabled) throw new NotFoundException()

    const availability = await this.availability(form, user, ip)

    if (!availability.open) throw new ForbiddenException(availability.reason)

    const files = form.fields.filter((field) => field.type === 'file')

    if (!files.length) throw new ForbiddenException('В форме нет полей для файлов')

    return files.reduce((limit, field) => Math.max(limit, Number(field.settings?.max_size) || DEFAULT_MAX_SIZE_MB), 0)
  }

  private async availability(form: Form, user: UserRecord | null, ip: string): Promise<FormAvailability> {
    if (!form.enabled) return { open: false, reason: 'disabled' }
    if (form.auth_only && !user) return { open: false, reason: 'auth' }

    if (form.permission && (!user || !(await core().users.can(user.uuid, form.permission))))
      return { open: false, reason: 'permission' }

    const now = new Date()

    if (form.open_from && now < new Date(form.open_from)) return { open: false, reason: 'window', until: form.open_from }
    if (form.open_to && now > new Date(form.open_to)) return { open: false, reason: 'window' }

    if (form.max_total) {
      const total = await this.submissions.count({ where: { form: { id: form.id } } })

      if (total >= form.max_total) return { open: false, reason: 'limit' }
    }

    const author = user ? { user_uuid: user.uuid } : { user_uuid: IsNull(), ip }

    if (form.once) {
      const already = await this.submissions.count({ where: { form: { id: form.id }, ...author } })

      if (already) return { open: false, reason: 'once' }
    }

    if (form.cooldown_hours) {
      const last = await this.submissions.findOne({
        where: { form: { id: form.id }, ...author },
        order: { created_at: 'DESC' },
      })

      if (last) {
        const until = new Date(new Date(last.created_at).getTime() + form.cooldown_hours * HOUR)

        if (until > now) return { open: false, reason: 'cooldown', until }
      }
    }

    return { open: true }
  }

  private normalize(fields: FormField[], raw: Record<string, unknown>): Record<string, AnswerValue> {
    const answers: Record<string, AnswerValue> = {}
    const prefix = core().storage.url('')

    for (const field of fields) {
      const info = fieldType(field.type)

      if (!info.input) continue

      const value = raw[field.key]

      if (value === undefined || value === null) {
        answers[field.key] = info.multi ? [] : null
        continue
      }

      if (info.multi) {
        answers[field.key] = (Array.isArray(value) ? value : [value]).map((item) => String(item)).slice(0, 50)
        continue
      }

      if (['checkbox', 'switch'].includes(field.type)) {
        answers[field.key] = Boolean(value)
        continue
      }

      if (['number', 'slider', 'rating'].includes(field.type)) {
        answers[field.key] = Number(value)
        continue
      }

      if (field.type === 'file') {
        const url = String(value)

        answers[field.key] = url.startsWith(prefix) ? url : null
        continue
      }

      answers[field.key] = String(value).slice(0, 4000)
    }

    return answers
  }

  private async serverNames(fields: FormFieldShape[], answers: Record<string, AnswerValue>): Promise<Map<string, string>> {
    if (!fields.some((field) => field.type === 'server' && !isEmptyAnswer(answers[field.key]))) return new Map()

    const servers = await core().servers.all()

    return new Map(servers.map((server) => [String(server.id), server.name]))
  }

  private snapshot(fields: FormFieldShape[], answers: Record<string, AnswerValue>, servers: Map<string, string>): SubmissionAnswer[] {
    return fields
      .filter((field) => fieldType(field.type).input)
      .filter((field) => !isEmptyAnswer(answers[field.key]))
      .map((field) => ({
        key: field.key,
        type: field.type,
        label: field.label,
        value: this.readable(field, answers[field.key], servers),
      }))
  }

  private readable(field: FormFieldShape, value: AnswerValue, servers: Map<string, string>): unknown {
    if (field.type === 'server') return servers.get(String(value)) || value

    if (!fieldType(field.type).options) return value

    const labels = new Map((field.options || []).map((option) => [option.value, option.label]))

    if (Array.isArray(value)) return value.map((item) => labels.get(String(item)) || item)

    return labels.get(String(value)) || value
  }

  private emailFromAnswers(fields: FormFieldShape[], answers: Record<string, AnswerValue>): string | null {
    const field = fields.find((item) => item.type === 'email')

    return field && !isEmptyAnswer(answers[field.key]) ? String(answers[field.key]) : null
  }

  private sorted(fields: FormField[] = []): FormField[] {
    return fields.slice().sort((left, right) => left.position - right.position || left.id - right.id)
  }

  private async syncFields(form: Form, list: FieldInput[]): Promise<void> {
    const existing = await this.fields.find({ where: { form: { id: form.id } } })
    const keep = new Set(list.map((item) => item.id).filter(Boolean))
    const dropped = existing.filter((field) => !keep.has(field.id))
    const keys = new Set<string>()

    for (const item of list) {
      if (keys.has(item.key)) throw new BadRequestException(`Поле «${item.key}» встречается дважды`)

      keys.add(item.key)
    }

    if (dropped.length) await this.fields.remove(dropped)

    const rows = list.map((item, index) => {
      const target = existing.find((field) => field.id === item.id) || this.fields.create({ form })
      const info = fieldType(item.type)

      target.form = form
      target.key = item.key
      target.type = info.type
      target.label = item.label
      target.hint = item.hint || null
      target.placeholder = item.placeholder || null
      target.required = Boolean(item.required) && info.input
      target.half = Boolean(item.half)
      target.position = index
      target.options = info.options ? (item.options as { value: string; label: string }[]) || [] : null
      target.settings = (item.settings as Record<string, number | string>) || null
      target.visible_if = item.visible_if?.field ? item.visible_if : null

      return target
    })

    await this.fields.save(rows)
  }

  private async freeSlug(slug: string, keepId?: number): Promise<string> {
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const base = !cleaned || RESERVED_SLUGS.includes(cleaned) ? `${cleaned || 'form'}-1` : cleaned
    let candidate = base
    let index = 2

    while (true) {
      const taken = await this.forms.findOne({ where: keepId ? { slug: candidate, id: Not(keepId) } : { slug: candidate } })

      if (!taken) return candidate

      candidate = `${base}-${index}`
      index += 1
    }
  }

  private async announce(form: Form, submission: FormSubmission): Promise<void> {
    const logger = core().logger('forms')

    logger.log(`Заявка №${submission.id} по форме «${form.title}» от ${submission.username || submission.ip}`)

    if (!form.notify_channels?.length) return

    const lines = submission.answers.map((answer) => `${answer.label}: ${this.plain(answer.value)}`)
    const post = {
      title: form.title,
      description: [`Заявка от ${submission.username || 'гостя'}`, '', ...lines].join('\n'),
    }

    for (const channel of form.notify_channels)
      await core()
        .webhooks.send(channel, post)
        .catch((error) => logger.error(`Уведомление в канал ${channel} не ушло`, error))
  }

  private async notifyAuthor(submission: FormSubmission): Promise<void> {
    const logger = core().logger('forms')

    try {
      const code = await core().locales.defaultCode()
      const messages = await core().locales.messages(code)
      const status = messages[`mod.forms.status_${submission.status}`] || submission.status
      const subject = `${submission.form.title} — ${status}`
      const comment = submission.comment ? `<p>${submission.comment}</p>` : ''
      const html = `<p>${messages['mod.forms.mail_intro'] || 'Решение по вашей заявке'}: <b>${status}</b>.</p>${comment}`

      if (submission.user_uuid) await core().mail.sendToUser(submission.user_uuid, subject, html)
      else if (submission.email) await core().mail.send(submission.email, subject, html)
    } catch (error) {
      logger.error(`Письмо по заявке №${submission.id} не ушло`, error)
    }
  }

  private plain(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'boolean') return value ? 'да' : 'нет'

    return String(value ?? '')
  }
}
