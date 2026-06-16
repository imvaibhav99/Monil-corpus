import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import * as v from '../validator/category.validation.js';
import * as c from '../controller/category.controller.js';

const router = Router();

router.get('/', validate(v.listCategories), c.listCategories);
router.get('/:slug', validate(v.getCategory), c.getCategory);

export default router;
