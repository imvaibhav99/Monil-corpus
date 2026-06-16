import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/user.validation.js';
import * as c from '../controller/user.controller.js';

const router = Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(v.createUser), c.createUser)
  .get(auth('getUsers'), validate(v.getUsers), c.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(v.getUser), c.getUser)
  .patch(auth('manageUsers'), validate(v.updateUser), c.updateUser)
  .delete(auth('deleteUsers'), validate(v.deleteUser), c.deleteUser);

export default router;
