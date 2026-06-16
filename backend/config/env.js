import dotenv from 'dotenv';

dotenv.config();

// JWT_SECRET is the boilerplate convention; fall back to JWT_ACCESS_SECRET
// if it isn't set, so an existing Phase 1 .env keeps working.
const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;

const required = ['MONGO_URI', 'RESEND_API_KEY', 'EMAIL_FROM'];
const missing = required.filter((k) => !process.env[k]);
if (!jwtSecret) missing.push('JWT_SECRET (or JWT_ACCESS_SECRET)');
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,

  mongoUri: process.env.MONGO_URI,

  jwt: {
    secret: jwtSecret,
    accessExpirationMinutes: Number(process.env.JWT_ACCESS_EXPIRATION_MINUTES) || 30,
    refreshExpirationDays: Number(process.env.JWT_REFRESH_EXPIRATION_DAYS) || 30,
    resetPasswordExpirationMinutes:
      Number(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES) || 10,
    verifyEmailExpirationMinutes:
      Number(process.env.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES) || 10,
  },

  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
  },

  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
};
