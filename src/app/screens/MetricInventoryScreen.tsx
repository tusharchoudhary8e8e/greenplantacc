import React, { useState, useMemo } from "react";
import { Upload, Plus, ChevronDown, ChevronRight, Copy, Trash2, MoreHorizontal, X } from "lucide-react";
import { Product, ProductVariant, SupabaseService } from "../../db/supabaseService";
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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Add Crop Modal State
  const [cropName, setCropName] = useState("");
  const [variants, setVariants] = useState<
    { name: string; price: string; duration: string; description: string }[]
  >([{ name: "", price: "", duration: "", description: "" }]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddVariety = () => {
    setVariants([...variants, { name: "", price: "", duration: "", description: "" }]);
  };

  const handleRemoveVariety = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleCopyVariety = (index: number) => {
    setVariants([...variants, { ...variants[index] }]);
  };

  const updateVariety = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName) return;

    const formattedVariants: ProductVariant[] = variants.map((v) => ({
      name: v.name || "Standard",
      price: parseFloat(v.price) || 0,
      duration: parseInt(v.duration) || 0,
      description: v.description,
    }));

    const newProd: Product = {
      name: cropName.toUpperCase(),
      category: "Vegetables", // Default or you could add a field for it
      unit: "plants",
      variants: formattedVariants,
      is_active: true,
    };

    await SupabaseService.saveProduct(newProd);
    onProductsUpdated();
    setShowAddProdModal(false);
    setCropName("");
    setVariants([{ name: "", price: "", duration: "", description: "" }]);
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header matching the screenshot closely */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">
            Greenza Solutions Demo
          </h1>
          <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span>Crops</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
              {products.length}
            </div>
            <span className="text-sm font-semibold text-slate-700">Crops</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddProdModal(true)}
              className="flex items-center gap-2 bg-[#00a651] text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition shadow-sm text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Crops</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-[#00a651] text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition shadow-sm text-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import Crops</span>
            </button>
          </div>
        </div>

        {/* Crops Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="py-3 px-4">CROP</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">SUBCATEGORY</th>
                <th className="py-3 px-4 text-center">VARIANTS</th>
                <th className="py-3 px-4 text-right">PRICE RANGE</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => {
                const isExpanded = expandedRows[prod.id || prod.name];
                const variantsList = prod.variants || [];
                const prices = variantsList.map(v => v.price);
                const minPrice = prices.length ? Math.min(...prices) : 0;
                const maxPrice = prices.length ? Math.max(...prices) : 0;
                const priceRange = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

                return (
                  <React.Fragment key={prod.id || prod.name}>
                    {/* Main Row */}
                    <tr className="hover:bg-slate-50 transition cursor-pointer group">
                      <td className="py-3 px-4 flex items-center gap-3" onClick={() => toggleRow(prod.id || prod.name)}>
                        <button className="text-slate-400 hover:text-emerald-600">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <span className="font-semibold text-slate-700">{prod.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs font-medium uppercase">{prod.category || "-"}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs font-medium">-</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          {variantsList.length}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600 text-xs">
                        {priceRange}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-slate-400 hover:text-slate-700 transition">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Variants Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={6} className="p-0 border-b border-slate-100">
                          <div className="px-14 py-4">
                            <table className="w-full text-left text-xs text-slate-600">
                              <thead>
                                <tr className="text-[10px] uppercase font-bold text-slate-400 mb-2 border-b border-slate-100">
                                  <th className="pb-3 w-1/4">VARIANT</th>
                                  <th className="pb-3 w-1/6">PRICE</th>
                                  <th className="pb-3 w-1/6">DURATION</th>
                                  <th className="pb-3 w-1/4">DESCRIPTION</th>
                                  <th className="pb-3 w-1/6 text-right">STOCKS</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50">
                                {variantsList.map((v, i) => (
                                  <tr key={i} className="font-medium hover:bg-slate-50">
                                    <td className="py-3 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                      {v.name}
                                    </td>
                                    <td className="py-3 text-slate-700">₹ {v.price}</td>
                                    <td className="py-3">{v.duration ? `${v.duration} days` : "-"}</td>
                                    <td className="py-3 text-slate-500">{v.description || "-"}</td>
                                    <td className="py-3 text-right">
                                      <button className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-[10px] hover:bg-emerald-100 transition">
                                        View batches
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {variantsList.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="py-4 text-center text-slate-400">No variants available</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ImportCropsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => onProductsUpdated()}
      />

      {/* Add Crop Modal */}
      {showAddProdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#1e3a5f]">Add Crop</h2>
              <button onClick={() => setShowAddProdModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="border border-slate-200 p-4 rounded-xl">
                <label className="block text-xs font-bold text-slate-800 mb-2">Crop*</label>
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="e.g. Vegetable Seeds"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="border border-slate-200 p-5 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800">Variety</h3>
                  <button onClick={handleAddVariety} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Variety
                  </button>
                </div>

                <div className="space-y-4">
                  {variants.map((v, i) => (
                    <div key={i} className="border border-slate-200 p-4 rounded-lg space-y-4 relative bg-slate-50/30">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-800">Variety #{i + 1}</span>
                        <div className="flex gap-3">
                          <button onClick={() => handleCopyVariety(i)} className="text-blue-500 hover:text-blue-600">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRemoveVariety(i)} className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Variety Name*</label>
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariety(i, "name", e.target.value)}
                            placeholder="e.g. 10kg pack"
                            className="w-full p-2 border border-emerald-500 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Price*</label>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => updateVariety(i, "price", e.target.value)}
                            placeholder="0"
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Duration (days)*</label>
                        <input
                          type="number"
                          value={v.duration}
                          onChange={(e) => updateVariety(i, "duration", e.target.value)}
                          placeholder="0"
                          className="w-full md:w-1/2 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                        <textarea
                          value={v.description}
                          onChange={(e) => updateVariety(i, "description", e.target.value)}
                          placeholder="Enter description"
                          rows={2}
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-4">
              <button
                onClick={() => setShowAddProdModal(false)}
                className="flex-1 py-2.5 border border-[#00a651] text-[#00a651] rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCrop}
                className="flex-1 py-2.5 bg-[#84cc9a] text-white rounded-lg font-semibold text-sm hover:bg-[#6cbe86] transition flex items-center justify-center"
              >
                Create Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
