import { prisma } from "../../lib/prisma.js"
import { HttpException } from "../../errors/HttpException.js"
import type { ProductService } from "../product/product.service.js";
import { publishOrderPlaced } from "../event/event.producer.js";

export interface PlaceOrderInput {
  productId: string;
  quantity: number;
}

export class OrderService {

  constructor(private readonly productService: ProductService) {}

  async placeOrder(data: PlaceOrderInput){
    const {productId, quantity} = data;

    const product = await this.productService.getByIdOrFail(productId);

    if(product.stock < quantity){
      throw new HttpException(400, 'Insufficient stock for the requested product.');
    }

    const totalPrice = product.price * quantity;


    const order =await prisma.orders.create({
      data: {
        productId: data.productId,
        quantity: data.quantity,
        price: totalPrice
      }
    });

    publishOrderPlaced({
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      price: order.price
    })

    return order;
  }

  async getAll() {
    return prisma.orders.findMany({
      orderBy: { orderDate: "desc" }
    });
  }
}