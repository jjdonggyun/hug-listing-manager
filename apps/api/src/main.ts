import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  /**
   * CORS_ORIGIN 예시 (Render env)
   * http://localhost:5173,https://hug-listing-manager-web.vercel.app
   */
  const raw = config.get<string>('CORS_ORIGIN') ?? '';
  const allowedOrigins = raw
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      // 서버 내부 호출 / health check
      if (!requestOrigin) {
        return callback(null, true);
      }

      // 정확히 일치하는 origin 허용
      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      // Vercel preview (*.vercel.app) 허용하고 싶으면 이 줄 유지
      if (/^https:\/\/.*\.vercel\.app$/.test(requestOrigin)) {
        return callback(null, true);
      }

      // 차단
      return callback(
        new Error(`CORS blocked: ${requestOrigin}`),
        false,
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
  await app.listen(port);

  console.log(`API listening on port ${port}`);
}

bootstrap();
