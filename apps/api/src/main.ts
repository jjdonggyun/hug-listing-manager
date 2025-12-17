import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const origin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
  const rawOrigins = config.get<string>('CORS_ORIGIN') ?? '';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      // 서버 → 서버 호출 / health check 대비
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  });

  const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
