import React, { useState } from "react";
import { Upload, Plus, Package, Tag, Layers, CheckCircle } from "lucide-react";
import { Product, SupabaseService } from "../../db/supabaseService";
import { ImportCropsModal } from "./ImportCropsModal";

interface InventoryProps {
  products: Product[];
  onProductsUpdated: () => void;
}

export const MetricInventoryScreen: React.FC<InventoryProps> = ({
  products,
  onProductsUpdated,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [variantName, setVariantName] = useState("");
  const [price, setPrice] = useState("1.5");

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newProd: Product = {
      name: name.toUpperCase(),
      category,
      unit: "plants",
      variants: [{ name: variantName || "STANDARD", price: parseFloat(price) || 1.5 }],
      is_active: true,
    };

    await SupabaseService.saveProduct(newProd);
    onProductsUpdated();
    setShowAddProdModal(false);
    setName("");
    setVariantName("");
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">
            MetricAccounting Demo
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Crops & Inventory Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 border border-[#00a651] text-[#00a651] bg-emerald-50/50 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-100/50 transition shadow-sm text-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import Crops (.xlsx)</span>
          </button>
          <button
            onClick={() => setShowAddProdModal(true)}
            className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Crop</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{prod.name}</h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Category: {prod.category || "Vegetables"}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Available Variants & Pricing</span>
              </div>

              <div className="space-y-1.5 pl-2">
                {(prod.variants || []).map((v, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg"
                  >
                    <span className="font-medium text-slate-700">{v.name}</span>
                    <span className="font-bold text-emerald-600">₹{v.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Import Crops Modal */}
      <ImportCropsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => onProductsUpdated()}
      />

      {/* Add Product Modal */}
      {showAddProdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              Add New Crop
            </h3>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Crop / Product Name*
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="e.g. CAPSICUM"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Vegetables"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. GREEN STAR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProdModal(false)}
                  className="px-5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#00a651] text-white rounded-xl text-xs font-bold hover:bg-emerald-600"
                >
                  Save Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
