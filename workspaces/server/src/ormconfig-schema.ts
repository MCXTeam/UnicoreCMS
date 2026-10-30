import { dataRoot, loadPublicEnvFile } from 'unicore-common/ports';
import { prepareLicenses } from 'unicore-api/licensing';

loadPublicEnvFile();
export default prepareLicenses(dataRoot).then(async () => {
  const { DataSource } = await import('typeorm');
  const { ormconfig } = await import('./ormconfig.js');
  return new DataSource(ormconfig);
});
