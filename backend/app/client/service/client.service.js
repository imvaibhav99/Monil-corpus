import httpStatus from 'http-status';
import { ClientProfile } from '../model/clientProfile.model.js';
import { ApiError } from '../../../helpers/ApiError.js';

export const getProfileByUserId = async (userId) => {
  let profile = await ClientProfile.findOne({ userId, deletedAt: null }).populate('cityId', 'name slug state');
  if (!profile) {
    // Auto-create missing profile (for existing users from before this feature)
    profile = await ClientProfile.create({ userId });
    profile = await ClientProfile.findById(profile._id).populate('cityId', 'name slug state');
  }
  return profile;
};

export const updateProfile = async (userId, updateBody) => {
  let profile = await ClientProfile.findOne({ userId, deletedAt: null });
  if (!profile) {
    // Auto-create missing profile (for existing users from before this feature)
    profile = await ClientProfile.create({ userId, ...updateBody });
  } else {
    Object.assign(profile, updateBody);
    await profile.save();
  }
  return profile.populate('cityId', 'name slug state');
};
