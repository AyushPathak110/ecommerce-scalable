import type { Request, Response } from "express";
import { OrderService } from "./order.service.js";
import { Status } from "../../../generated/prisma/enums.js";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  placeOrder = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orderService.placeOrder(req.body);
    res.status(201).json(order);
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query;

    if (typeof status === "string") {
      const orders = await this.orderService.getOrderByStatus(status as Status);
      res.status(200).json(orders);
      return;
    }

    const orders = await this.orderService.getAll();
    res.status(200).json(orders);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orderService.getById(Number(req.params.id));
    res.status(200).json(order);
  };

  updateStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await this.orderService.updateStatus(
      Number(id),
      req.body.status,
    );
    res.status(200).json(order);
  };
}
