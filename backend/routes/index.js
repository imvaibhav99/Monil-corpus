import { Router } from 'express';
import authRoutes from '../app/auth/route/auth.route.js';
import userRoutes from '../app/user/route/user.route.js';
import categoryRoutes from '../app/category/route/category.route.js';
import categoryAdminRoutes from '../app/category/route/category.admin.route.js';
import cityRoutes from '../app/city/route/city.route.js';
import cityAdminRoutes from '../app/city/route/city.admin.route.js';
import contractorPublicRoutes from '../app/contractor/route/contractor.public.route.js';
import contractorSelfRoutes from '../app/contractor/route/contractor.self.route.js';
import contractorAdminRoutes from '../app/contractor/route/contractor.admin.route.js';
import clientRoutes from '../app/client/route/client.route.js';
import settingsAdminRoutes from '../app/settings/route/settings.admin.route.js';
import jobRoutes from '../app/job/route/job.route.js';

const router = Router();

router.get('/health', (_req, res) => res.send({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin/categories', categoryAdminRoutes);
router.use('/cities', cityRoutes);
router.use('/admin/cities', cityAdminRoutes);
router.use('/contractors', contractorPublicRoutes);
router.use('/contractor', contractorSelfRoutes);
router.use('/admin/contractors', contractorAdminRoutes);
router.use('/client', clientRoutes);
router.use('/admin/settings', settingsAdminRoutes);
router.use('/jobs', jobRoutes);

export default router;
