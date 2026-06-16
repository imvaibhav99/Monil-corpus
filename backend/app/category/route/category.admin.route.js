import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/category.validation.js';
import * as c from '../controller/category.controller.js';

const router = Router();

router.post('/', auth('category.manage'), validate(v.createCategory), c.createCategory);
router.patch('/:categoryId', auth('category.manage'), validate(v.updateCategory), c.updateCategory);

export default router;
