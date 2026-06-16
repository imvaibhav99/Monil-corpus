import httpStatus from 'http-status';
import * as tokenService from './token.service.js';
import * as userService from '../../user/service/user.service.js';
import { Token } from '../model/token.model.js';
import { ApiError } from '../../../helpers/ApiError.js';
import { tokenTypes } from '../../../config/tokens.js';
import { ContractorProfile } from '../../contractor/model/contractorProfile.model.js';
import { ClientProfile } from '../../client/model/clientProfile.model.js';

export const register = async (userBody) => {
  const user = await userService.createUser(userBody);
  try {
    if (user.role === 'CONTRACTOR') {
      await ContractorProfile.create({ userId: user.id, badge: 'BRONZE' });
    } else if (user.role === 'CLIENT') {
      await ClientProfile.create({ userId: user.id });
    }
  } catch (err) {
    // Profile creation is best-effort; a failure must not roll back registration.
    // eslint-disable-next-line no-console
    console.error('Profile shell creation failed for user', user.id, err.message);
  }
  return user;
};

export const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

export const logout = async (refreshToken) => {
  const doc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  await doc.deleteOne();
};

export const refreshAuth = async (refreshToken) => {
  try {
    const doc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(doc.user);
    if (!user) throw new Error();
    await doc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

export const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const doc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(doc.user);
    if (!user) throw new Error();
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

export const verifyEmail = async (verifyEmailToken) => {
  try {
    const doc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(doc.user);
    if (!user) throw new Error();
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};
