import { envConfig, NestLogger } from 'unicore-common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { contentParser } from 'fastify-file-interceptor';
import { join } from 'path';
import { AuthAdapter } from './auth/adapters/auth.adapter';
import { ASCII_NAME } from '@common';
import * as clc from "cli-color"
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional-cls-hooked';

process.env.TZ = 'UTC'

async function bootstrap() {
  console.log(ASCII_NAME.split("\n").map(line => clc.magenta(line)).join(""));
  console.log(" ");
  console.log(`\tVersion: ${process.env.npm_package_version}, Starting Server...`);
  console.log(" ");

  await new Promise(res => setTimeout(res, 2500))

  initializeTransactionalContext()
  patchTypeORMRepositoryWithBaseRepository()

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: NestLogger,
  });

  const config = new DocumentBuilder().setTitle('UnicoreAPI').setDescription('The cats API description').setVersion('1.0').build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.register(contentParser);
  app.useStaticAssets({ root: join(__dirname, '../../../storage') });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useWebSocketAdapter(new AuthAdapter(app));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors();

  app.use(function (req, res, next) {
    res.setHeader("x-powered-by", "UnicoreCMS")
    next()
  })

  app.listen(envConfig.backendPort, '0.0.0.0');
}
bootstrap();
