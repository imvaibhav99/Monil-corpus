import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/contractor.validation.js';
import * as c from '../controller/contractor.controller.js';

const router = Router();

router.get('/profile', auth('contractor.profile.edit.own'), c.getOwnProfile);
router.patch('/profile', auth('contractor.profile.edit.own'), validate(v.updateOwnProfile), c.updateOwnProfile);
router.post('/portfolio', auth('contractor.profile.edit.own'), validate(v.addPortfolioItem), c.addPortfolioItem);
router.delete('/portfolio/:itemId', auth('contractor.profile.edit.own'), validate(v.removePortfolioItem), c.removePortfolioItem);
router.post('/availability', auth('contractor.profile.edit.own'), validate(v.toggleAvailability), c.toggleAvailability);

export default router;
