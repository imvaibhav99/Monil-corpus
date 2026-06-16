import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/contractor.validation.js';
import * as c from '../controller/contractor.controller.js';

const router = Router();

router.get('/', auth('getUsers'), validate(v.listContractorsAdmin), c.listContractorsAdmin);
router.patch('/:userId', auth('contractor.profile.edit.any'), validate(v.adminUpdateContractor), c.adminUpdateProfile);

export default router;
