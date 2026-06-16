import passport from 'passport';
import httpStatus from 'http-status';
import { ApiError } from '../helpers/ApiError.js';
import { roleRights } from '../config/roles.js';

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role) || [];
    const hasRequiredRights = requiredRights.every((r) => userRights.includes(r));
    // Self-access escape hatch: a user hitting their own /users/:userId is allowed.
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }
  resolve();
};

export const auth = (...requiredRights) => (req, res, next) =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      'jwt',
      { session: false },
      verifyCallback(req, resolve, reject, requiredRights)
    )(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));

export const optionalAuth = (req, res, next) =>
  new Promise((resolve) => {
    passport.authenticate(
      'jwt',
      { session: false },
      (err, user) => {
        if (user) {
          req.user = user;
        }
        resolve();
      }
    )(req, res, next);
  })
    .then(() => next())
    .catch(() => next());
