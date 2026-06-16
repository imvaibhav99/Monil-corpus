import mongoose from 'mongoose';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';
import { paginate } from '../../../helpers/plugins/paginate.plugin.js';

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
  { _id: false }
);

const citySchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, default: 'India' },
    geo: { type: pointSchema, default: null },
    isActive: { type: Boolean, default: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

citySchema.plugin(toJSON);
citySchema.plugin(paginate);

citySchema.index({ state: 1 });
citySchema.index({ isActive: 1 });
citySchema.index({ geo: '2dsphere' }, { sparse: true });

export const City = mongoose.model('City', citySchema);
