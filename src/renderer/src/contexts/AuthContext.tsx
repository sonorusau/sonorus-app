import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!sessionToken;

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await window.api.authGetSession();
        if (token) {
          setSessionToken(token);
          // Validate session and get user data
          const response = await window.api.authValidate(token);
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            // Invalid session, clear it
            await window.api.authClearSession();
            setSessionToken(null);
          }
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await window.api.authLogin(email, password);

      if (response.success && response.user && response.sessionToken) {
        setUser(response.user);
        setSessionToken(response.sessionToken);
        await window.api.authSetSession(response.sessionToken);
        setLoading(false);
        return true;
      }

      setError(response.error || "Login failed");
      setLoading(false);
      return false;
    } catch (err) {
      setError("Login failed. Please try again.");
      setLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      if (sessionToken) {
        await window.api.authLogout(sessionToken);
      }
      await window.api.authClearSession();
      setUser(null);
      setSessionToken(null);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("Logout error:", err);
      setError("Logout failed");
      setLoading(false);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await window.api.authRegister(name, email, password);

      if (response.success) {
        setError(null);
        setLoading(false);
        return true;
      }

      setError(response.error ?? "Registration failed");
      setLoading(false);
      return false;
    } catch (err) {
      setError("Registration failed. Please try again.");
      setLoading(false);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated,
        login,
        signup,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
