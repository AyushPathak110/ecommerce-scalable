import { prisma } from "../../lib/prisma.js";
import { HttpException } from "../../errors/HttpException.js";
import type { ProductService } from "../product/product.service.js";
import { publishOrderPlaced } from "../event/event.producer.js";
import type { Status } from "../../../generated/prisma/enums.js";

export interface PlaceOrderInput {
  productId: string;
  quantity: number;
}

export class OrderService {
  constructor(private readonly productService: ProductService) {}

  async placeOrder(data: PlaceOrderInput) {
    const { productId, quantity } = data;

    const product = await this.productService.getByIdOrFail(productId);
    // console.log(product);

    if (product.stock < quantity) {
      throw new HttpException(
        400,
        "Insufficient stock for the requested product.",
      );
    }

    const totalPrice = product.price * quantity;

    const order = await prisma.orders.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        price: totalPrice,
      },
    });

    publishOrderPlaced({
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      price: order.price,
    });

    return order;
  }

  async getAll() {
    return prisma.orders.findMany({
      orderBy: { orderDate: "desc" },
    });
  }

  async getById(id: number) {
    return prisma.orders.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: number, status: Status) {
    const validStatuses = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new HttpException(400, "Invalid order status.");
    }
    return prisma.orders.update({
      where: { id },
      data: { status },
    });
  }

  async getOrderByStatus(status: Status) {
    const validStatuses = ["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new HttpException(400, "Invalid order status.");
    }
    return prisma.orders.findMany({
      where: { status },
    });
  }
}
