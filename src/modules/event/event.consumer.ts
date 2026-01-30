import { kafka } from "../../config/kafka.js";

const consumer = kafka.consumer({
  groupId: "email-service"
});

export async function startEmailConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "order.placed",
    fromBeginning: true
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      // Mock email sending
      console.log(
        `Email sent for order ${event.orderId} (₹${event.price})`
      );
    }
  });
}
