import { catchAsync } from '../../../helpers/catchAsync.js';
import * as settingsService from '../service/settings.service.js';

export const getSettings = catchAsync(async (req, res) => {
  const data = await settingsService.getSettings();
  res.send({ data });
});

export const updateSettings = catchAsync(async (req, res) => {
  const data = await settingsService.updateSettings(req.body);
  res.send({ data });
});
