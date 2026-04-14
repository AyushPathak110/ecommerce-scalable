import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Catalog } from "./pages/Catalog";
import { ProductDetails } from "./pages/ProductDetails";
import { AdminProducts } from "./pages/AdminProducts";
import { Orders } from "./pages/Orders";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/catalogue" element={<Catalog />} />
          <Route path="/admin/catalogue/:id" element={<ProductDetails />} />
          <Route path="/admin/inventory" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<Orders />} />
          {/* Redirect root to admin dashboard */}
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
