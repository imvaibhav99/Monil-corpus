import Joi from 'joi';
import { objectId } from '../../../helpers/customValidation.js';

const slugSchema = Joi.string()
  .lowercase()
  .pattern(/^[a-z0-9-]+$/)
  .message('slug must be lowercase alphanumeric and hyphens only');

export const listCategories = {
  query: Joi.object().keys({
    parentId: Joi.string().custom(objectId),
  }),
};

export const getCategory = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

export const createCategory = {
  body: Joi.object().keys({
    slug: slugSchema.required(),
    name: Joi.string().required().trim(),
    description: Joi.string().allow('').default(''),
    iconUrl: Joi.string().uri().allow('').default(''),
    parentId: Joi.string().custom(objectId).allow(null),
    isActive: Joi.boolean().default(true),
    sortOrder: Joi.number().integer().default(0),
    metadata: Joi.object().default({}),
  }),
};

export const updateCategory = {
  params: Joi.object().keys({
    categoryId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      slug: slugSchema,
      name: Joi.string().trim(),
      description: Joi.string().allow(''),
      iconUrl: Joi.string().uri().allow(''),
      parentId: Joi.string().custom(objectId).allow(null),
      isActive: Joi.boolean(),
      sortOrder: Joi.number().integer(),
      metadata: Joi.object(),
    })
    .min(1),
};
