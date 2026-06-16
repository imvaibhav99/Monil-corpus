import { api } from '../../../config/api.js';

export const getMyProfile = () => api.get('/client/profile').then(r => r.data);
export const updateMyProfile = (data) => api.patch('/client/profile', data).then(r => r.data);
