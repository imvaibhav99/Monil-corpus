import { api } from '../../../config/api.js';

export const getCities = () => api.get('/cities').then(r => r.data);
export const getCityBySlug = (slug) => api.get(`/cities/${slug}`).then(r => r.data);
export const createCity = (data) => api.post('/admin/cities', data).then(r => r.data);
export const updateCity = (id, data) => api.patch(`/admin/cities/${id}`, data).then(r => r.data);
