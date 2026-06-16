import { Settings } from '../model/settings.model.js';

export const getSettings = async () => {
  let settings = await Settings.findById('platform');
  if (!settings) {
    settings = await Settings.create({ _id: 'platform' });
  }
  return settings;
};

export const updateSettings = async (updateBody) => {
  const settings = await getSettings();
  Object.assign(settings, updateBody);
  Object.keys(updateBody).forEach((k) => settings.markModified(k));
  await settings.save();
  return settings;
};
