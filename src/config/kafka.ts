import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "ecommerce-backend",
  brokers: ["localhost:9092"]
});
