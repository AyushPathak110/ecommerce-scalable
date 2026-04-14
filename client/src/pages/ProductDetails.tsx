import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Product } from "../types";
import { Panel, Tag } from "../components/UI";
import { currency } from "../utils/formatters";

export function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setBusy(true);
    // Note: The API doesn't have a getProductById, so we'll search for it or fetch all and filter
    // For now, let's use searchProducts with id if possible, or fetch all.
    // Looking at api.ts, I see getProducts(limit).
    api.getProducts(100)
      .then(products => {
        const found = products.find(p => p._id === id);
        if (found) setProduct(found);
        else setError("Product not found");
      })
      .catch(err => setError(err.message))
      .finally(() => setBusy(false));
  }, [id]);

  async function placeOrder() {
    if (!id) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await api.placeOrder({
        productId: id,
        quantity: quantity,
      });
      setMessage("Order placed successfully!");
      setTimeout(() => navigate("/admin/orders"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setBusy(false);
    }
  }

  if (busy && !product) {
    return <div className="text-center py-20 animate-pulse text-2xl">Scanning system...</div>;
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl font-bold text-red-500">{error || "Product not found"}</p>
        <button className="button-primary mt-6" onClick={() => navigate("/admin/catalogue")}>Back to Catalogue</button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 animate-fade-in">
      <div className="space-y-6">
        <div className="aspect-square rounded-[3rem] bg-[var(--panel-strong)] flex flex-col items-center justify-center shadow-inner border border-[var(--line)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)] to-transparent opacity-50"></div>
          <span className="text-8xl font-black text-[var(--accent)] relative z-10 opacity-20 tracking-tighter uppercase">
            {product.category.substring(0, 2)}
          </span>
          <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[var(--panel)]/50 backdrop-blur-sm border border-[var(--line)] text-center">
            <span className="text-xs font-black uppercase tracking-[0.3em]">{product.category}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
           <Tag>Category: {product.category}</Tag>
           <Tag>Available Units: {product.stock}</Tag>
           {product.score && <Tag>Quality Index: {product.score.toFixed(2)}</Tag>}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <section>
          <div className="w-12 h-1 bg-[var(--accent)] mb-6 rounded-full"></div>
          <h2 className="text-5xl font-black mb-4 tracking-tighter leading-[0.9]">{product.name}</h2>
          <p className="text-xl text-[var(--muted)] leading-relaxed font-medium">{product.description}</p>
        </section>

        <section className="mt-auto p-8 rounded-[2.5rem] bg-[var(--panel-strong)] border border-[var(--line)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-4xl font-black pointer-events-none uppercase tracking-tighter">Secure Checkout</div>
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">Market Valuation</span>
            <span className="text-4xl font-black text-[var(--accent)]">{currency(product.price)}</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black text-[var(--muted)] tracking-widest">Quantity Selection</label>
              <div className="flex items-center gap-4">
                <button 
                  className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white transition-all text-xl font-bold flex items-center justify-center"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <span className="w-4 h-0.5 bg-current"></span>
                </button>
                <input 
                  type="number" 
                  className="field text-center w-full max-w-[100px] text-xl font-black"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                />
                <button 
                  className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-white transition-all text-xl font-bold flex items-center justify-center"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <div className="relative w-4 h-4">
                    <span className="absolute inset-0 m-auto w-4 h-0.5 bg-current"></span>
                    <span className="absolute inset-0 m-auto w-0.5 h-4 bg-current"></span>
                  </div>
                </button>
              </div>
            </div>

            <button 
              className="button-primary w-full py-5 text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 group"
              onClick={placeOrder}
              disabled={busy}
            >
              {busy ? "Processing..." : "Confirm Purchase"}
              {!busy && <span className="text-xl transition-transform group-hover:translate-x-1">→</span>}
            </button>
            
            {message && <p className="text-center text-green-500 font-bold animate-bounce text-sm">{message}</p>}
            {error && <p className="text-center text-red-500 font-bold text-sm tracking-tight">{error}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
