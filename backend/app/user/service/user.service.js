import httpStatus from 'http-status';
import { User } from '../model/user.model.js';
import { ApiError } from '../../../helpers/ApiError.js';

export const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return User.create(userBody);
};

export const queryUsers = async (filter, options) => User.paginate(filter, options);

export const getUserById = async (id) => User.findById(id);

export const getUserByEmail = async (email) => User.findOne({ email });

export const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

export const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  // Mongoose 7+: doc.remove() is removed; use deleteOne().
  await user.deleteOne();
  return user;
};
