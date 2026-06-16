import Joi from 'joi';
import { objectId } from '../../../helpers/customValidation.js';

const slugSchema = Joi.string()
  .lowercase()
  .pattern(/^[a-z0-9-]+$/)
  .message('slug must be lowercase alphanumeric and hyphens only');

const geoSchema = Joi.object().keys({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array().items(Joi.number()).length(2).required(),
});

export const listCities = {
  query: Joi.object().keys({
    state: Joi.string(),
  }),
};

export const getCity = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

export const createCity = {
  body: Joi.object().keys({
    slug: slugSchema.required(),
    name: Joi.string().required().trim(),
    state: Joi.string().required().trim(),
    country: Joi.string().default('India'),
    geo: geoSchema,
    isActive: Joi.boolean().default(true),
    metadata: Joi.object().default({}),
  }),
};

export const updateCity = {
  params: Joi.object().keys({
    cityId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      slug: slugSchema,
      name: Joi.string().trim(),
      state: Joi.string().trim(),
      country: Joi.string(),
      geo: geoSchema,
      isActive: Joi.boolean(),
      metadata: Joi.object(),
    })
    .min(1),
};
