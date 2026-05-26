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
  CORS_ORIGINS: Joi.string().default(''),
  SWAGGER_ENABLED: Joi.string().valid('true', 'false').default('true'),
  LOG_LEVEL: Joi.string().default('info'),
  UPLOADS_DIR: Joi.string().default('./uploads'),
  UPLOADS_BASE_URL: Joi.string().default('http://localhost:3000/api/uploads'),
  MAX_UPLOAD_SIZE_BYTES: Joi.number().integer().default(5242880),
  COOKIE_DOMAIN: Joi.string().allow('').default(''),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_REFRESH_TOKEN_NAME: Joi.string().default('flexup_refresh'),
  EMAIL_PROVIDER: Joi.string().valid('smtp', 'console').default('smtp'),
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().port().default(1025),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  SMTP_SECURE: Joi.boolean().default(false),
  EMAIL_FROM: Joi.string().email().default('noreply@flexup.local'),
  EMAIL_FROM_NAME: Joi.string().default('flexup'),
  WEB_BASE_URL: Joi.string().uri().default('http://localhost:5173'),
  EMAIL_VERIFICATION_TTL_HOURS: Joi.number()
    .integer()
    .min(1)
    .max(168)
    .default(24),
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: Joi.number()
    .integer()
    .min(0)
    .default(60),
  EMAIL_VERIFICATION_MAX_PER_DAY: Joi.number().integer().min(1).default(5),
  PASSWORD_RESET_TTL_MINUTES: Joi.number()
    .integer()
    .min(5)
    .max(1440)
    .default(60),
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS: Joi.number()
    .integer()
    .min(0)
    .default(60),
  PASSWORD_RESET_MAX_PER_DAY: Joi.number().integer().min(1).max(20).default(5),
});
