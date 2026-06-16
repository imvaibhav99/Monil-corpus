import { api } from '../../../config/api.js';

export const searchContractors = (params) => api.get('/contractors', { params }).then(r => r.data);
export const getContractorBySlug = (slug) => api.get(`/contractors/${slug}`).then(r => r.data);
export const getMyProfile = () => api.get('/contractor/profile').then(r => r.data);
export const updateMyProfile = (data) => api.patch('/contractor/profile', data).then(r => r.data);
export const addPortfolioItem = (data) => api.post('/contractor/portfolio', data).then(r => r.data);
export const deletePortfolioItem = (id) => api.delete(`/contractor/portfolio/${id}`).then(r => r.data);
export const toggleAvailability = () => api.post('/contractor/availability').then(r => r.data);
export const getAdminContractors = (params) => api.get('/admin/contractors', { params }).then(r => r.data);
export const adminUpdateContractor = (userId, data) => api.patch(`/admin/contractors/${userId}`, data).then(r => r.data);
