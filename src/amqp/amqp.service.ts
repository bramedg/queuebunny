import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { firstValueFrom, Subject } from 'rxjs';
import { AMQP_URL, REQUEST_QUEUE } from 'src/constants';

@Injectable()
export class AmqpService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private connectionReady: Subject<boolean> = new Subject();

  async onModuleInit() {
    this.connection = await amqp.connect(AMQP_URL);
    this.channel = await this.connection.createChannel();

    this.connectionReady.next(true);
  }

  async onModuleDestroy() {
    await this.channel.close();
    await this.connection.close();
  }

  async listenForRequests(
    exchange: string,
    requestRoutingKey: string,
    callback: (msg: amqp.ConsumeMessage | null) => any,
  ) {
    await firstValueFrom(this.connectionReady);

    const INSTANCE_REQUEST_QUEUE = `${REQUEST_QUEUE}_${requestRoutingKey.replace(/\./g, '_')}`;

    // Ensure the listening queue exists, bind to it, and listen for replies.  Only respond to this thread when the
    // correlation id we initiated with is the one on the message coming back
    this.channel.assertQueue(INSTANCE_REQUEST_QUEUE).then(() => {
      this.channel
        .bindQueue(INSTANCE_REQUEST_QUEUE, exchange, requestRoutingKey)
        .then(() => {
          this.channel.consume(INSTANCE_REQUEST_QUEUE, (msg) => {
            this.channel.ack(msg);
            const response = callback(msg);
            if (response) {
              this.channel.publish(
                exchange,
                msg.properties.replyTo,
                Buffer.from(JSON.stringify(response)),
                {
                  correlationId: msg.properties.correlationId,
                  headers: msg.properties.headers,
                },
              );
            }
          });
        });
    });
  }
}
