import { BadRequestException, Body, Controller, Get, Header, Post } from '@nestjs/common';
import { currentHost } from 'unicore-api/licensing';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { LicenseActivateInput, LicenseTransferInput } from './license.input';

@Controller('admin/licenses')
@Permissions(['panel.extensions.read'])
export class LicenseController {
  @Get()
  @Header('Cache-Control', 'no-store')
  async find() {
    const host = currentHost();
    return host ? host.inspect() : { configured: false, entries: [] };
  }

  @Post('refresh')
  @Permissions(['panel.extensions.manage'])
  @Header('Cache-Control', 'no-store')
  refresh() {
    return this.operation({ action: 'refresh' });
  }

  @Post('activate')
  @Permissions(['panel.extensions.manage'])
  @Header('Cache-Control', 'no-store')
  activate(@Body() input: LicenseActivateInput) {
    return this.operation({ action: 'activate', ...input });
  }

  @Post('transfer')
  @Permissions(['panel.extensions.manage'])
  @Header('Cache-Control', 'no-store')
  transfer(@Body() input: LicenseTransferInput) {
    return this.operation({ action: 'transfer', ...input });
  }

  private async operation(input: Record<string, unknown>) {
    const host = currentHost();
    if (!host) throw new BadRequestException('licensing.not_configured');
    try {
      return await host.operation(input);
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String(error.code) : 'operation_failed';
      const known = [
        'activation_required',
        'licensing_not_configured',
        'license_denied',
        'artifact_tampered',
        'transfer_unavailable',
        'license_service_unavailable',
      ];
      throw new BadRequestException(`licensing.error.${known.includes(code) ? code : 'operation_failed'}`);
    }
  }
}
