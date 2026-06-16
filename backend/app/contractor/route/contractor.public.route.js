import { Router } from 'express';
import { optionalAuth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import * as v from '../validator/contractor.validation.js';
import * as c from '../controller/contractor.controller.js';

const router = Router();

router.get('/', validate(v.searchContractors), c.searchContractors);
// /:slug/reviews must come before /:slug to avoid route collision
router.get('/:slug/reviews', validate(v.getReviews), c.getReviews);
router.get('/:slug', optionalAuth, validate(v.getPublicProfile), c.getPublicProfile);

export default router;
