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

const portfolioItemSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const categoryEntrySchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    primary: { type: Boolean, default: false },
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    responseTimeMinutes: { type: Number, default: 0 },
    profileCompleteness: { type: Number, default: 0 },
  },
  { _id: false }
);

const contractorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, default: '' },
    slug: { type: String, unique: true, sparse: true },
    bio: { type: String, default: '', maxlength: 500 },
    yearsExperience: { type: Number, default: 0 },
    languages: { type: [String], default: [] },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', default: null },
    pincode: { type: String, default: '' },
    address: { type: String, default: '' },
    geo: { type: pointSchema, default: null },
    serviceRadiusKm: { type: Number, default: 15 },
    categories: { type: [categoryEntrySchema], default: [] },
    badge: { type: String, enum: ['NONE', 'BRONZE', 'SILVER', 'GOLD'], default: 'NONE' },
    verifiedAt: { type: Date },
    verificationStage: {
      type: String,
      enum: ['NOT_STARTED', 'DOCS_PENDING', 'UNDER_REVIEW', 'APPROVED'],
      default: 'NOT_STARTED',
    },
    profilePhotoUrl: { type: String, default: '' },
    coverPhotoUrl: { type: String, default: '' },
    portfolioItems: { type: [portfolioItemSchema], default: [] },
    workingHours: { type: Object, default: {} },
    emergencyService: { type: Boolean, default: false },
    stats: { type: statsSchema, default: () => ({}) },
    rankingScore: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },
    currentPlanTier: {
      type: String,
      enum: ['FREE', 'STARTER', 'GROWTH', 'ELITE'],
      default: 'FREE',
    },
    subscriptionExpiresAt: { type: Date, default: null },
    contactChannels: {
      phone: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' },
      telegram: { type: String, default: '' },
      preferredChannel: {
        type: String,
        enum: ['email', 'phone', 'whatsapp', 'telegram'],
        default: 'whatsapp',
      },
    },
    metadata: { type: Object, default: {} },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

contractorProfileSchema.plugin(toJSON);
contractorProfileSchema.plugin(paginate);

contractorProfileSchema.index({ cityId: 1, badge: 1 });
contractorProfileSchema.index({ rankingScore: -1 });
contractorProfileSchema.index({ 'categories.categoryId': 1, cityId: 1 });
contractorProfileSchema.index({ geo: '2dsphere' }, { sparse: true });
contractorProfileSchema.index({ isFeatured: 1, featuredUntil: 1 });
contractorProfileSchema.index({ currentPlanTier: 1, isAvailable: 1 });

export const ContractorProfile = mongoose.model('ContractorProfile', contractorProfileSchema);
