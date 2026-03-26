import { Navigate } from "react-router";
import { api } from "../api";

interface ParentProtectedRouteProps {
  children: React.ReactNode;
}

export function ParentProtectedRoute({ children }: ParentProtectedRouteProps) {
  const isAuthenticated = api.isParentAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/parent/login" replace />;
  }

  return <>{children}</>;
}
