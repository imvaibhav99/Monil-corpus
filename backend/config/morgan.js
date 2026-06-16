import morgan from 'morgan';
import { env } from './env.js';

// Custom token that surfaces the error message stashed on res.locals by the
// error handler, so 4xx/5xx logs include the cause.
morgan.token('message', (_req, res) => res.locals.errorMessage || '');

const getIpFormat = () => (env.isProd ? ':remote-addr - ' : '');
const successFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

export const successHandler = morgan(successFormat, {
  skip: (_req, res) => res.statusCode >= 400,
  stream: { write: (message) => process.stdout.write(message) },
});

export const errorHandler = morgan(errorFormat, {
  skip: (_req, res) => res.statusCode < 400,
  stream: { write: (message) => process.stderr.write(message) },
});
