import { envConfig, NestLogger, storagePath } from 'unicore-common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AuthAdapter } from './auth/adapters/auth.adapter';
import { EntityNotFoundFilter } from './common/filters/entity-not-found.filter';
import { TooManyAttemptsFilter } from './common/filters/too-many-attempts.filter';
import { ASCII_NAME, formatError, HSTS_MAX_AGE_SECONDS, STATIC_CONTENT_SECURITY_POLICY, stderr, stdout, SWAGGER_PATH } from '@common';
import helmet from 'helmet';
import clc from 'cli-color';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { ContentLocaleInterceptor } from './admin/locales/content-locale.interceptor';
import { ContentTranslationsService } from './admin/locales/content-translations.service';
import { LocalesService } from './admin/locales/locales.service';
import { applySchema } from './migrations/runner';

process.env.TZ = envConfig.timezone;

async function bootstrap() {
  stdout(
    ASCII_NAME.split('\n')
      .map((line) => clc.magenta(line))
      .join(''),
  );
  stdout(' ');
  stdout(`\tVersion: ${process.env.npm_package_version}, Starting Server...`);
  stdout(' ');

  await new Promise((res) => setTimeout(res, 2500));

  initializeTransactionalContext();

  await applySchema();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: NestLogger,
  });

  app.set('trust proxy', envConfig.trustProxy);
  app.enableShutdownHooks();

  if (envConfig.swagger) {
    const config = new DocumentBuilder().setTitle('UnicoreAPI').setDescription('The cats API description').setVersion('1.0').build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(SWAGGER_PATH, app, document);
  }

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: envConfig.apiHttps && { maxAge: HSTS_MAX_AGE_SECONDS, includeSubDomains: true },
    }),
  );
  app.enableCors({
    origin: envConfig.corsOrigins,
    credentials: true,
  });
  app.useStaticAssets(storagePath, {
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
  app.useGlobalFilters(new EntityNotFoundFilter(), new TooManyAttemptsFilter());

  await app.listen(envConfig.backendPort, '0.0.0.0');
}

process.on('unhandledRejection', (reason) => {
  stderr(`Unhandled Rejection: ${formatError(reason)}`);
});

process.on('uncaughtException', (error) => {
  stderr(`Uncaught Exception: ${formatError(error)}`);
  process.exit(1);
});

bootstrap().catch((error) => {
  stderr(formatError(error));
  process.exit(1);
});
