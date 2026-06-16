import { Routes, Route, Navigate } from 'react-router-dom';

// Auth pages (existing)
import Landing from '../app/auth/pages/Landing.jsx';
import LoginPage from '../app/auth/pages/LoginPage.jsx';
import SignupPage from '../app/auth/pages/SignupPage.jsx';
import Unauthorized from '../app/auth/pages/Unauthorized.jsx';
import ProtectedRoute from '../app/auth/components/ProtectedRoute.jsx';

// Public contractor discovery (Phase 3)
import ContractorSearch from '../app/contractor/pages/ContractorSearch.jsx';
import ContractorPublicProfile from '../app/contractor/pages/ContractorPublicProfile.jsx';

// Contractor dashboard (Phase 3)
import ContractorHome from '../app/contractor/pages/ContractorHome.jsx';
import ContractorProfileEdit from '../app/contractor/pages/ContractorProfileEdit.jsx';
import ContractorPortfolio from '../app/contractor/pages/ContractorPortfolio.jsx';

// Client dashboard (Phase 3)
import ClientHome from '../app/client/pages/ClientHome.jsx';
import ClientProfileEdit from '../app/client/pages/ClientProfileEdit.jsx';

// Job posting (Phase 5)
import PostJob from '../app/job/pages/PostJob.jsx';
import JobDetail from '../app/job/pages/JobDetail.jsx';
import ContractorLeads from '../app/job/pages/ContractorLeads.jsx';

// Admin pages
import AdminHome from '../app/admin/pages/AdminHome.jsx';
import AdminCategories from '../app/admin/pages/AdminCategories.jsx';
import AdminCities from '../app/admin/pages/AdminCities.jsx';
import AdminSettings from '../app/admin/pages/AdminSettings.jsx';
import AdminContractors from '../app/admin/pages/AdminContractors.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={<Landing />} />

      {/* Public contractor discovery */}
      <Route path="/contractors" element={<ContractorSearch />} />
      <Route path="/contractors/:slug" element={<ContractorPublicProfile />} />

      {/* Client auth pages */}
      <Route path="/client/login" element={<LoginPage role="CLIENT" />} />
      <Route path="/client/signup" element={<SignupPage role="CLIENT" />} />

      {/* Contractor auth pages */}
      <Route path="/contractor/login" element={<LoginPage role="CONTRACTOR" />} />
      <Route path="/contractor/signup" element={<SignupPage role="CONTRACTOR" />} />

      {/* Client protected routes */}
      <Route
        path="/client/home"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <ClientHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/profile/edit"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <ClientProfileEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/jobs/post"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <PostJob />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/jobs/:jobId"
        element={
          <ProtectedRoute allowedRoles={['CLIENT']}>
            <JobDetail />
          </ProtectedRoute>
        }
      />

      {/* Contractor protected routes */}
      <Route
        path="/contractor/home"
        element={
          <ProtectedRoute allowedRoles={['CONTRACTOR']}>
            <ContractorHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractor/profile/edit"
        element={
          <ProtectedRoute allowedRoles={['CONTRACTOR']}>
            <ContractorProfileEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractor/portfolio"
        element={
          <ProtectedRoute allowedRoles={['CONTRACTOR']}>
            <ContractorPortfolio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contractor/leads"
        element={
          <ProtectedRoute allowedRoles={['CONTRACTOR']}>
            <ContractorLeads />
          </ProtectedRoute>
        }
      />

      {/* Admin protected routes */}
      <Route
        path="/admin/home"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cities"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminCities />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contractors"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminContractors />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
