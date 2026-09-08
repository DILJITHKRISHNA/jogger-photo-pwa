import * as Joi from 'joi';

/**
 * Every env var the API depends on, validated on boot so the process fails
 * fast with a clear message instead of misbehaving at runtime.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(4010),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:3010'),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  REDIS_URL: Joi.string().default('redis://localhost:6381'),

  S3_ENDPOINT: Joi.string().allow('').optional(),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_BUCKET: Joi.string().allow('').optional(),
  S3_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(true),

  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  AUTH_THROTTLE_TTL_MS: Joi.number().default(60000),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),

  SEED_ADMIN_PHONE: Joi.string().optional(),
  SEED_ADMIN_PASSWORD: Joi.string().optional(),
  SEED_EXEC_PHONE: Joi.string().optional(),
  SEED_EXEC_PASSWORD: Joi.string().optional(),
});
