import type { Order, OrderStatus, Product, ProductInput } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const errorBody = await response.json();
      message = errorBody.message ?? JSON.stringify(errorBody);
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getProducts: (limit?: number) =>
    request<Product[]>(limit ? `/products?limit=${limit}` : "/products"),
  getProductCount: () => request<{ total: number }>("/products/count"),
  searchProducts: (params: URLSearchParams) =>
    request<Product[]>(`/products/search?${params.toString()}`),
  autocompleteProducts: (query: string) =>
    request<Array<Pick<Product, "_id" | "name" | "category" | "price">>>(
      `/products/autocomplete?q=${encodeURIComponent(query)}`,
    ),
  createProduct: (body: ProductInput) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProduct: (id: string, body: Partial<ProductInput>) =>
    request<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    }),
  getOrders: (status?: OrderStatus | "ALL") =>
    request<Order[]>(
      status && status !== "ALL" ? `/orders?status=${status}` : "/orders",
    ),
  placeOrder: (body: { productId: string; quantity: number }) =>
    request<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateOrderStatus: (id: number, status: OrderStatus) =>
    request<Order>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
