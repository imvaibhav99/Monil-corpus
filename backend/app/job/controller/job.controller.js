import httpStatus from 'http-status';
import { catchAsync } from '../../../helpers/catchAsync.js';
import { pick } from '../../../helpers/pick.js';
import * as jobService from '../service/job.service.js';

export const createJob = catchAsync(async (req, res) => {
  const data = await jobService.createJob(req.user.id, req.body);
  // data includes the job document
  // Leads are created automatically in the service
  res.status(httpStatus.CREATED).send({
    data,
    message: `Job posted successfully! Sent to contractors in your area.`,
  });
});

export const getMyJob = catchAsync(async (req, res) => {
  const data = await jobService.getJobById(req.params.jobId);
  if (String(data.clientId._id) !== String(req.user.id)) {
    return res.status(httpStatus.FORBIDDEN).send({ message: 'Not authorized' });
  }
  res.send({ data });
});

export const getMyJobs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await jobService.getClientJobs(req.user.id, filter, options);
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

export const updateMyJob = catchAsync(async (req, res) => {
  const data = await jobService.updateJob(req.params.jobId, req.user.id, req.body);
  res.send({ data });
});

export const cancelMyJob = catchAsync(async (req, res) => {
  const data = await jobService.cancelJob(req.params.jobId, req.user.id);
  res.send({ data });
});

export const assignContractor = catchAsync(async (req, res) => {
  const { contractorId } = req.body;
  const data = await jobService.assignContractor(
    req.params.jobId,
    req.user.id,
    contractorId
  );
  res.send({ data });
});

export const getMyLeads = catchAsync(async (req, res) => {
  // Get contractor's current city from their profile
  const { ContractorProfile } = await import('../../contractor/model/contractorProfile.model.js');
  const profile = await ContractorProfile.findOne({ userId: req.user.id });

  if (!profile || !profile.cityId) {
    // Contractor hasn't set their city yet
    return res.send({
      data: [],
      meta: {
        page: 1,
        limit: 20,
        totalPages: 0,
        totalResults: 0,
        message: 'Please set your city in your profile to see job opportunities',
      },
    });
  }

  const filter = pick(req.query, ['status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await jobService.getContractorLeads(req.user.id, profile.cityId, filter, options);
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

export const markLeadContacted = catchAsync(async (req, res) => {
  const data = await jobService.markLeadContacted(req.params.leadId, req.user.id);

  // Get the job and client info to return contact details
  const { Lead } = await import('../model/lead.model.js');
  const { ClientProfile } = await import('../../client/model/clientProfile.model.js');

  const lead = await Lead.findById(data._id)
    .populate({
      path: 'jobId',
      populate: { path: 'clientId', select: 'name email' }
    });

  // Also fetch client profile to get phone number
  const clientProfile = lead?.jobId?.clientId ?
    await ClientProfile.findOne({
      userId: lead.jobId.clientId._id
    }).select('phone') : null;

  res.send({
    data,
    clientContact: lead?.jobId?.clientId ? {
      name: lead.jobId.clientId.name,
      email: lead.jobId.clientId.email,
      phone: clientProfile?.phone || null
    } : null
  });
});
