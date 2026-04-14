import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Product, ProductInput, ProductCategory } from "../types";
import { Panel, Tag } from "../components/UI";
import { currency } from "../utils/formatters";
import { categories, emptyProduct } from "../constants";

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState<ProductInput>(emptyProduct);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    const data = await api.getProducts(100);
    setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleProductFormChange<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setProductForm(prev => ({ ...prev, [key]: value }));
  }

  async function withFeedback(task: () => Promise<void>, successMessage: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await task();
      setMessage(successMessage);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function createProduct() {
     await withFeedback(async () => {
      await api.createProduct(productForm);
      setProductForm(emptyProduct);
    }, "Product created successfully.");
  }

  async function updateProduct() {
    if (!selectedProductId) return setError("Select a product to update");
    const data: Partial<ProductInput> = {};
    if (productForm.name) data.name = productForm.name;
    if (productForm.description) data.description = productForm.description;
    if (productForm.category) data.category = productForm.category;
    if (productForm.price !== "") data.price = Number(productForm.price);
    if (productForm.stock !== "") data.stock = Number(productForm.stock);

    await withFeedback(async () => {
      await api.updateProduct(selectedProductId, data as any);
      setProductForm(emptyProduct);
      setSelectedProductId("");
    }, "Product updated successfully.");
  }

  async function deleteProduct() {
    if (!selectedProductId) return setError("Select a product to delete");
    await withFeedback(async () => {
      await api.deleteProduct(selectedProductId);
      setSelectedProductId("");
      setProductForm(emptyProduct);
    }, "Product deleted successfully.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] animate-fade-in">
      <Panel title="Product Forge" description="Mint new products or update existing records.">
         <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">ID Reference</label>
              <input 
                className="field" 
                placeholder="Auto-generated or selected" 
                value={selectedProductId} 
                onChange={e => setSelectedProductId(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Product Name</label>
              <input 
                className="field" 
                placeholder="Product Name" 
                value={productForm.name} 
                onChange={e => handleProductFormChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Description</label>
              <textarea 
                className="field min-h-[100px]" 
                placeholder="Detailed description..." 
                value={productForm.description} 
                onChange={e => handleProductFormChange("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Price (INR)</label>
                <input 
                  className="field" 
                  placeholder="0.00" 
                  value={productForm.price} 
                  onChange={e => handleProductFormChange("price", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Inventory</label>
                <input 
                  className="field" 
                  placeholder="Units" 
                  value={productForm.stock} 
                  onChange={e => handleProductFormChange("stock", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Classification</label>
              <select 
                className="field" 
                value={productForm.category} 
                onChange={e => handleProductFormChange("category", e.target.value as ProductCategory)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <button className="button-primary" onClick={createProduct} disabled={busy}>Create</button>
              <button className="button-primary" onClick={updateProduct} disabled={busy}>Update</button>
              <button className="button-secondary text-red-500 border-red-500/20" onClick={deleteProduct} disabled={busy}>Delete</button>
            </div>

            {message && <p className="text-sm text-green-500 font-bold mt-2">{message}</p>}
            {error && <p className="text-sm text-red-500 font-bold mt-2">{error}</p>}
         </div>
      </Panel>

      <Panel title="Inventory Ledger" description="Master list of all items in the distribution network.">
         <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-3">
               {products.map(p => (
                 <div 
                  key={p._id} 
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    selectedProductId === p._id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] hover:bg-[var(--accent-soft)]/50"
                  }`}
                  onClick={() => {
                    setSelectedProductId(p._id);
                    setProductForm({
                      name: p.name,
                      description: p.description,
                      price: p.price,
                      category: p.category,
                      stock: p.stock
                    });
                  }}
                 >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{p.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">ID: {p._id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black">{currency(p.price)}</p>
                      <p className="text-xs text-[var(--muted)]">{p.stock} units</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </Panel>
    </div>
  );
}
