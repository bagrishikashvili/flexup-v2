import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().default(2592000),
  CORS_ORIGIN: Joi.string().default('*'),
  LOG_LEVEL: Joi.string().default('info'),
  UPLOADS_DIR: Joi.string().default('./uploads'),
  UPLOADS_BASE_URL: Joi.string().default('http://localhost:3000/api/uploads'),
  MAX_UPLOAD_SIZE_BYTES: Joi.number().integer().default(5242880),
});
