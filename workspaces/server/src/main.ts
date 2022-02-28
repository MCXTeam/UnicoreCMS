import { envConfig, NestLogger } from 'unicore-common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { contentParser } from 'fastify-file-interceptor';
import { join } from 'path';
import { AuthAdapter } from './auth/adapters/auth.adapter';

async function bootstrap() {
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
  app.listen(envConfig.backendPort, '0.0.0.0');
}
bootstrap();
