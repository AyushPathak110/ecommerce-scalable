import { type ReactNode, useEffect, useState } from "react";
import { api } from "./lib/api";
import type {
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ProductInput,
} from "./types";

const categories: ProductCategory[] = [
  "mobile",
  "laptop",
  "audio",
  "camera",
  "accessories",
];

const statuses: Array<OrderStatus | "ALL"> = [
  "ALL",
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const emptyProduct: ProductInput = {
  name: "",
  description: "",
  price: "",
  category: "mobile",
  stock: "",
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState<ProductInput>(emptyProduct);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderProductId, setOrderProductId] = useState("");
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "ALL">("ALL");
  const [statusOrderId, setStatusOrderId] = useState("");
  const [nextStatus, setNextStatus] = useState<OrderStatus>("SHIPPED");
  const [totalProducts, setTotalProducts] = useState(0);
  const [limit, setLimit] = useState("10");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Backend dashboard ready.");
  const [error, setError] = useState("");

  async function loadProducts(currentLimit: number = Number(limit)) {
    const data = await api.getProducts(currentLimit);
    setProducts(data);
  }

  async function loadOrders(status: OrderStatus | "ALL" = orderFilter) {
    const data = await api.getOrders(status);
    setOrders(data);
  }

  async function loadCount() {
    const { total } = await api.getProductCount();
    setTotalProducts(total);
  }

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("client-theme");
    const resolvedTheme = storedTheme === "dark" ? "dark" : "light";
    setTheme(resolvedTheme);
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, []);

  useEffect(() => {
    setBusy(true);
    Promise.all([loadProducts(), loadOrders(), loadCount()])
      .then(() => {
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    if (searchText.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      api.autocompleteProducts(searchText)
        .then((data) => setSuggestions(data as Product[]))
        .catch(() => setSuggestions([]));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchText]);

  const stats = {
    products: products.length,
    orders: orders.length,
    inventoryValue: products.reduce(
      (sum, product) => sum + product.price * product.stock,
      0,
    ),
    revenue: orders.reduce((sum, order) => sum + order.price, 0),
    lowStock: products.filter((product) => product.stock <= 5).length,
  };

  function updateTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    window.localStorage.setItem("client-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  function handleProductFormChange<K extends keyof ProductInput>(
    key: K,
    value: ProductInput[K],
  ) {
    setProductForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function withFeedback(task: () => Promise<void>, successMessage: string) {
    setBusy(true);
    setError("");

    try {
      await task();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function searchProducts() {
    await withFeedback(async () => {
      const params = new URLSearchParams();

      if (searchText.trim()) params.set("q", searchText.trim());
      if (searchCategory) params.set("category", searchCategory);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);

      const data = params.toString()
        ? await api.searchProducts(params)
        : await api.getProducts(Number(limit));

      setProducts(data);
    }, "Product results refreshed.");
  }

  async function resetSearch() {
    setSearchText("");
    setSearchCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSuggestions([]);

    await withFeedback(async () => {
      await loadProducts();
    }, "Product list reset.");
  }

  async function createProduct() {
    await withFeedback(async () => {
      await api.createProduct(productForm);
      setProductForm(emptyProduct);
      await loadProducts();
    }, "Product created.");
  }

  async function updateProduct() {
  const data: Partial<ProductInput> = {};
  
  if (productForm.name) data.name = productForm.name;
  if (productForm.description) data.description = productForm.description;
  if (productForm.category) data.category = productForm.category;
  
  // Only convert and send price/stock if the user actually typed something
  if (productForm.price !== "" && productForm.price !== undefined) {
    data.price = Number(productForm.price);
  }
  if (productForm.stock !== "" && productForm.stock !== undefined) {
    data.stock = Number(productForm.stock);
  }

  await withFeedback(async () => {
    await api.updateProduct(selectedProductId, data as any);
    setProductForm(emptyProduct); // Reset form after successful update
    setSelectedProductId("");
    await loadProducts();
  }, "Product updated partiallly.");
}

  async function deleteProduct() {
    await withFeedback(async () => {
      await api.deleteProduct(selectedProductId);
      setSelectedProductId("");
      await loadProducts();
    }, "Product deleted.");
  }

  async function placeOrder() {
    await withFeedback(async () => {
      await api.placeOrder({
        productId: orderProductId,
        quantity: orderQuantity,
      });
      setOrderProductId("");
      setOrderQuantity(1);
      await Promise.all([loadOrders(), loadProducts()]);
    }, "Order placed.");
  }

  async function refreshOrders(next: OrderStatus | "ALL") {
    setOrderFilter(next);
    await withFeedback(async () => {
      await loadOrders(next);
    }, "Orders refreshed.");
  }

  async function updateOrderStatus() {
    await withFeedback(async () => {
      await api.updateOrderStatus(Number(statusOrderId), nextStatus);
      setStatusOrderId("");
      await loadOrders();
    }, "Order status updated.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="panel-strong rounded-[2rem] p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold sm:text-3xl">
                Scalable Pipeline for Ecommerce Event Distribution
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                Products, search, autocomplete, order placement, and status
                management in one React + Tailwind client.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto">
            <button
              className="button-secondary"
              onClick={() => updateTheme(theme === "light" ? "dark" : "light")}
              type="button"
            >
              {theme === "light" ? "Dark theme" : "Light theme"}
            </button>
            <button
              className="button-primary"
              onClick={() =>
                withFeedback(async () => {
                  await Promise.all([
                    loadProducts(),
                    loadOrders(orderFilter),
                    loadCount(),
                  ]);
                }, "Data synced with backend.")
              }
              type="button"
            >
              {busy ? "Working..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total Products" value={String(totalProducts)} />
          <Metric label="Visible Orders" value={String(stats.orders)} />
          <Metric label="Inventory Value" value={currency(stats.inventoryValue)} />
          <Metric label="Revenue Snapshot" value={currency(stats.revenue)} />
          <Metric label="Low Stock" value={String(stats.lowStock)} />
        </div>

        <div className="mt-6 flex flex-col gap-2 text-sm">
          <span className="text-[var(--muted)]">{message}</span>
          {error ? <span className="text-red-500">{error}</span> : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel
            title="Search products"
            description="Uses /products/search and /products/autocomplete."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <input
                  className="field"
                  placeholder="Search by name or description"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
                {suggestions.length > 0 ? (
                  <div className="panel rounded-2xl p-2">
                    {suggestions.map((item) => (
                      <button
                        key={item._id ?? item.name}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--accent-soft)]"
                        onClick={() => {
                          setSearchText(item.name);
                          setSuggestions([]);
                        }}
                        type="button"
                      >
                        <span>{item.name}</span>
                        <span className="text-[var(--muted)]">{item.category}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <select
                className="field"
                value={searchCategory}
                onChange={(event) => setSearchCategory(event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <input
                className="field"
                min="0"
                placeholder="Min price"
                type="number"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />

              <input
                className="field"
                min="0"
                placeholder="Max price"
                type="number"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />

              <input
                className="field"
                min="1"
                placeholder="Limit"
                type="number"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className="button-primary" onClick={searchProducts} type="button">
                Search
              </button>
              <button className="button-secondary" onClick={resetSearch} type="button">
                Reset
              </button>
            </div>
          </Panel>

          <Panel
            title="Product catalog"
            description="Live view of products returned by the backend."
          >
            <div className="max-h-[40rem] overflow-y-auto pr-2">
              <div className="grid gap-4 lg:grid-cols-2">
                {products.map((product) => (
                  <article
                    key={product._id}
                    className="rounded-[1.5rem] border border-[var(--line)] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium">{product.name}</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {product.description}
                        </p>
                      </div>
                      <button
                        className="button-secondary px-3 py-2 text-xs"
                        onClick={() => {
                          setSelectedProductId(product._id);
                          setOrderProductId(product._id);
                          setProductForm({
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            category: product.category,
                            stock: product.stock,
                          });
                          setMessage(`Loaded ${product.name} into the editor.`);
                        }}
                        type="button"
                      >
                        Use
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                      <Tag>{product.category}</Tag>
                      <Tag>Stock {product.stock}</Tag>
                      {typeof product.score === "number" ? (
                        <Tag>Score {product.score.toFixed(2)}</Tag>
                      ) : null}
                    </div>

                    <div className="mt-6 flex items-end justify-between">
                      <p className="text-2xl font-semibold">
                        {currency(product.price)}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{product._id}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Product editor"
            description="Create, update, or delete products."
          >
            <div className="space-y-4">
              <input
                className="field"
                placeholder="Product id for update/delete"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
              />
              <input
                className="field"
                placeholder="Name"
                value={productForm.name}
                onChange={(event) =>
                  handleProductFormChange("name", event.target.value)
                }
              />
              <textarea
                className="field min-h-28 resize-y"
                placeholder="Description"
                value={productForm.description}
                onChange={(event) =>
                  handleProductFormChange("description", event.target.value)
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="field"
                  placeholder="Price"
                  type="text"
                  value={productForm.price}
                  onChange={(event) =>
                    handleProductFormChange("price", event.target.value)
                  }
                />
                <input
                  className="field"
                  placeholder="Stock"
                  type="text"
                  value={productForm.stock}
                  onChange={(event) =>
                    handleProductFormChange("stock", event.target.value)
                  }
                />
              </div>
              <select
                className="field"
                value={productForm.category}
                onChange={(event) =>
                  handleProductFormChange(
                    "category",
                    event.target.value as ProductCategory,
                  )
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button className="button-primary" onClick={createProduct} type="button">
                Create
              </button>
              <button className="button-primary" onClick={updateProduct} type="button">
                Update
              </button>
              <button className="button-primary" onClick={deleteProduct} type="button">
                Delete
              </button>
            </div>
          </Panel>

          <Panel
            title="Place order"
            description="Creates a new order from a product id and quantity."
          >
            <div className="space-y-4">
              <input
                className="field"
                placeholder="Product id"
                value={orderProductId}
                onChange={(event) => setOrderProductId(event.target.value)}
              />
              <input
                className="field"
                min="1"
                type="number"
                value={orderQuantity}
                onChange={(event) => setOrderQuantity(Number(event.target.value))}
              />
              <button className="button-primary w-full" onClick={placeOrder} type="button">
                Submit order
              </button>
            </div>
          </Panel>

          <Panel
            title="Order controls"
            description="Filter orders and update their status."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="field"
                value={orderFilter}
                onChange={(event) =>
                  refreshOrders(event.target.value as OrderStatus | "ALL")
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Order id"
                value={statusOrderId}
                onChange={(event) => setStatusOrderId(event.target.value)}
              />
              <select
                className="field"
                value={nextStatus}
                onChange={(event) =>
                  setNextStatus(event.target.value as OrderStatus)
                }
              >
                {statuses
                  .filter((status): status is OrderStatus => status !== "ALL")
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
              <button
                className="button-primary"
                onClick={updateOrderStatus}
                type="button"
              >
                Update status
              </button>
            </div>
          </Panel>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Orders</h2>
            <p className="text-sm text-[var(--muted)]">
              Filtered by {orderFilter.toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
          <div className="hidden grid-cols-[0.6fr_1.2fr_0.8fr_0.8fr_1fr] gap-4 border-b border-[var(--line)] px-5 py-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)] md:grid">
            <span>Order</span>
            <span>Product</span>
            <span>Quantity</span>
            <span>Amount</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[0.6fr_1.2fr_0.8fr_0.8fr_1fr] md:items-center"
              >
                <div>
                  <p className="text-sm font-medium">#{order.id}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDate(order.orderDate)}
                  </p>
                </div>
                <p className="text-sm break-all text-[var(--muted)]">{order.productId}</p>
                <p className="text-sm">{order.quantity}</p>
                <p className="text-sm">{currency(order.price)}</p>
                <div>
                  <Tag>{order.status}</Tag>
                </div>
              </div>
            ))}
            {orders.length === 0 ? (
              <div className="px-5 py-8 text-sm text-[var(--muted)]">
                No orders returned by the selected filter.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function Panel(props: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{props.title}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{props.description}</p>
      </div>
      {props.children}
    </section>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {props.label}
      </p>
      <p className="mt-3 text-2xl font-semibold">{props.value}</p>
    </div>
  );
}

function Tag(props: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--line)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium">
      {props.children}
    </span>
  );
}
