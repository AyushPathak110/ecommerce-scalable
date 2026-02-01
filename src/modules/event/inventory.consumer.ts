import { kafka } from "../../config/kafka.js";
import { ProductService } from "../product/product.service.js";

const consumer = kafka.consumer({
  groupId: "inventory-service",
});

export async function startInventoryConsumer() {
  const productService = new ProductService();

  await consumer.connect();
  await consumer.subscribe({
    topic: "order.placed",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      try {
        await productService.reduceStock(event.productId, event.quantity);

        const name = await productService.getById(event.productId);

        console.log(
          `Inventory updated for product ${name.name} and remaining quantity is ${name.stock}`,
        );
      } catch (e) {
        console.error("Inventory update failed!", e);
      }
    },
  });
}
