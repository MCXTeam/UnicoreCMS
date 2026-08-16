import { envConfig, NestLogger } from 'unicore-common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AuthAdapter } from './auth/adapters/auth.adapter';
import { EntityNotFoundFilter } from './common/filters/entity-not-found.filter';
import { ASCII_NAME, STATIC_CONTENT_SECURITY_POLICY } from '@common';
import helmet from 'helmet';
import * as clc from 'cli-color';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { ContentLocaleInterceptor } from './admin/locales/content-locale.interceptor';
import { ContentTranslationsService } from './admin/locales/content-translations.service';
import { LocalesService } from './admin/locales/locales.service';

process.env.TZ = envConfig.timezone;

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

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.enableCors({
    origin: envConfig.corsOrigins,
    credentials: true,
  });
  app.useStaticAssets(join(__dirname, '../../../storage'), {
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', STATIC_CONTENT_SECURITY_POLICY);
    },
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useWebSocketAdapter(new AuthAdapter(app));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ContentLocaleInterceptor(app.get(ContentTranslationsService), app.get(LocalesService)),
  );
  app.useGlobalFilters(new EntityNotFoundFilter());

  await app.listen(envConfig.backendPort, '0.0.0.0');
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
