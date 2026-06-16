import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { ContractorProfile } from '../model/contractorProfile.model.js';
import { City } from '../../city/model/city.model.js';
import { Category } from '../../category/model/category.model.js';
import { ApiError } from '../../../helpers/ApiError.js';

export const generateSlug = (businessName, cityName) => {
  const base = `${businessName}-${cityName}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(16).slice(2, 6);
  return `${base}-${suffix}`;
};

const computeCompleteness = (profile) => {
  let score = 0;
  if (profile.businessName) score += 15;
  if (profile.bio) score += 10;
  if (profile.yearsExperience > 0) score += 5;
  if (profile.languages && profile.languages.length > 0) score += 5;
  if (profile.cityId) score += 10;
  if (profile.pincode) score += 5;
  if (profile.categories && profile.categories.length > 0) score += 15;
  if (profile.profilePhotoUrl) score += 15;
  if (profile.portfolioItems && profile.portfolioItems.length > 0) score += 10;
  if (profile.workingHours && Object.keys(profile.workingHours).length > 0) score += 10;
  return Math.min(score, 100);
};

// Remove contact fields from profile for unauthenticated users
export const sanitizeProfileForPublic = (profile) => {
  if (!profile) return profile;
  const sanitized = profile.toObject ? profile.toObject() : JSON.parse(JSON.stringify(profile));
  // Remove contact channels for public view
  if (sanitized.contactChannels) {
    delete sanitized.contactChannels;
  }
  return sanitized;
};

export const getProfileByUserId = async (userId) => {
  const profile = await ContractorProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  return profile;
};

export const getPublicProfileBySlug = async (slug) => {
  const profile = await ContractorProfile.findOne({ slug, deletedAt: null })
    .populate('cityId', 'name slug state')
    .populate('categories.categoryId', 'name slug');
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor not found');
  return profile;
};

export const updateProfile = async (userId, updateBody) => {
  const profile = await ContractorProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor profile not found');

  const needsSlugRegen =
    (updateBody.businessName !== undefined && updateBody.businessName !== profile.businessName) ||
    (updateBody.cityId !== undefined && String(updateBody.cityId) !== String(profile.cityId));

  Object.assign(profile, updateBody);

  if (needsSlugRegen && profile.businessName) {
    let cityName = '';
    if (profile.cityId) {
      const city = await City.findById(profile.cityId).lean();
      if (city) cityName = city.slug;
    }
    profile.slug = generateSlug(profile.businessName, cityName);
  }

  profile.stats.profileCompleteness = computeCompleteness(profile);
  await profile.save();
  return profile;
};

export const searchContractors = async (filters) => {
  const { categorySlug, citySlug, badge, minRating, cursor, limit: rawLimit = 20 } = filters;

  const limit = Math.min(parseInt(rawLimit, 10) || 20, 50);
  const query = { deletedAt: null };

  if (badge) query.badge = badge;
  if (minRating) query['stats.avgRating'] = { $gte: parseFloat(minRating) };

  if (cursor) {
    try {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } catch {
      // invalid cursor — ignore and start from the beginning
    }
  }

  if (citySlug) {
    const city = await City.findOne({ slug: citySlug, isActive: true }).lean();
    if (city) query.cityId = city._id;
  }

  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug, isActive: true }).lean();
    if (category) query['categories.categoryId'] = category._id;
  }

  const docs = await ContractorProfile.find(query)
    .sort({ rankingScore: -1, _id: -1 })
    .limit(limit + 1)
    .populate('cityId', 'name slug state')
    .populate('categories.categoryId', 'name slug');

  const hasMore = docs.length > limit;
  const data = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore ? String(data[data.length - 1]._id) : null;

  return { data, meta: { hasMore, nextCursor } };
};

export const addPortfolioItem = async (userId, item) => {
  const profile = await ContractorProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  if (profile.portfolioItems.length >= 30) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Portfolio limit of 30 items reached');
  }
  profile.portfolioItems.push(item);
  await profile.save();
  return profile;
};

export const removePortfolioItem = async (userId, itemId) => {
  const profile = await ContractorProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  const idx = profile.portfolioItems.findIndex((p) => String(p._id) === itemId);
  if (idx === -1) throw new ApiError(httpStatus.NOT_FOUND, 'Portfolio item not found');
  profile.portfolioItems.splice(idx, 1);
  await profile.save();
  return profile;
};

export const toggleAvailability = async (userId) => {
  const profile = await ContractorProfile.findOne({ userId, deletedAt: null });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  profile.isAvailable = !profile.isAvailable;
  await profile.save();
  return profile;
};

export const listContractorsAdmin = async (filter, options) => {
  const query = { deletedAt: null };
  if (filter.cityId) query.cityId = filter.cityId;
  if (filter.badge) query.badge = filter.badge;
  if (filter.currentPlanTier) query.currentPlanTier = filter.currentPlanTier;
  if (filter.isAvailable !== undefined) query.isAvailable = filter.isAvailable === 'true';
  return ContractorProfile.paginate(query, options);
};

export const adminUpdateProfile = async (userId, updateBody) => {
  const profile = await ContractorProfile.findOne({ userId });
  if (!profile) throw new ApiError(httpStatus.NOT_FOUND, 'Contractor profile not found');
  Object.assign(profile, updateBody);
  await profile.save();
  return profile;
};
