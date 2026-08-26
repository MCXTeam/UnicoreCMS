import { defineModule } from 'unicore-api/server'
import { FormField } from './entities/field.entity'
import { Form } from './entities/form.entity'
import { FormSubmission } from './entities/submission.entity'
import { FormsModule } from './forms.module'
import ru from '../locales/ru.json'
import en from '../locales/en.json'

export default defineModule({
  id: 'forms',
  entities: [Form, FormField, FormSubmission],
  nestModules: [FormsModule],
  permissions: ['mod.forms.read', 'mod.forms.write', 'mod.forms.review'],
  config: [
    {
      key: 'index_title',
      type: 'string',
      default: 'Формы',
      public: true,
      label: 'mod.forms.config_index_title',
      hint: 'mod.forms.config_index_title_hint',
    },
    {
      key: 'index_subtitle',
      type: 'string',
      default: 'Заявки, обращения и всё, что можно заполнить на сайте',
      public: true,
      label: 'mod.forms.config_index_subtitle',
      hint: 'mod.forms.config_index_subtitle_hint',
    },
    {
      key: 'keep_days',
      type: 'number',
      default: 0,
      min: 0,
      max: 3650,
      label: 'mod.forms.config_keep_days',
      hint: 'mod.forms.config_keep_days_hint',
    },
  ],
  locales: { ru, en },
})
