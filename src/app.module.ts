import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmqpService } from './amqp/amqp.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AmqpService],
})
export class AppModule {}
