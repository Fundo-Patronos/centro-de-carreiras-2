import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import AuthPage from './pages/auth/AuthPage';
import VerifyEmail from './pages/auth/VerifyEmail';

// Estudante pages
import EstudanteDashboard from './pages/estudante/Dashboard';
import MentorList from './pages/estudante/MentorList';

// Mentor pages
import MentorDashboard from './pages/mentor/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />

          {/* Estudante routes - with sidebar layout */}
          <Route
            path="/estudante"
            element={
              <ProtectedRoute allowedRoles={['estudante']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EstudanteDashboard />} />
            <Route path="mentores" element={<MentorList />} />
            <Route path="sessoes" element={<PlaceholderPage title="Minhas Sessões" />} />
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
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="sessoes" element={<PlaceholderPage title="Minhas Sessões" />} />
            <Route path="disponibilidade" element={<PlaceholderPage title="Disponibilidade" />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
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
