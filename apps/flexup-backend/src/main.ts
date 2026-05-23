import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { AppConfigService } from '@/config/config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: config.corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());

  app.enableShutdownHooks();

  const port = config.port;
  await app.listen(port);
  console.log(`Listening on ${port}`);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
