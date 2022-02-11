import { MulterFile } from 'fastify-file-interceptor';
import { Request } from "express";

export const imageFileFilter = (req: Request, file: MulterFile, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};
