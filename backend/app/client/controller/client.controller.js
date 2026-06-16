import { catchAsync } from '../../../helpers/catchAsync.js';
import * as clientService from '../service/client.service.js';

export const getOwnProfile = catchAsync(async (req, res) => {
  const data = await clientService.getProfileByUserId(req.user.id);
  res.send({ data });
});

export const updateOwnProfile = catchAsync(async (req, res) => {
  const data = await clientService.updateProfile(req.user.id, req.body);
  res.send({ data });
});
