import dotenv from "dotenv";
import path from "node:path";

// Tests run outside Next.js, so .env.local isn't loaded automatically —
// load it the same way the app would.
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
