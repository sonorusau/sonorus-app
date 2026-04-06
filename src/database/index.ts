import { drizzle } from "drizzle-orm/postgres-js";
import { users, sessions, accounts } from "./schema";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://sonorus:sonorus@localhost:5432/sonorus";

export const db = drizzle(connectionString, {
  schema: { users, sessions, accounts },
});

export { users, sessions, accounts };
export type { User, Session, Account } from "./schema";
