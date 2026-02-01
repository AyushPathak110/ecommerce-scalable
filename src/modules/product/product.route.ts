import { Router } from "express";
import { ProductController } from "./product.controller.js";
import { ProductService } from "./product.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export class ProductRoute {
  public path = "/products";
  public router = Router();
  private controller: ProductController;

  constructor() {
    const service = new ProductService();
    this.controller = new ProductController(service);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/", asyncHandler(this.controller.getAll));
    this.router.get("/search", asyncHandler(this.controller.search));
    this.router.get(
      "/autocomplete",
      asyncHandler(this.controller.autocomplete),
    );
    this.router.get("/:id", asyncHandler(this.controller.getById));
    this.router.post("/", asyncHandler(this.controller.create));
    this.router.put("/:id", asyncHandler(this.controller.updateProduct));
    this.router.delete("/:id", asyncHandler(this.controller.deleteProduct));
    this.router.post("/bulk", asyncHandler(this.controller.createMany));
  }
}
