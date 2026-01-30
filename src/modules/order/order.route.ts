import { OrderController } from "./order.controller.js";
import { OrderService } from "./order.service.js";
import type { Route } from "../../routes/Route.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Router } from "express";
import { ProductService } from "../product/product.service.js";

export class OrderRoute implements Route {
    public path = "/orders";
    public router = Router()
    private controller: OrderController

    constructor() {
        const productService = new ProductService()
        const orderService = new OrderService(productService);
        this.controller = new OrderController(orderService);
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            "/",
            asyncHandler(this.controller.placeOrder)
        );
        this.router.get(
            "/",
            asyncHandler(this.controller.getAll)
        );
        this.router.get(
            "/:id",
            asyncHandler(this.controller.getById)
        )
        this.router.patch(
            "/:id",
            asyncHandler(this.controller.updateStatus)
        )
    }
}