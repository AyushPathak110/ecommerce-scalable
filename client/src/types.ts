export type ProductCategory =
  | "mobile"
  | "laptop"
  | "audio"
  | "camera"
  | "accessories";

export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
  score?: number;
};

export type ProductInput = {
  name?: string;
  description?: string;
  price?: number | string;
  category?: ProductCategory;
  stock?: number | string;
};

export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type Order = {
  id: number;
  orderDate: string;
  price: number;
  productId: string;
  quantity: number;
  status: OrderStatus;
};
