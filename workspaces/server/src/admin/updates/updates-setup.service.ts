import { Injectable, BadRequestException } from '@nestjs/common';
import { projectRoot, dataRoot } from 'unicore-common/ports';
import { discovery } from 'unicore-updater/bootstrap';
import { PterodactylTransition } from 'unicore-updater/pterodactyl';
import { PterodactylSetupInput } from './pterodactyl-setup.input';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

@Injectable()
export class UpdatesSetupService {
  private connecting = false;

  async discover() {
    return discovery(projectRoot, dataRoot);
  }

  async connect() {
    if (this.connecting) throw new BadRequestException('updates.error.setup_busy');
    const state = await this.discover();
    if (!state.canConnect || state.mode !== 'pm2') throw new BadRequestException('updates.error.setup_host_required');
    if (['connecting', 'preparing'].includes(state.state)) throw new BadRequestException('updates.error.setup_busy');
    this.connecting = true;
    const child = spawn(process.execPath, [join(projectRoot, 'workspaces/updater/src/connect.mjs'), projectRoot, dataRoot], {
      detached: true, stdio: 'ignore', windowsHide: true, env: process.env,
    });
    child.once('error', () => { this.connecting = false; });
    child.once('exit', () => { this.connecting = false; });
    child.unref();
    return { state: 'connecting' };
  }

  async pterodactyl(input: PterodactylSetupInput) {
    if (this.connecting) throw new BadRequestException('updates.error.setup_busy');
    this.connecting = true;
    try {
      const transition = new PterodactylTransition(input);
      await transition.verifyData(dataRoot);
      if (input.action === 'inspect') return await transition.inspect();
      if (!input.fingerprint) throw new Error();
      return await transition.apply(input.fingerprint, dataRoot);
    } catch (error: any) {
      const allowed = ['pterodactyl_configuration', 'pterodactyl_permission', 'pterodactyl_http', 'pterodactyl_image_unavailable', 'pterodactyl_server_mismatch', 'stale_plan'];
      throw new BadRequestException(`updates.error.${allowed.includes(error.code) ? error.code : 'pterodactyl_http'}`);
    } finally { this.connecting = false; }
  }
}
