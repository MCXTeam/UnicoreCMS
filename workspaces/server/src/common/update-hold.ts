import { existsSync } from 'fs';

export const updateHold = () => Boolean(process.env.UNICORE_UPDATE_HOLD_FILE && existsSync(process.env.UNICORE_UPDATE_HOLD_FILE));
