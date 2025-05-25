import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmqpService } from './amqp/amqp.service';

jest.mock('./amqp/amqp.service');

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, AmqpService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should should properly parse a command string template"', () => {
      const sources = {
        body: {
          key1: 'value1',
          key2: 'value2',
        },
        headers: {
          header1: 'headerValue1',
          header2: 'headerValue2',
        },
        properties: {
          property1: 'propertyValue1',
          property2: 'propertyValue2',
        },
      };
      const commandStringTemplate =
        'echo {{body.key1}} {{headers.header1}} {{properties.property1}}';
      const expectedCommandString = 'echo value1 headerValue1 propertyValue1';
      const commandString = appController.processCommandString(
        commandStringTemplate,
        sources,
      );
      expect(commandString).toBe(expectedCommandString);
    });
  });
});
