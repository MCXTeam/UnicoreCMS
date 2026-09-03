import { Global, Module, OnModuleInit } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { setAuditSink } from 'unicore-api';
import { AuditLog } from './audit.entity';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  exports: [AuditService],
})
export class AuditModule implements OnModuleInit {
  constructor(private auditService: AuditService) {}

  onModuleInit(): void {
    setAuditSink({ record: (entry) => this.auditService.record(entry) });
  }
}
