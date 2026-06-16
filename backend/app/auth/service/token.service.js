import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import { env } from '../../../config/env.js';
import { tokenTypes } from '../../../config/tokens.js';
import { Token } from '../model/token.model.js';
import { ApiError } from '../../../helpers/ApiError.js';
import * as userService from '../../user/service/user.service.js';

export const generateToken = (userId, expires, type, secret = env.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

export const saveToken = async (token, userId, expires, type, blacklisted = false) =>
  Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });

// Verifies a non-access token by JWT and DB record. Throws on any mismatch.
export const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, env.jwt.secret);
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) throw new Error('Token not found');
  return tokenDoc;
};

export const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(env.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(env.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: { token: accessToken, expires: accessTokenExpires.toDate() },
    refresh: { token: refreshToken, expires: refreshTokenExpires.toDate() },
  };
};

export const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  const expires = moment().add(env.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetToken, user.id, expires, tokenTypes.RESET_PASSWORD);
  return resetToken;
};

export const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(env.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyToken = generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyToken;
};
