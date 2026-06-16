import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import * as v from '../validator/city.validation.js';
import * as c from '../controller/city.controller.js';

const router = Router();

router.get('/', validate(v.listCities), c.listCities);
router.get('/:slug', validate(v.getCity), c.getCity);

export default router;
