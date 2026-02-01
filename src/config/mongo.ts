import mongoose from "mongoose";
import { HttpException } from "../errors/HttpException.js";

export async function connectToMongo(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully.");
  } catch (error) {
    throw new HttpException(500, `Failed to connect to MongoDB: ${error}`);
  }
}
