import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // Redirect to login page and save the current location to redirect back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // User is authenticated but is not an admin, redirect to dashboard
    return <Navigate to="/assets" replace />;
  }

  return children;
};

export default ProtectedRoute;
