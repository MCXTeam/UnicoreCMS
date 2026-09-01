export const remainingSeconds = (until: Date | null | undefined): number =>
  until ? Math.max(Math.ceil((until.getTime() - Date.now()) / 1000), 0) : 0;
