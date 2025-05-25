import * as _ from 'lodash';
export const APP_ID = 'QueueBunny';
export const AMQP_URL = process.env['AMQP_URL'] || 'amqp://localhost';
export const DEFAULT_TIMEOUT = 5000;
export const REQUEST_QUEUE = `${APP_ID.toLowerCase()}`;
