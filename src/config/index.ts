import dotenv from "dotenv";

dotenv.config();

interface AppConfig {
  port: number;
  env: string;
  mongoUri: string;
}

function getConfig(): AppConfig {
  return {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI!
  };
}

export const config = getConfig();
