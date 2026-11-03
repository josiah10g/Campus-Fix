// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import IssuesPage from './pages/IssuesPage';
import ReportIssuePage from './pages/ReportIssuePage';
import EditIssuePage from './pages/EditIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import UsersPage from './pages/UsersPage';
import PublicHomePage from './pages/PublicHomePage';
import HowItWorksPage from './pages/HowItWorksPage';
import LatestIssuesPage from './pages/LatestIssuesPage';
import { Loader2 } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  if (!user) {
    // Preserve next path for newcomers
    const nextPath = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white border border-line rounded-card text-center">
        <h2 className="text-base font-bold text-statusOpen">Permission Denied</h2>
        <p className="text-xs text-gray-600 mt-2">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return children;
};

// Public Route (redirects to /issues if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/issues" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-page">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<PublicHomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/latest-issues" element={<LatestIssuesPage />} />

              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* Protected App Routes */}
              <Route
                path="/issues"
                element={
                  <ProtectedRoute>
                    <IssuesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues/:id"
                element={
                  <ProtectedRoute>
                    <IssueDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditIssuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportIssuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
