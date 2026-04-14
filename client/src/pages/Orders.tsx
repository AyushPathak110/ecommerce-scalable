import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Order, OrderStatus } from "../types";
import { Panel, Tag } from "../components/UI";
import { currency, formatDate } from "../utils/formatters";
import { statuses } from "../constants";

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "ALL">("ALL");
  const [statusOrderId, setStatusOrderId] = useState("");
  const [nextStatus, setNextStatus] = useState<OrderStatus>("SHIPPED");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOrders(status: OrderStatus | "ALL" = orderFilter) {
    setBusy(true);
    try {
      const data = await api.getOrders(status);
      setOrders(data);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [orderFilter]);

  async function updateOrderStatus() {
    if (!statusOrderId) return setError("Select an order to update");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.updateOrderStatus(Number(statusOrderId), nextStatus);
      setMessage("Order status updated.");
      setStatusOrderId("");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Command Center" description="Filter and track order flow.">
           <div className="flex flex-wrap gap-3">
              {statuses.map(s => (
                <button
                  key={s}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all duration-300 ${
                    orderFilter === s 
                    ? "bg-[var(--accent)] text-white shadow-lg" 
                    : "bg-[var(--accent-soft)] hover:bg-[var(--line)]"
                  }`}
                  onClick={() => setOrderFilter(s)}
                >
                  {s}
                </button>
              ))}
           </div>
        </Panel>

        <Panel title="Status Authority" description="Modify order lifecycle state.">
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <input 
                  className="field" 
                  placeholder="Order ID" 
                  value={statusOrderId} 
                  onChange={e => setStatusOrderId(e.target.value)} 
                />
                <select 
                  className="field" 
                  value={nextStatus} 
                  onChange={e => setNextStatus(e.target.value as OrderStatus)}
                >
                  {statuses.filter(s => s !== "ALL").map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <button className="button-primary w-full py-4 font-bold" onClick={updateOrderStatus} disabled={busy}>
               Commit State Change
             </button>
             {message && <p className="text-sm text-green-500 text-center font-bold">{message}</p>}
             {error && <p className="text-sm text-red-500 text-center font-bold">{error}</p>}
          </div>
        </Panel>
      </div>

      <section className="panel-strong rounded-[3rem] overflow-hidden border border-[var(--line)] shadow-2xl">
         <div className="grid grid-cols-5 gap-4 p-6 bg-[var(--accent-soft)]/30 border-b border-[var(--line)] text-xs uppercase tracking-[0.2em] font-black text-[var(--muted)]">
            <span className="col-span-1">Identity</span>
            <span className="col-span-2">Resource Allocation</span>
            <span>Value</span>
            <span>Status</span>
         </div>
         <div className="divide-y divide-[var(--line)] max-h-[60vh] overflow-y-auto">
            {orders.map(order => (
               <div 
                key={order.id} 
                className={`grid grid-cols-5 gap-4 p-6 items-center transition-all cursor-pointer hover:bg-[var(--accent-soft)] ${statusOrderId === String(order.id) ? "bg-[var(--accent-soft)] ring-2 ring-inset ring-[var(--accent)]" : ""}`}
                onClick={() => setStatusOrderId(String(order.id))}
               >
                  <div className="col-span-1">
                    <p className="font-black text-lg">#{order.id}</p>
                    <p className="text-[var(--muted)] text-xs">{formatDate(order.orderDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[var(--muted)] font-mono break-all mb-1">{order.productId}</p>
                    <p className="font-bold">{order.quantity} Units Requested</p>
                  </div>
                  <div>
                    <p className="font-black text-xl">{currency(order.price)}</p>
                  </div>
                  <div>
                    <Tag>{order.status}</Tag>
                  </div>
               </div>
            ))}
            {orders.length === 0 && !busy && (
              <div className="p-20 text-center italic text-[var(--muted)]">No orders found in this sector.</div>
            )}
         </div>
      </section>
    </div>
  );
}
