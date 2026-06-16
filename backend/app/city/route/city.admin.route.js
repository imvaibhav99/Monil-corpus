import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/city.validation.js';
import * as c from '../controller/city.controller.js';

const router = Router();

router.post('/', auth('city.manage'), validate(v.createCity), c.createCity);
router.patch('/:cityId', auth('city.manage'), validate(v.updateCity), c.updateCity);

export default router;
