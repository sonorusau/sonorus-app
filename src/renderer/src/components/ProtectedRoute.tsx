import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Store the intended destination for redirect after login
    const intendedPath =
      location.pathname !== "/login" ? location.pathname : "/";
    return <Navigate to={redirectTo} state={{ from: intendedPath }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
