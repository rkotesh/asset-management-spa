import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Import route components (dynamically resolved to Client or Server bundle imports)
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AssetsPage,
  AssetDetailPage,
  ProfilePage,
  QueryPage,
  AdminPage,
  NotFoundPage
} from '@/AppRoutes';

// Loader fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-sans">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      <div className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Loading secure vault...</div>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Main Layout Shell */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/assets/:id" element={<AssetDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/query" element={<QueryPage />} />
            
            {/* Admin-only route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      
      {/* Toast Notification Container Overlay */}
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
