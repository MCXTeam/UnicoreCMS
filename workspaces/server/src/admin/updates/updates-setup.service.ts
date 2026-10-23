import { Injectable, BadRequestException } from '@nestjs/common';
import { projectRoot, dataRoot } from 'unicore-common/ports';
import { discovery } from 'unicore-updater/bootstrap';
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
}
