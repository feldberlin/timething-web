import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.tsx';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();
  return session ? children : <Navigate to="/" replace state={{ path: location.pathname }} />;
}
