import Joi from 'joi';
import { objectId } from '../../../helpers/customValidation.js';

const geoSchema = Joi.object().keys({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array().items(Joi.number()).length(2).required(),
});

const categoryEntrySchema = Joi.object().keys({
  categoryId: Joi.string().required().custom(objectId),
  primary: Joi.boolean().default(false),
});

const contactChannelsSchema = Joi.object().keys({
  phone: Joi.string().allow(''),
  whatsapp: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  telegram: Joi.string().allow(''),
  preferredChannel: Joi.string().valid('phone', 'whatsapp', 'email', 'telegram').allow(''),
});

export const searchContractors = {
  query: Joi.object().keys({
    categorySlug: Joi.string(),
    citySlug: Joi.string(),
    badge: Joi.string().valid('NONE', 'BRONZE', 'SILVER', 'GOLD'),
    minRating: Joi.number().min(0).max(5),
    cursor: Joi.string(),
    limit: Joi.number().integer().min(1).max(50),
  }),
};

export const getPublicProfile = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

export const getReviews = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

export const updateOwnProfile = {
  body: Joi.object()
    .keys({
      businessName: Joi.string().trim(),
      bio: Joi.string().max(500).allow(''),
      yearsExperience: Joi.number().integer().min(0),
      languages: Joi.array().items(Joi.string()),
      cityId: Joi.string().custom(objectId).allow(null),
      pincode: Joi.string().allow(''),
      address: Joi.string().allow(''),
      geo: geoSchema.allow(null),
      serviceRadiusKm: Joi.number().min(0),
      categories: Joi.array().items(categoryEntrySchema),
      profilePhotoUrl: Joi.string().uri().allow(''),
      coverPhotoUrl: Joi.string().uri().allow(''),
      workingHours: Joi.object(),
      emergencyService: Joi.boolean(),
      contactChannels: contactChannelsSchema,
    })
    .min(1),
};

export const addPortfolioItem = {
  body: Joi.object().keys({
    imageUrl: Joi.string().required().uri(),
    caption: Joi.string().allow('').default(''),
  }),
};

export const removePortfolioItem = {
  params: Joi.object().keys({
    itemId: Joi.string().required().custom(objectId),
  }),
};

export const toggleAvailability = {
  body: Joi.object().keys({}),
};

export const listContractorsAdmin = {
  query: Joi.object().keys({
    cityId: Joi.string().custom(objectId),
    badge: Joi.string().valid('NONE', 'BRONZE', 'SILVER', 'GOLD'),
    currentPlanTier: Joi.string().valid('FREE', 'STARTER', 'GROWTH', 'ELITE'),
    isAvailable: Joi.string().valid('true', 'false'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const adminUpdateContractor = {
  params: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      businessName: Joi.string().trim(),
      bio: Joi.string().max(500).allow(''),
      badge: Joi.string().valid('NONE', 'BRONZE', 'SILVER', 'GOLD'),
      verificationStage: Joi.string().valid(
        'NOT_STARTED',
        'DOCS_PENDING',
        'UNDER_REVIEW',
        'APPROVED'
      ),
      isFeatured: Joi.boolean(),
      featuredUntil: Joi.date().allow(null),
      currentPlanTier: Joi.string().valid('FREE', 'STARTER', 'GROWTH', 'ELITE'),
      subscriptionExpiresAt: Joi.date().allow(null),
      rankingScore: Joi.number(),
      isAvailable: Joi.boolean(),
    })
    .min(1),
};
