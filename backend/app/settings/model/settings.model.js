import mongoose from 'mongoose';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'platform' },
    lead: {
      type: Object,
      default: () => ({
        defaultExpiryDays: 7,
        eliteDelayHours: 0,
        growthDelayHours: 24,
        starterDelayHours: 48,
      }),
    },
    ranking: {
      type: Object,
      default: () => ({
        weights: {
          tier: 0.3,
          rating: 0.25,
          jobs: 0.15,
          response: 0.15,
          badge: 0.1,
          completeness: 0.05,
        },
      }),
    },
    contactReveal: {
      type: Object,
      default: () => ({ maxPerClientPerDay: 20 }),
    },
    otp: {
      type: Object,
      default: () => ({ ttlMinutes: 5, maxAttempts: 5, requestsPerHour: 3 }),
    },
    email: {
      type: Object,
      default: () => ({ supportAddress: 'support@ballu.in' }),
    },
  },
  { timestamps: true }
);

settingsSchema.plugin(toJSON);

export const Settings = mongoose.model('Settings', settingsSchema);
