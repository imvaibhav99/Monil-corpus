import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/client.validation.js';
import * as c from '../controller/client.controller.js';

const router = Router();

router.get('/profile', auth(), c.getOwnProfile);
router.patch('/profile', auth(), validate(v.updateOwnProfile), c.updateOwnProfile);

export default router;
