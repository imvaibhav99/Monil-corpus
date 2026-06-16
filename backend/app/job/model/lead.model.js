import mongoose from 'mongoose';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';
import { paginate } from '../../../helpers/plugins/paginate.plugin.js';

const leadSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['NEW', 'VIEWED', 'CONTACTED', 'WON', 'LOST', 'EXPIRED'],
      default: 'NEW',
    },
    visibleFrom: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    viewedAt: { type: Date, default: null },
    contactedAt: { type: Date, default: null },
    respondedInMs: { type: Number, default: null },
    wonAt: { type: Date, default: null },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

leadSchema.plugin(toJSON);
leadSchema.plugin(paginate);

leadSchema.index({ contractorId: 1, status: 1, visibleFrom: 1 });
leadSchema.index({ jobId: 1 });
leadSchema.index({ expiresAt: 1, status: 1 });
leadSchema.index({ jobId: 1, contractorId: 1 }, { unique: true });

export const Lead = mongoose.model('Lead', leadSchema);
