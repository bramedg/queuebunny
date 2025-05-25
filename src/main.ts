import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'QueueBunny',
      timestamp: true,
      logLevels: ['error', 'warn', 'log', 'debug', 'verbose'],
    }),
  });
  await app.listen();
}
bootstrap();
