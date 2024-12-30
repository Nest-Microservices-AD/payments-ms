import 'dotenv/config';
import * as joi from 'joi';

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    NATS_SERVERS: joi.string().required(),
    STRIPE_SECRET_KEY: joi.string().required(),
    WEBHOOK_SECRET: joi.string().required(),
    SUCCESS_URL: joi.string().required(),
    CANCEL_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);
if (error) {
  throw new Error(`Env Vars error ${error.message}`);
}

const envValues: {
  PORT: number;
  NATS_SERVERS: string;
  STRIPE_SECRET_KEY: string;
  WEBHOOK_SECRET: string;
  SUCCESS_URL: string;
  CANCEL_URL: string;
} = value;

export const envs = {
  PORT: envValues.PORT,
  NATS_SERVERS: envValues.NATS_SERVERS.split(','),
  STRIPE_SECRET_KEY: envValues.STRIPE_SECRET_KEY,
  WEBHOOK_SECRET: envValues.WEBHOOK_SECRET,
  SUCCESS_URL: envValues.SUCCESS_URL,
  CANCEL_URL: envValues.CANCEL_URL,
};
