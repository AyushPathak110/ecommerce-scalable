import dotenv from "dotenv";

dotenv.config();

interface AppConfig {
  port: number;
  env: string;
  mongoUri: string;
  smtpUser: string | undefined;
  smtpPass: string | undefined;
  smtpHost: string;
  smtpPort: number;
}

function getConfig(): AppConfig {
  return {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
    mongoUri: process.env.MONGO_URI!,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: Number(process.env.SMTP_PORT) || 587,
  };
}

export const config = getConfig();
