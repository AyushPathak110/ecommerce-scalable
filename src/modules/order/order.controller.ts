import type { Request, Response } from 'express';
import { OrderService } from './order.service.js';

export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    placeOrder = async (req: Request, res: Response): Promise<void> => {
        const order = await this.orderService.placeOrder(req.body);
        res.status(201).json(order);
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        const orders = await this.orderService.getAll();
        res.status(200).json(orders);
    }
}