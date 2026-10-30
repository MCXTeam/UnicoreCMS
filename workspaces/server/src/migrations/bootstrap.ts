import { dataRoot, loadPublicEnvFile } from 'unicore-common/ports';
import { prepareLicenses } from 'unicore-api/licensing';

loadPublicEnvFile();
prepareLicenses(dataRoot)
  .then(() => import('./cli.js'))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'startup_failed');
    process.exit(1);
  });
