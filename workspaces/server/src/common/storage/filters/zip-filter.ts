import { Request } from 'express';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { ZIP_EXTENSION_PATTERN } from '../../constants';

export const zipFileFilter = (req: Request, file: Express.Multer.File, callback) => {
  if (!ZIP_EXTENSION_PATTERN.test(file.originalname)) {
    return callback(new UnsupportedMediaTypeException(), false);
  }
  callback(null, true);
};
