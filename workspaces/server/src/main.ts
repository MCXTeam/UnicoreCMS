import { envConfig, NestLogger } from 'unicore-common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AuthAdapter } from './auth/adapters/auth.adapter';
import { EntityNotFoundFilter } from './common/filters/entity-not-found.filter';
import { ASCII_NAME } from '@common';
import * as clc from 'cli-color';
import { initializeTransactionalContext } from 'typeorm-transactional';

process.env.TZ = 'UTC';

async function bootstrap() {
  console.log(
    ASCII_NAME.split('\n')
      .map((line) => clc.magenta(line))
      .join(''),
  );
  console.log(' ');
  console.log(`\tVersion: ${process.env.npm_package_version}, Starting Server...`);
  console.log(' ');

  await new Promise((res) => setTimeout(res, 2500));

  initializeTransactionalContext();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: NestLogger,
  });

  app.set('trust proxy', envConfig.trustProxy);
  app.enableShutdownHooks();

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('UnicoreAPI').setDescription('The cats API description').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  app.useStaticAssets(join(__dirname, '../../../storage'));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useWebSocketAdapter(new AuthAdapter(app));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new EntityNotFoundFilter());
  app.enableCors({
    origin: envConfig.corsOrigins.length ? envConfig.corsOrigins : [envConfig.baseurl],
    credentials: true,
  });

  await app.listen(envConfig.backendPort, '0.0.0.0');
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
