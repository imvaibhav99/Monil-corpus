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

const jobSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    pincode: { type: String, default: '' },
    address: { type: String, default: '' },
    geo: { type: pointSchema, default: null },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    budgetMin: { type: Number, default: null },
    budgetMax: { type: Number, default: null },
    attachments: { type: [String], default: [] },
    urgency: {
      type: String,
      enum: ['NORMAL', 'URGENT', 'EMERGENCY'],
      default: 'NORMAL',
    },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
      default: 'OPEN',
    },
    assignedContractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    expiresAt: { type: Date, required: true },
    responseCount: { type: Number, default: 0 },
    metadata: { type: Object, default: {} },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.plugin(toJSON);
jobSchema.plugin(paginate);

jobSchema.index({ clientId: 1, status: 1, createdAt: -1 });
jobSchema.index({ categoryId: 1, cityId: 1, status: 1 });
jobSchema.index({ status: 1, expiresAt: 1 });
jobSchema.index({ assignedContractorId: 1 });

export const Job = mongoose.model('Job', jobSchema);
