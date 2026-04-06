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
      console.log("Validation failed for ID:", id);
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

  async getAll(limit?: number): Promise<Product[]> {
    return ProductModel.find()
      .limit(limit || 10)
      .lean<Product[]>();
  }

  async count(): Promise<number> {
    return ProductModel.countDocuments();
  }

  async getById(id: string): Promise<Product> {
    this.validateId(id);

    // 1. Try to find by standard ObjectId (this is what Mongoose does by default)
    let product = await ProductModel.findById(id).lean<Product>();

    // 2. If not found, it might be stored as a String in Atlas.
    // We use the raw collection access to bypass Mongoose's automatic casting to ObjectId.
    if (!product) {
      product = (await ProductModel.collection.findOne({
        _id: id as any,
      })) as unknown as Product;
    }

    if (!product) {
      throw new HttpException(404, `Product not found with ID: ${id}`);
    }

    return product;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    this.validateId(id);

    // Filter out empty strings from the update data to avoid validation errors on required fields
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== ""),
    );

    // 1. Regular update (uses Mongoose type casting to ObjectId)
    let product = await ProductModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean<Product>();

    // 2. If not found, try string fallback
    if (!product) {
      await ProductModel.collection.updateOne(
        { _id: id as any },
        { $set: updateData },
      );
      product = (await ProductModel.collection.findOne({
        _id: id as any,
      })) as unknown as Product;
    }

    if (!product) {
      throw new HttpException(404, "Product not found");
    }

    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    this.validateId(id);

    // 1. Regular delete (uses Mongoose type casting to ObjectId)
    let product = await ProductModel.findByIdAndDelete(id);

    // 2. String fallback delete
    if (!product) {
      const result = await ProductModel.collection.deleteOne({
        _id: id as any,
      });
      if (result.deletedCount === 0) {
        throw new HttpException(404, "Product not found");
      }
      return true;
    }

    return true;
  }

  async search(params: paramsCheck) {
    const { query, category, minPrice, maxPrice } = params;

    const must = [];
    const filter = [];

    if (query) {
      must.push({
        text: {
          query,
          path: ["name", "description"],
          fuzzy: {
            maxEdits: 2,
            prefixLength: 3,
          },
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
      index: "product",
      compound: {},
    };

    // Only add clauses if they have content
    if (must.length) searchStage.compound.must = must;
    if (filter.length) searchStage.compound.filter = filter;

    // If no search criteria, return all documents sorted by relevance
    if (!must.length && !filter.length) {
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
          index: "product",
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
          name: 1
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
