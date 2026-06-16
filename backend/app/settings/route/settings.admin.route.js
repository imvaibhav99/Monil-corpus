import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/settings.validation.js';
import * as c from '../controller/settings.controller.js';

const router = Router();

router.get('/', auth('settings.edit'), c.getSettings);
router.patch('/', auth('settings.edit'), validate(v.updateSettings), c.updateSettings);

export default router;
