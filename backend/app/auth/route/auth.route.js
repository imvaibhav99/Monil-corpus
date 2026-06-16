import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import { auth } from '../../../middleware/auth.js';
import * as v from '../validator/auth.validation.js';
import * as c from '../controller/auth.controller.js';

const router = Router();

router.post('/register', validate(v.register), c.register);
router.post('/login', validate(v.login), c.login);
router.post('/logout', validate(v.logout), c.logout);
router.post('/refresh-tokens', validate(v.refreshTokens), c.refreshTokens);
router.post('/forgot-password', validate(v.forgotPassword), c.forgotPassword);
router.post('/reset-password', validate(v.resetPassword), c.resetPassword);
router.post('/send-verification-email', auth(), c.sendVerificationEmail);
router.post('/verify-email', validate(v.verifyEmail), c.verifyEmail);

export default router;
