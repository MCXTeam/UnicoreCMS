import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import { Cron, CronOptions } from '@nestjs/schedule'
import { ALLOW_INACTIVE_KEY, IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../keys'
import { core, coreReady } from './core'

export interface PermissionOptions {
  or?: boolean
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

export const AllowInactive = () => SetMetadata(ALLOW_INACTIVE_KEY, true)

export const Permissions = (permissions: string[], options?: PermissionOptions) =>
  SetMetadata(PERMISSIONS_KEY, options ? [permissions, options] : permissions)

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user)

export const IpAddress = createParamDecorator((_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().ip)

export const UserAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().headers['user-agent'],
)

export function SafeCron(expression: string, task: string, options?: CronOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const original = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await original.apply(this, args)
      } catch (error) {
        if (coreReady()) core().logger('cron').error(`Задача «${task}» завершилась с ошибкой`, error)
      }
    }

    return Cron(expression, options)(target, propertyKey, descriptor)
  }
}
