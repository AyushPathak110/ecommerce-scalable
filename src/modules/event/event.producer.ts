import { kafka } from "../../config/kafka.js";

const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
}

export async function publishOrderPlaced(event: {
  orderId: number;
  productId: string;
  quantity: number;
  price: number;
}) {
  await producer.send({
    topic: "order.placed",
    messages: [
      {
        key: String(event.orderId),
        value: JSON.stringify(event)
      }
    ]
  });
}
