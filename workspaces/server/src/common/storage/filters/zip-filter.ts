import { MulterFile } from 'fastify-file-interceptor';
import { Request } from 'express';

export const zipFileFilter = (req: Request, file: MulterFile, callback) => {
  if (!file.originalname.match(/\.(zip)$/)) {
    return callback(new Error('Only zip files are allowed!'), false);
  }
  callback(null, true);
};
