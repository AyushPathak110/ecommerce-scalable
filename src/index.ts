import { App } from "./app/App.js";
import { ProductRoute } from "./modules/product/product.route.js";
import { OrderRoute } from "./modules/order/order.route.js";
import { config } from "./config/index.js";

import { connectToMongo } from "./config/mongo.js";
import { startOrderPlacedConsumer } from "./modules/event/event.consumer.js";
import { connectProducer } from "./modules/event/event.producer.js";

async function bootstrap() {
    await connectProducer();
    await startOrderPlacedConsumer();

    await connectToMongo(config.mongoUri);

    const server = new App([new ProductRoute(), new OrderRoute()]);
    server.listen(config.port)
}

bootstrap();