import httpStatus from 'http-status';
import { Job } from '../model/job.model.js';
import { Lead } from '../model/lead.model.js';
import { ContractorProfile } from '../../contractor/model/contractorProfile.model.js';
import { ApiError } from '../../../helpers/ApiError.js';

export const createJob = async (clientId, jobData) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const job = await Job.create({
    ...jobData,
    clientId,
    expiresAt,
  });

  // Automatically create leads for contractors with matching category and city
  await distributeJobLeads(job);

  return job;
};

export const distributeJobLeads = async (job) => {
  try {
    // Find contractors who:
    // 1. Are in the same city as the job
    // 2. Offer the same service category as the job
    // 3. Are available and have at least Bronze badge
    const contractors = await ContractorProfile.find({
      cityId: job.cityId,
      'categories.categoryId': job.categoryId,
      isAvailable: true,
      badge: { $ne: 'NONE' },
      deletedAt: null,
    }).select('_id').lean();

    if (contractors.length === 0) {
      console.log(`No eligible contractors for job ${job._id}`);
      return { leadsCreated: 0 };
    }

    // Create lead for each eligible contractor
    const leadData = contractors.map(contractor => ({
      jobId: job._id,
      contractorId: contractor._id,
      status: 'NEW',
      visibleFrom: new Date(),
      expiresAt: job.expiresAt,
    }));

    const leads = await Lead.insertMany(leadData);

    // Update job with response count
    job.responseCount = 0;
    await job.save();

    console.log(`Created ${leads.length} leads for job ${job._id}`);
    return { leadsCreated: leads.length, contractorCount: contractors.length };
  } catch (error) {
    console.error('Error distributing leads for job:', error);
    throw error;
  }
};

export const getJobById = async (jobId) => {
  const job = await Job.findById(jobId)
    .populate('clientId', 'name email')
    .populate('categoryId', 'name slug')
    .populate('cityId', 'name slug state')
    .populate('assignedContractorId', 'name email');
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  return job;
};

export const getClientJobs = async (clientId, filter = {}, options = {}) => {
  const query = { clientId, deletedAt: null, ...filter };
  return Job.paginate(query, {
    ...options,
    sortBy: 'createdAt:desc',
    populate: 'categoryId,cityId,assignedContractorId',
  });
};

export const updateJob = async (jobId, clientId, updateData) => {
  const job = await Job.findOne({ _id: jobId, clientId });
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');

  Object.assign(job, updateData);
  await job.save();
  return job;
};

export const cancelJob = async (jobId, clientId) => {
  const job = await Job.findOne({ _id: jobId, clientId });
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  if (job.status !== 'OPEN') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Can only cancel open jobs');
  }
  job.status = 'CANCELLED';
  await job.save();
  return job;
};

export const assignContractor = async (jobId, clientId, contractorId) => {
  const job = await Job.findOne({ _id: jobId, clientId });
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');

  job.assignedContractorId = contractorId;
  job.status = 'ASSIGNED';
  await job.save();

  const lead = await Lead.findOne({ jobId, contractorId });
  if (lead) {
    lead.status = 'WON';
    lead.wonAt = new Date();
    await lead.save();
  }

  return job;
};

export const getContractorLeads = async (contractorId, contractorCityId, filter = {}, options = {}) => {
  const now = new Date();

  // Get all leads for this contractor
  const leads = await Lead.find({
    contractorId,
    visibleFrom: { $lte: now },
    ...filter,
  })
    .populate('jobId')
    .lean();

  // Filter to only include leads where job's city matches contractor's current city
  const filteredLeads = leads.filter(lead => {
    if (!lead.jobId) return false;
    return String(lead.jobId.cityId) === String(contractorCityId);
  });

  // Return in paginated format
  const limit = parseInt(options.limit) || 10;
  const page = parseInt(options.page) || 1;
  const skip = (page - 1) * limit;
  const paginatedLeads = filteredLeads.slice(skip, skip + limit);

  return {
    results: paginatedLeads,
    page,
    limit,
    totalPages: Math.ceil(filteredLeads.length / limit),
    totalResults: filteredLeads.length,
  };
};

export const markLeadContacted = async (leadId, contractorId) => {
  const lead = await Lead.findOne({ _id: leadId, contractorId });
  if (!lead) throw new ApiError(httpStatus.NOT_FOUND, 'Lead not found');

  if (lead.status === 'NEW' || lead.status === 'VIEWED') {
    lead.status = 'CONTACTED';
    lead.contactedAt = new Date();
    if (lead.visibleFrom) {
      lead.respondedInMs = lead.contactedAt - lead.visibleFrom;
    }
    await lead.save();

    const job = await Job.findById(lead.jobId);
    if (job) {
      job.responseCount = (job.responseCount || 0) + 1;
      await job.save();
    }
  }

  return lead;
};

export const createLeads = async (jobId, contractorIds, visibleFrom = new Date()) => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');

  const leads = await Lead.insertMany(
    contractorIds.map(contractorId => ({
      jobId,
      contractorId,
      visibleFrom,
      expiresAt: job.expiresAt,
    }))
  );

  return leads;
};
