import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { UserOutlined, LoginOutlined } from "@ant-design/icons";
import GlassButton from "./GlassButton";

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: AuthGuardProps): JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      // Store the intended destination for redirect after login
      const intendedPath =
        location.pathname !== "/login" ? location.pathname : "/";

      navigate("/login", { state: { from: intendedPath } });
    }
  }, [isAuthenticated, navigate, location]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default AuthGuard;
