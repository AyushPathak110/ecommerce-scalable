import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Product, Order } from "../types";
import { Metric, Panel } from "../components/UI";
import { currency } from "../utils/formatters";

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBusy(true);
    Promise.all([
      api.getProducts(100),
      api.getOrders("ALL"),
      api.getProductCount(),
    ])
      .then(([productsData, ordersData, countData]) => {
        setProducts(productsData);
        setOrders(ordersData);
        setTotalProducts(countData.total);
      })
      .finally(() => setBusy(false));
  }, []);

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

  if (busy && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-4xl border-2 border-[var(--accent)] border-t-transparent rounded-full w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <Metric label="Total Inventory" value={String(totalProducts)} />
        <Metric label="Recent Orders" value={String(stats.orders)} />
        <Metric label="Assets Value" value={currency(stats.inventoryValue)} />
        <Metric label="Total Revenue" value={currency(stats.revenue)} />
        <Metric label="Restock Alerts" value={String(stats.lowStock)} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Panel title="System Status" description="Backend distribution pipeline status.">
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-soft)]">
                <span className="font-bold text-sm tracking-wide">Product API</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase ring-1 ring-green-500/30">OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-soft)]">
                <span className="font-bold text-sm tracking-wide">Order Stream</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase ring-1 ring-green-500/30">OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-soft)]">
                <span className="font-bold text-sm tracking-wide">Search Engine</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase ring-1 ring-green-500/30">READY</span>
              </div>
           </div>
        </Panel>

        <Panel title="Recent Activity" description="Latest snapshot of system events.">
           <div className="space-y-3">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center gap-4 text-sm border-b border-[var(--line)] pb-3 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg)] flex items-center justify-center text-xs font-bold border border-[var(--line)]">ORD</div>
                  <div className="flex-1">
                    <p className="font-bold">Order #{order.id} placed</p>
                    <p className="text-[var(--muted)] text-xs font-medium">{currency(order.price)}</p>
                  </div>
                  <span className="text-[var(--muted)] text-[10px] font-bold uppercase">{order.status}</span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-[var(--muted)] text-center py-8 italic">No recent orders found.</p>}
           </div>
        </Panel>
      </div>
    </div>
  );
}
