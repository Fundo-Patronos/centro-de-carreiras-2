import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import AuthPage from './pages/auth/AuthPage';
import VerifyEmail from './pages/auth/VerifyEmail';
import PendingApproval from './pages/auth/PendingApproval';
import PendingVerification from './pages/auth/PendingVerification';
import VerifyEmailToken from './pages/auth/VerifyEmailToken';
import ResetPassword from './pages/auth/ResetPassword';
import FirebaseActionHandler from './pages/auth/FirebaseActionHandler';

// Admin pages
import UserApprovals from './pages/admin/UserApprovals';
import SessionFeedback from './pages/admin/SessionFeedback';
import MentorManagement from './pages/admin/MentorManagement';

// Public pages
import FeedbackForm from './pages/public/FeedbackForm';

// Estudante pages
import EstudanteDashboard from './pages/estudante/Dashboard';
import MentorList from './pages/estudante/MentorList';
import MySessions from './pages/estudante/MySessions';

// Mentor pages
import MentorDashboard from './pages/mentor/Dashboard';
import MeuPerfil from './pages/mentor/MeuPerfil';

// Settings pages
import ChangePassword from './pages/settings/ChangePassword';

// Shared pages - MySessions works for both roles
const MentorSessions = MySessions;

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Fully public routes (no Firebase auth needed) */}
          <Route path="/feedback" element={<FeedbackForm />} />

          {/* Firebase auth action handler (handles /__/auth/action URLs) */}
          <Route path="/__/auth/action" element={<FirebaseActionHandler />} />

          {/* Routes that need AuthProvider */}
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AuthenticatedRoutes() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/verify" element={<VerifyEmail />} />
        <Route path="/auth/verify-email" element={<VerifyEmailToken />} />
        <Route path="/auth/action" element={<ResetPassword />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/pending-verification" element={<PendingVerification />} />
        <Route path="/suspended" element={<SuspendedPage />} />

        {/* Admin routes - with sidebar layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="approvals" replace />} />
          <Route path="approvals" element={<UserApprovals />} />
          <Route path="feedback" element={<SessionFeedback />} />
          <Route path="mentors" element={<MentorManagement />} />
        </Route>

        {/* Estudante routes - with sidebar layout */}
        <Route
          path="/estudante"
          element={
            <ProtectedRoute allowedRoles={['estudante']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="sessoes" replace />} />
          <Route path="dashboard" element={<EstudanteDashboard />} />
          <Route path="mentores" element={<MentorList />} />
          <Route path="sessoes" element={<MySessions />} />
          <Route path="vagas" element={<PlaceholderPage title="Vagas" />} />
        </Route>

        {/* Mentor routes - with sidebar layout */}
        <Route
          path="/mentor"
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="sessoes" replace />} />
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="sessoes" element={<MentorSessions />} />
          <Route path="disponibilidade" element={<PlaceholderPage title="Disponibilidade" />} />
          <Route path="perfil" element={<MeuPerfil />} />
        </Route>

        {/* Settings routes - with sidebar layout (both roles) */}
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="senha" element={<ChangePassword />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// Temporary placeholder for pages not yet implemented
function PlaceholderPage({ title }) {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">Esta página está em construção.</p>
    </div>
  );
}

// Suspended account page
function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold">
          <span className="text-gradient">Centro de Carreiras</span>
        </h1>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Conta Suspensa</h2>
          <p className="mt-4 text-gray-600">
            Sua conta foi suspensa. Entre em contato com o suporte para mais informacoes.
          </p>
          <p className="mt-6 text-center text-xs text-gray-500">
            Fundo Patronos da Unicamp
          </p>
        </div>
      </div>
    </div>
  );
}
