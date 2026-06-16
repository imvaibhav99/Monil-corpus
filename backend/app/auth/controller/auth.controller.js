import httpStatus from 'http-status';
import { catchAsync } from '../../../helpers/catchAsync.js';
import * as authService from '../service/auth.service.js';
import * as tokenService from '../service/token.service.js';
import * as emailService from '../service/email.service.js';
import * as userService from '../../user/service/user.service.js';

export const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const resetToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

export const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});
