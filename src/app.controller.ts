import { Controller } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AmqpService } from 'src/amqp/amqp.service';
import * as _ from 'lodash';
import { execSync } from 'child_process';

@Controller()
export class AppController {
  constructor(private readonly amqpService: AmqpService) {}

  processCommandString(commandStringTemplate: string, sources: any): string {
    const replacementRegex = /{{([^}]+)}}/g;
    const commandString = commandStringTemplate.replace(
      replacementRegex,
      (match: string, key: string) => {
        const value = _.get(sources, key, '');
        return value;
      },
    );

    return commandString;
  }

  onModuleInit() {
    const routingKey = process.argv[2];
    const commandStringTemplate = process.argv[3];

    const allRequiredParametersArePresent = routingKey && commandStringTemplate;
    if (allRequiredParametersArePresent) {
      this.amqpService.listenForRequests('amq.topic', routingKey, (msg) => {
        if (!msg) {
          Logger.error('Received empty message');
          return;
        }
        let content;
        try {
          content = JSON.parse(msg.content.toString());
        } catch (error) {
          Logger.error('Failed to parse message content', error);
          return;
        }
        if (!content) {
          Logger.error('Message content is empty');
          return;
        }

        const sources = {
          body: content,
          headers: msg.properties.headers,
          properties: msg.properties,
        };

        const commandString = this.processCommandString(
          commandStringTemplate,
          sources,
        );
        Logger.log(`Executing command: ${commandString}`);

        const output = execSync(commandString);
        const response = {
          status: 'success',
          output: output.toString(),
        };

        return response;
      });

      Logger.log(`QueueBunny listening on ${routingKey}`);
    } else {
      Logger.error('Routing key and command string template are required');
      Logger.error('Usage: queuebunny <routingKey> "<commandStringTemplate>"');
    }
  }
}
