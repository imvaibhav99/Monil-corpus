import rateLimit from 'express-rate-limit';

// Tight cap on auth endpoints to slow credential stuffing and reset-token abuse.
// `skipSuccessfulRequests: true` means a successful login doesn't count against the limit.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: 'Too many requests, please try again later.' },
});

// Soft cap on every API request — guards against runaway clients / scrapers.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: 'Too many requests, please try again later.' },
});
