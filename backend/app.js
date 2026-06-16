import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import passport from 'passport';
import httpStatus from 'http-status';
import { env } from './config/env.js';
import { jwtStrategy } from './config/passport.js';
import * as morganLogger from './config/morgan.js';
import routes from './routes/index.js';
import { errorConverter, errorHandler } from './middleware/error.js';
import { authLimiter, globalLimiter } from './middleware/rateLimiter.js';
import { ApiError } from './helpers/ApiError.js';

export function createApp() {
  const app = express();

  // Trust the first proxy so req.ip reflects the real client behind Nginx/Vercel.
  app.set('trust proxy', 1);

  // Request logging (skip in test env if we add one later).
  if (env.nodeEnv !== 'test') {
    app.use(morganLogger.successHandler);
    app.use(morganLogger.errorHandler);
  }

  // Security headers + HSTS (helmet defaults include HSTS, CSP, etc.).
  app.use(helmet());

  // Body parsers with a tight size cap to blunt JSON-bomb attacks.
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Strip `$` and `.` operators from req.body/query/params to block NoSQL injection.
  app.use(mongoSanitize());

  // Sanitize string fields against XSS payloads.
  app.use(xss());

  // Drop duplicate query params (e.g., ?role=A&role=B becomes role=A).
  app.use(hpp());

  // gzip responses.
  app.use(compression());

  // CORS.
  app.use(
    cors({
      origin: env.frontendOrigin,
      credentials: true,
    })
  );
  app.options('*', cors());

  // Passport JWT.
  app.use(passport.initialize());
  passport.use('jwt', jwtStrategy);

  // Rate limiting (production only — keeps local dev painless).
  if (env.isProd) {
    app.use('/v1', globalLimiter);
    app.use('/v1/auth', authLimiter);
  }

  // Routes.
  app.use('/v1', routes);

  // 404 + error pipeline.
  app.use((_req, _res, next) => next(new ApiError(httpStatus.NOT_FOUND, 'Not found')));
  app.use(errorConverter);
  app.use(errorHandler);

  return app;
}
