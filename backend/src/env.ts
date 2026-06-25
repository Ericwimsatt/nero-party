import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const env = {
  PORT: process.env.PORT || 3000,
  // I have no idea where this came from, but it seems to work
  JAMENDO_CLIENT_ID: process.env.JAMENDO_CLIENT_ID || "355d5f96",
};
