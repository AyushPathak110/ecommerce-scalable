import { ProductService } from "./product.service.js";
import type { Request, Response } from "express";
import { HttpException } from "../../errors/HttpException.js";

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  private getStringParam(value: unknown, name: string): string {
    if (typeof value !== "string") {
      throw new HttpException(400, `${name} must be a string`);
    }
    return value;
  }
  
  createMany = async (req: Request, res: Response) => {
    const products = await this.productService.createMany(req.body);
    res.status(201).json({
      inserted: products.length,
    });
  };

  getAll = async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const products = await this.productService.getAll(limit);
    res.status(200).json(products);
  };

  count = async (req: Request, res: Response) => {
    const total = await this.productService.count();
    res.status(200).json({ total });
  };

  getById = async (req: Request, res: Response) => {
    console.log("Product ID from params:", req.params);
    const id = this.getStringParam(req.params.id, "product id");
    const product = await this.productService.getById(id);
    res.status(200).json(product);
  };

  create = async (req: Request, res: Response) => {
    const newProduct = await this.productService.create(req.body);
    res.status(201).json(newProduct);
  };

  updateProduct = async (req: Request, res: Response) => {
    const id = this.getStringParam(req.params.id, "product id");
    console.log("Updating product ID:", id);
    console.log("Update data received:", req.body);
    const updatedProduct = await this.productService.updateProduct(
      id,
      req.body,
    );
    res.status(200).json(updatedProduct);
  };

  deleteProduct = async (req: Request, res: Response) => {
    const id = this.getStringParam(req.params.id, "product id");
    await this.productService.deleteProduct(id);
    res.status(200).json({ message: "Product deleted successfully" });
  };

  search = async (req: Request, res: Response) => {
    const { q, category, minPrice, maxPrice, limit } = req.query;

    const results = await this.productService.search({
      query: q as string,
      category: category as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json(results);
  };

  autocomplete = async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q) {
      res.json([]);
      return;
    }

    const results = await this.productService.autocomplete(q as string);
    res.json(results);
  };
}
