import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const origin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';

  app.enableCors({
    origin,
    credentials: true,
  });

  const port = parseInt(config.get<string>('PORT') ?? '4000', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
