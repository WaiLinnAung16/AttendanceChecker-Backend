import { config } from "dotenv";
import process from "process";

config({ path: ".env" });
export const { PORT, DB_URL, JWT_SECRET_KEY, JWT_EXPIRES_IN } = process.env;
