import Joi from 'joi';
import { objectId } from '../../../helpers/customValidation.js';

export const updateOwnProfile = {
  body: Joi.object()
    .keys({
      cityId: Joi.string().custom(objectId).allow(null),
      pincode: Joi.string().allow(''),
      address: Joi.string().allow(''),
      preferences: Joi.object(),
    })
    .min(1),
};
