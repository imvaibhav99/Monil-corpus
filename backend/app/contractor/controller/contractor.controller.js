import httpStatus from 'http-status';
import { catchAsync } from '../../../helpers/catchAsync.js';
import { pick } from '../../../helpers/pick.js';
import * as contractorService from '../service/contractor.service.js';

export const searchContractors = catchAsync(async (req, res) => {
  const result = await contractorService.searchContractors(req.query);
  res.send(result);
});

export const getPublicProfile = catchAsync(async (req, res) => {
  const data = await contractorService.getPublicProfileBySlug(req.params.slug);
  // If user is not authenticated, remove contact information
  const isAuthenticated = req.user && req.user.id;
  const responseData = isAuthenticated ? data : contractorService.sanitizeProfileForPublic(data);
  res.send(responseData);
});

export const getReviews = catchAsync(async (req, res) => {
  res.send({ data: [], meta: { hasMore: false, nextCursor: null } });
});

export const getOwnProfile = catchAsync(async (req, res) => {
  const data = await contractorService.getProfileByUserId(req.user.id);
  res.send({ data });
});

export const updateOwnProfile = catchAsync(async (req, res) => {
  const data = await contractorService.updateProfile(req.user.id, req.body);
  res.send({ data });
});

export const addPortfolioItem = catchAsync(async (req, res) => {
  const data = await contractorService.addPortfolioItem(req.user.id, req.body);
  res.status(httpStatus.CREATED).send({ data });
});

export const removePortfolioItem = catchAsync(async (req, res) => {
  const data = await contractorService.removePortfolioItem(req.user.id, req.params.itemId);
  res.send({ data });
});

export const toggleAvailability = catchAsync(async (req, res) => {
  const data = await contractorService.toggleAvailability(req.user.id);
  res.send({ data });
});

export const listContractorsAdmin = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['cityId', 'badge', 'currentPlanTier', 'isAvailable']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await contractorService.listContractorsAdmin(filter, options);
  res.send({
    data: result.results,
    meta: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalResults: result.totalResults,
    },
  });
});

export const adminUpdateProfile = catchAsync(async (req, res) => {
  const data = await contractorService.adminUpdateProfile(req.params.userId, req.body);
  res.send({ data });
});
