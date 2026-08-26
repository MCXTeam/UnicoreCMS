import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FormField } from './entities/field.entity'
import { Form } from './entities/form.entity'
import { FormSubmission } from './entities/submission.entity'
import { FormsAdminController } from './forms-admin.controller'
import { FormsController } from './forms.controller'
import { FormsService } from './forms.service'
import { FormsTasks } from './forms.tasks'

@Module({
  imports: [TypeOrmModule.forFeature([Form, FormField, FormSubmission])],
  controllers: [FormsAdminController, FormsController],
  providers: [FormsService, FormsTasks],
})
export class FormsModule {}
