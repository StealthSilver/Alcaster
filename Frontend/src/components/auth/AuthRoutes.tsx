import { Navigate, Outlet } from "react-router-dom";

import { AuthLoading } from "@/components/auth/AuthLoading";
import { useAuth } from "@/context/AuthContext";
import { AFTER_AUTH_PATH } from "@/lib/paths";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/signin" replace />;

  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (user) return <Navigate to={AFTER_AUTH_PATH} replace />;

  return <Outlet />;
}
