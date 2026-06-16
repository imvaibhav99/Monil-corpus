import { Router } from 'express';
import { auth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import * as v from '../validator/job.validation.js';
import * as c from '../controller/job.controller.js';

const router = Router();

// Contractor routes (must come before /:jobId to avoid conflicts)
router.get('/leads', auth('lead.view'), validate(v.getMyLeads), c.getMyLeads);
router.post('/leads/:leadId/contact', auth('lead.contact'), validate(v.markLeadContacted), c.markLeadContacted);

// Client routes
router.post('/', auth('job.create'), validate(v.createJob), c.createJob);
router.get('/', auth('job.list.own'), validate(v.getMyJobs), c.getMyJobs);
router.get('/:jobId', auth('job.view.own'), validate(v.getMyJob), c.getMyJob);
router.patch('/:jobId', auth('job.edit.own'), validate(v.updateMyJob), c.updateMyJob);
router.post('/:jobId/cancel', auth('job.edit.own'), validate(v.cancelMyJob), c.cancelMyJob);
router.post('/:jobId/assign', auth('job.edit.own'), validate(v.assignContractor), c.assignContractor);

export default router;
