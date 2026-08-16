import { BadRequestException } from '@nestjs/common';

export function assertUploadedFile(file: Express.Multer.File): Express.Multer.File {
  if (!file?.filename) throw new BadRequestException();

  return file;
}
