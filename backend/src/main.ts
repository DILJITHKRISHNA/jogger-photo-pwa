import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(
    helmet({
      // Uploaded product photos are served from this API and rendered as
      // <img> on the frontend's own origin — a strict default CORP header
      // would block that cross-origin embed.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN'),
    credentials: true, // refresh token travels as an httpOnly cookie
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const apiPrefix = config.get<string>('API_PREFIX')!;
  app.setGlobalPrefix(apiPrefix);

  const port = config.get<number>('PORT')!;
  await app.listen(port);

  console.log(`🚀 Jogger Photo Hub API running on http://localhost:${port}/${apiPrefix}`);
}
void bootstrap();
