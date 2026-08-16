import { Request } from 'express';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { IMAGE_EXTENSION_PATTERN } from '../../constants';

export const imageFileFilter = (req: Request, file: Express.Multer.File, callback) => {
  if (!IMAGE_EXTENSION_PATTERN.test(file.originalname)) {
    return callback(new UnsupportedMediaTypeException(), false);
  }
  callback(null, true);
};
