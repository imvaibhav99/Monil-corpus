import mongoose from 'mongoose';
import { toJSON } from '../../../helpers/plugins/toJSON.plugin.js';
import { paginate } from '../../../helpers/plugins/paginate.plugin.js';

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    iconUrl: { type: String, default: '' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ parentId: 1 });

export const Category = mongoose.model('Category', categorySchema);
