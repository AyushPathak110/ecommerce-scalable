import mongoose, { Schema, Document } from "mongoose";

export interface Product {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
}

export interface ProductDocument extends Product, Document { }

const ProductSchema = new Schema<ProductDocument>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        category: { type: String, required: true, enum: ["mobile", "laptop", "audio", "camera", "accessories"] },
        stock: { type: Number, required: true }
    }, { timestamps: true }
)

const ProductModel = mongoose.model<ProductDocument>("Product", ProductSchema);

export { ProductModel };