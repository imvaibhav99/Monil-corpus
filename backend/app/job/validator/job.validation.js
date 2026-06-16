import Joi from 'joi';

export const createJob = {
  body: Joi.object().keys({
    categoryId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
    cityId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
    title: Joi.string().required().max(200),
    description: Joi.string().required().max(2000),
    budgetMin: Joi.number().positive().default(null),
    budgetMax: Joi.number().positive().default(null),
    pincode: Joi.string().default(''),
    address: Joi.string().default(''),
    attachments: Joi.array().items(Joi.string().uri()).default([]),
    urgency: Joi.string().valid('NORMAL', 'URGENT', 'EMERGENCY').default('NORMAL'),
  }),
};

export const getMyJob = {
  params: Joi.object().keys({
    jobId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  }),
};

export const getMyJobs = {
  query: Joi.object().keys({
    status: Joi.string().valid('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
    sortBy: Joi.string(),
  }),
};

export const updateMyJob = {
  params: Joi.object().keys({
    jobId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().max(200),
      description: Joi.string().max(2000),
      budgetMin: Joi.number().positive(),
      budgetMax: Joi.number().positive(),
      urgency: Joi.string().valid('NORMAL', 'URGENT', 'EMERGENCY'),
      attachments: Joi.array().items(Joi.string().uri()),
    })
    .min(1),
};

export const cancelMyJob = {
  params: Joi.object().keys({
    jobId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  }),
};

export const assignContractor = {
  params: Joi.object().keys({
    jobId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  }),
  body: Joi.object().keys({
    contractorId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  }),
};

export const getMyLeads = {
  query: Joi.object().keys({
    status: Joi.string().valid('NEW', 'VIEWED', 'CONTACTED', 'WON', 'LOST', 'EXPIRED'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
    sortBy: Joi.string(),
  }),
};

export const markLeadContacted = {
  params: Joi.object().keys({
    leadId: Joi.string().required().regex(/^[0-9a-fA-F]{24}$/),
  }),
};
