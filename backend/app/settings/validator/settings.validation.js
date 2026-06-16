import Joi from 'joi';

export const updateSettings = {
  body: Joi.object()
    .keys({
      lead: Joi.object().keys({
        defaultExpiryDays: Joi.number().integer().min(1),
        eliteDelayHours: Joi.number().integer().min(0),
        growthDelayHours: Joi.number().integer().min(0),
        starterDelayHours: Joi.number().integer().min(0),
      }),
      ranking: Joi.object().keys({
        weights: Joi.object().keys({
          tier: Joi.number().min(0).max(1),
          rating: Joi.number().min(0).max(1),
          jobs: Joi.number().min(0).max(1),
          response: Joi.number().min(0).max(1),
          badge: Joi.number().min(0).max(1),
          completeness: Joi.number().min(0).max(1),
        }),
      }),
      contactReveal: Joi.object().keys({
        maxPerClientPerDay: Joi.number().integer().min(1),
      }),
      otp: Joi.object().keys({
        ttlMinutes: Joi.number().integer().min(1),
        maxAttempts: Joi.number().integer().min(1),
        requestsPerHour: Joi.number().integer().min(1),
      }),
      email: Joi.object().keys({
        supportAddress: Joi.string().email(),
      }),
    })
    .min(1),
};
