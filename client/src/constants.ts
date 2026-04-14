import type { ProductCategory, OrderStatus, ProductInput } from "./types";

export const categories: ProductCategory[] = [
  "mobile",
  "laptop",
  "audio",
  "camera",
  "accessories",
];

export const statuses: Array<OrderStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const emptyProduct: ProductInput = {
  name: "",
  description: "",
  price: "",
  category: "mobile",
  stock: "",
};
