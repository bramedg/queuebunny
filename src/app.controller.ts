import { Controller } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AmqpService } from 'src/amqp/amqp.service';
import * as _ from 'lodash';
import { execSync, spawn } from 'child_process';

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

  private startConsumerMode(routingKey: string, commandStringTemplate: string) {
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

        let processedOutput = output.toString();
        try {
          processedOutput = JSON.parse(processedOutput);
        } catch (error) {
          Logger.warn('Output not JSON format.  Leaving as string');
        }

        const response = {
          status: 'success',
          output: processedOutput,
        };

        return response;
      });

      Logger.log(`QueueBunny listening on ${routingKey}`);
  }

  private startProducerMode(routingKey: string, commandStringTemplate: string) {

        Logger.log(`Executing command: ${commandStringTemplate}`);

        let child: any;
        try {
          child = spawn(commandStringTemplate, {shell: true});
        } catch (error) { 
          Logger.error('Failed to start command', error);
          return;
        }

        child.stdout?.on('data', (data) => {
          Logger.log(`Command output: ${data}`);

          let processedData = data.toString();
          try {
            processedData = JSON.parse(processedData);
          } catch (error) {
            Logger.warn('Output not JSON format.  Leaving as string');
          }

          this.amqpService.publishMessage(
            'amq.topic',
            routingKey,
            processedData,
          );
        });

        child.stderr?.on('data', (data) => {
          Logger.error(`Command error output: ${data}`);
        });

        child.on('close', (code) => {
          if (code !== 0) {
            Logger.error(`Command exited with code ${code}`);
          } else {
            Logger.log('Command executed successfully');
          }
          process.exit(0);
        });

        Logger.log(`QueueBunny producer started for routing key: ${routingKey}`);
  }
  

  onModuleInit() {

    const isProducerMode = process.argv.includes('--producer');
    if (isProducerMode) { 
      Logger.log('QueueBunny is running in producer mode');
    } else {
      Logger.log('QueueBunny is running in consumer mode');
    }

    const routingKey = process.argv[2];
    const commandStringTemplate = process.argv[3];

    const allRequiredParametersArePresent = routingKey && commandStringTemplate;
    if (allRequiredParametersArePresent) {
      if( isProducerMode ) {
        this.startProducerMode(routingKey, commandStringTemplate);
      } else {
        this.startConsumerMode(routingKey, commandStringTemplate);
      }
    } else {
      Logger.error('Routing key and command string template are required');
      Logger.error('Usage: queuebunny <routingKey> "<commandStringTemplate> [--producer]"');
      Logger.error('Example: queuebunny "my.routing.key" "echo {{body.message}}"');
      Logger.error('If you want to run in producer mode, use the --producer flag');
    }
  }
}
