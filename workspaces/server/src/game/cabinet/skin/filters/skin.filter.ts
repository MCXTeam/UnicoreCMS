import { Request } from 'express';
import { UnsupportedMediaTypeException } from '@nestjs/common';

export const skinFileFilter = (req: Request, file: Express.Multer.File, callback) => {
  if (!file.originalname.match(/\.png$/)) {
    return callback(new UnsupportedMediaTypeException(), false);
  }
  callback(null, true);
};
