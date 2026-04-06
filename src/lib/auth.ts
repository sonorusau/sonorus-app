import { db, users, sessions } from "../database";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  sessionToken?: string;
  error?: string;
}

export interface SessionData {
  userId: number;
  sessionToken: string;
  expiresAt: Date;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function authenticateUser(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  try {
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const isValidPassword = await bcrypt.compare(
      credentials.password,
      user.password_hash,
    );

    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(sessions).values({
      user_id: user.id,
      session_token: sessionToken,
      expires: expiresAt,
      created_at: new Date(),
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      sessionToken,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function validateSession(
  sessionToken: string,
): Promise<AuthResponse> {
  try {
    const sessionRecords = await db
      .select()
      .from(sessions)
      .where(eq(sessions.session_token, sessionToken))
      .limit(1);

    const session = sessionRecords[0];

    if (!session || new Date(session.expires) < new Date()) {
      return { success: false, error: "Invalid or expired session" };
    }

    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user_id))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      sessionToken,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return { success: false, error: "Session validation failed" };
  }
}

export async function logoutUser(sessionToken: string): Promise<boolean> {
  try {
    await db.delete(sessions).where(eq(sessions.session_token, sessionToken));

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser[0]) {
      return { success: false, error: "Email already registered" };
    }

    const passwordHash = await hashPassword(userData.password);
    await db.insert(users).values({
      name: userData.name,
      email: userData.email,
      password_hash: passwordHash,
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Registration failed" };
  }
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
