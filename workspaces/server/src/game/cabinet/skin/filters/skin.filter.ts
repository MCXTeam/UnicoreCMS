import { Request } from 'express';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { PNG_EXTENSION_PATTERN } from '@common';

export const skinFileFilter = (req: Request, file: Express.Multer.File, callback) => {
  if (!PNG_EXTENSION_PATTERN.test(file.originalname)) {
    return callback(new UnsupportedMediaTypeException(), false);
  }
  callback(null, true);
};
