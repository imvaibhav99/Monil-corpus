import { api } from '../../../config/api.js';

export const createJob = (data) => api.post('/jobs', data).then(r => r.data);
export const getMyJobs = (params) => api.get('/jobs', { params }).then(r => r.data);
export const getJobById = (jobId) => api.get(`/jobs/${jobId}`).then(r => r.data);
export const updateJob = (jobId, data) => api.patch(`/jobs/${jobId}`, data).then(r => r.data);
export const cancelJob = (jobId) => api.post(`/jobs/${jobId}/cancel`).then(r => r.data);
export const assignContractor = (jobId, contractorId) =>
  api.post(`/jobs/${jobId}/assign`, { contractorId }).then(r => r.data);

export const getMyLeads = (params) => api.get('/jobs/leads', { params }).then(r => r.data);
export const markLeadContacted = (leadId) => api.post(`/jobs/leads/${leadId}/contact`).then(r => r.data);
