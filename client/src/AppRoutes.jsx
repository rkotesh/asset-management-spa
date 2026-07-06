import { lazy } from 'react';

export const LandingPage = lazy(() => import('./pages/LandingPage'));
export const LoginPage = lazy(() => import('./pages/LoginPage'));
export const RegisterPage = lazy(() => import('./pages/RegisterPage'));
export const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
export const AssetsPage = lazy(() => import('./pages/AssetsPage'));
export const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
export const ProfilePage = lazy(() => import('./pages/ProfilePage'));
export const QueryPage = lazy(() => import('./pages/QueryPage'));
export const AdminPage = lazy(() => import('./pages/AdminPage'));
export const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
