import { MulterFile } from 'fastify-file-interceptor';
import { Request } from 'express';
import { UnsupportedMediaTypeException } from '@nestjs/common';

export const skinFileFilter = (req: Request, file: MulterFile, callback) => {
  if (!file.originalname.match(/\.png$/)) {
    return callback(new UnsupportedMediaTypeException(), false);
  }
  callback(null, true);
};
