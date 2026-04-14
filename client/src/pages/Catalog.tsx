import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Product } from "../types";
import { Panel, Tag } from "../components/UI";
import { currency } from "../utils/formatters";
import { categories } from "../constants";

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [limit, setLimit] = useState("12");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);

  const isSelection = useRef(false);

  async function loadProducts() {
    setBusy(true);
    try {
      const data = await api.getProducts(Number(limit));
      setProducts(data);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (isSelection.current) {
      isSelection.current = false;
      setSuggestions([]);
      return;
    }

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

  async function searchProducts() {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.set("q", searchText.trim());
      if (searchCategory) params.set("category", searchCategory);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("limit", limit);

      const data = await api.searchProducts(params);
      setProducts(data);
    } finally {
      setBusy(false);
    }
  }

  async function resetSearch() {
    setSearchText("");
    setSearchCategory("");
    setMinPrice("");
    setMaxPrice("");
    setLimit("12");
    loadProducts();
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative z-50">
        <Panel title="Discovery Engine" description="Advanced filtering for the product ecosystem.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
          <div className="relative col-span-2">
            <label className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2 block font-bold">Search</label>
            <input
              className="field"
              placeholder="Search by name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
             {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 panel-strong rounded-2xl p-2 z-[999] border border-[var(--line)] shadow-2xl">
                  {suggestions.map((item) => (
                    <button
                      key={item._id}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-[var(--accent-soft)]"
                      onClick={() => {
                        isSelection.current = true;
                        setSearchText(item.name);
                        setSuggestions([]);
                      }}
                    >
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="text-[10px] font-black uppercase text-[var(--muted)] tracking-widest">{item.category}</span>
                    </button>
                  ))}
                </div>
              )}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2 block font-bold">Category</label>
            <select
              className="field"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2 block font-bold">Price Bounds</label>
            <div className="grid grid-cols-2 gap-2">
              <input className="field" placeholder="MIN" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <input className="field" placeholder="MAX" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="button-primary flex-1 font-bold uppercase tracking-wider text-xs" onClick={searchProducts} disabled={busy}>
              {busy ? "..." : "Apply"}
            </button>
            <button className="button-secondary font-bold" onClick={resetSearch}>
              <span className="inline-block transition-transform active:rotate-180">↻</span>
            </button>
          </div>
        </div>
      </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product._id}
            to={`/admin/catalogue/${product._id}`}
            className="group block panel rounded-[2rem] p-6 hover:shadow-xl hover:border-[var(--accent)] transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--accent-soft)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-xl font-black group-hover:text-[var(--accent)] transition-colors line-clamp-1 tracking-tight">{product.name}</h3>
              <Tag>{product.category}</Tag>
            </div>
            <p className="text-[var(--muted)] text-sm line-clamp-2 mb-6 h-10 font-medium">{product.description}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-[var(--line)] relative z-10">
              <div>
                <p className="text-2xl font-black tracking-tighter text-[var(--accent)]">{currency(product.price)}</p>
                <p className="text-[10px] text-[var(--muted)] uppercase font-black tracking-widest">{product.stock} Units In Stock</p>
              </div>
              <span className="px-4 py-2 rounded-xl bg-[var(--accent-soft)] text-[10px] font-black uppercase tracking-widest group-hover:bg-[var(--accent)] group-hover:text-white transition-all transform">
                View Asset
              </span>
            </div>
          </Link>
        ))}
        {products.length === 0 && !busy && (
          <div className="col-span-full py-20 text-center">
            <p className="text-2xl font-bold text-[var(--muted)]">No products found</p>
            <p className="mt-2 text-[var(--muted)]">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
