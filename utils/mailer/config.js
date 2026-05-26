import dotenv from "dotenv";
dotenv.config();
export const configs = {
  FROM: process.env.FROM,
  PASSWORD: process.env.PASSWORD,
  PORT: 465,
  HOST: process.env.HOST,
  SECURE: process.env.SECURE || false,
};
