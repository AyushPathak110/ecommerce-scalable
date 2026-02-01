import { HttpException } from "../../errors/HttpException.js";
import {
  ProductModel,
  type Product,
  type ProductDocument,
} from "./product.model.js";
import mongoose from "mongoose";

type paramsCheck = {
  query?: string;
  category?: string;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
};

export class ProductService {
  private validateId(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException(400, "Invalid product id");
    }
  }

   async getByIdOrFail(id: string): Promise<ProductDocument> {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new HttpException(404, "Product not found");
    }
    return product;
  }

  async createMany(products: Product[]) {
    if (!products || products.length === 0) {
      throw new HttpException(400, "Products array is empty");
    }

    return ProductModel.insertMany(products);
  }

  async create(data: Product): Promise<Product> {
    return ProductModel.create(data).then((doc) => doc.toObject());
  }

  async getAll(): Promise<Product[]> {
    return ProductModel.find().lean<Product[]>();
  }

  async getById(id: string): Promise<Product> {
    this.validateId(id);
    // console.log(typeof id);

    const product = await ProductModel.findById(id).lean<Product>();

    if (!product) {
      throw new HttpException(404, "Product not found");
    }

    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    this.validateId(id);
    // console.log(typeof id);

    const product = await ProductModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean<Product>();

    if (!product) {
      throw new HttpException(404, "Product not found");
    }

    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    this.validateId(id);

    const product = await ProductModel.findByIdAndDelete(id);

    if (!product) {
      throw new HttpException(404, "Product not found");
    }

    return true;
  }

  async search(params: paramsCheck) {
    const { query, category, minPrice, maxPrice } = params;

    const must = [];
    const filter = [];
    const should = []; // For boosting relevance

    if (query) {
      must.push({
        text: {
          query,
          path: ["name", "description"], // Search in both fields
          fuzzy: {
            maxEdits: 2,
            prefixLength: 2, // First character must match exactly
          },
          score: { boost: { value: 2 } },
        },
      });

      // Boost exact matches in name
      should.push({
        text: {
          query,
          path: "name",
          score: { boost: { value: 3 } },
        },
      });
    }

    if (category) {
      filter.push({
        text: {
          query: category,
          path: "category",
        },
      });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.push({
        range: {
          path: "price",
          gte: minPrice ?? 0,
          lte: maxPrice ?? Number.MAX_SAFE_INTEGER, // Better than hardcoded
        },
      });
    }

    const searchStage: any = {
      index: "products_search",
      compound: {},
    };

    // Only add clauses if they have content
    if (must.length) searchStage.compound.must = must;
    if (should.length) searchStage.compound.should = should;
    if (filter.length) searchStage.compound.filter = filter;

    // If no search criteria, return all documents sorted by relevance
    if (!must.length && !should.length && !filter.length) {
      return ProductModel.find().limit(20).lean();
    }

    return ProductModel.aggregate([
      {
        $search: searchStage,
      },
      {
        $limit: 5,
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          category: 1,
          stock: 1,
          score: { $meta: "searchScore" },
        },
      },
    ]);
  }

  async autocomplete(query: string) {
    if (!query || query.trim().length < 2) {
      return []; // Don't search for single characters
    }

    return ProductModel.aggregate([
      {
        $search: {
          index: "products_search",
          autocomplete: {
            query: query.trim(),
            path: "name",
            fuzzy: {
              maxEdits: 2,
              prefixLength: 2,
            },
          },
        },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          score: { $meta: "searchScore" },
        },
      },
    ]);
  }

  async reduceStock(productId: string, quantity: number): Promise<void> {
    this.validateId(productId);

    const product = await this.getByIdOrFail(productId);

    if (quantity < 0 && product.stock < Math.abs(quantity)) {
      throw new HttpException(400, "Insufficient stock");
    }

    product.stock -= quantity;

    await product.save();
  }
}
