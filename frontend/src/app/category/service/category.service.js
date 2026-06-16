import { api } from '../../../config/api.js';

export const getCategories = () => api.get('/categories').then(r => r.data);
export const getCategoryBySlug = (slug) => api.get(`/categories/${slug}`).then(r => r.data);
export const createCategory = (data) => api.post('/admin/categories', data).then(r => r.data);
export const updateCategory = (id, data) => api.patch(`/admin/categories/${id}`, data).then(r => r.data);
