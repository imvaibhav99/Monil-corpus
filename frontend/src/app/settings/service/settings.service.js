import { api } from '../../../config/api.js';

export const getSettings = () => api.get('/admin/settings').then(r => r.data);
export const updateSettings = (data) => api.patch('/admin/settings', data).then(r => r.data);
