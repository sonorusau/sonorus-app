import express, { Request, Response } from "express";
import cors from "cors";
import {
  authenticateUser,
  validateSession,
  logoutUser,
  registerUser,
} from "../lib/auth";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

interface LoginRequestBody {
  email: string;
  password: string;
}

interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
}

interface SessionRequestBody {
  sessionToken: string;
}

app.post(
  "/api/auth/login",
  async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const result = await authenticateUser({ email, password });

      if (result.success && result.user && result.sessionToken) {
        return res.json({
          success: true,
          user: result.user,
          sessionToken: result.sessionToken,
        });
      }

      return res.status(401).json({
        success: false,
        error: result.error || "Authentication failed",
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post(
  "/api/auth/register",
  async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      const result = await registerUser({ name, email, password });
      return result.success
        ? res.json({ success: true })
        : res.status(400).json({ error: result.error });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post(
  "/api/auth/validate",
  async (req: Request<{}, {}, SessionRequestBody>, res: Response) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: "Session token is required" });
      }

      const result = await validateSession(sessionToken);

      if (result.success && result.user) {
        return res.json({
          success: true,
          user: result.user,
          sessionToken: result.sessionToken,
        });
      }

      return res.status(401).json({
        success: false,
        error: result.error || "Invalid session",
      });
    } catch (error) {
      console.error("Session validation error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

app.post(
  "/api/auth/logout",
  async (req: Request<{}, {}, SessionRequestBody>, res: Response) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: "Session token is required" });
      }

      const success = await logoutUser(sessionToken);

      return res.json({ success });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

export function startAuthServer(): void {
  app.listen(PORT, () => {
    console.log(`Auth server running on http://localhost:${PORT}`);
  });
}

export { app };
