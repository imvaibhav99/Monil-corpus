import mongoose from 'mongoose';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';
import { paginate } from '../../../helpers/plugins/paginate.plugin.js';

const statsSchema = new mongoose.Schema(
  {
    jobsPosted: { type: Number, default: 0 },
    reviewsWritten: { type: Number, default: 0 },
  },
  { _id: false }
);

const clientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phone: { type: String, default: '' },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', default: null },
    pincode: { type: String, default: '' },
    address: { type: String, default: '' },
    preferences: { type: Object, default: {} },
    stats: { type: statsSchema, default: () => ({}) },
    metadata: { type: Object, default: {} },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

clientProfileSchema.plugin(toJSON);
clientProfileSchema.plugin(paginate);

clientProfileSchema.index({ cityId: 1 });

export const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);
