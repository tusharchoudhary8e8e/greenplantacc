import React, { useState, useMemo } from "react";
import { Upload, Plus, ChevronDown, ChevronRight, Copy, Trash2, MoreHorizontal, X } from "lucide-react";
import { Product, ProductVariant, ProductionBatch, SupabaseService } from "../../db/supabaseService";
import { ImportCropsModal } from "./ImportCropsModal";

interface InventoryProps {
  products: Product[];
  batches?: ProductionBatch[];
  onProductsUpdated: () => void;
}

export const MetricInventoryScreen: React.FC<InventoryProps> = ({
  products = [],
  batches = [],
  onProductsUpdated,
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const safeProducts = Array.isArray(products) ? products : [];

  // Add Crop Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [cropName, setCropName] = useState("");
  const [variants, setVariants] = useState<
    { name: string; price: string; duration: string; description: string }[]
  >([{ name: "", price: "", duration: "", description: "" }]);

  React.useEffect(() => {
    if (editingProduct) {
      setCropName(editingProduct.name);
      setVariants(
        editingProduct.variants?.map((v) => ({
          name: v.name,
          price: String(v.price),
          duration: String(v.duration || ""),
          description: v.description || "",
        })) || [{ name: "", price: "", duration: "", description: "" }]
      );
    } else {
      setCropName("");
      setVariants([{ name: "", price: "", duration: "", description: "" }]);
    }
  }, [editingProduct, showAddProdModal]);

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

  const [submitting, setSubmitting] = useState(false);

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName || submitting) return;
    setSubmitting(true);

    const formattedVariants: ProductVariant[] = variants.map((v) => ({
      name: v.name || "Standard",
      price: parseFloat(v.price) || 0,
      duration: parseInt(v.duration) || 0,
      description: v.description,
    }));

    const newProd: Product = {
      ...(editingProduct ? { id: editingProduct.id } : {}),
      name: cropName.toUpperCase(),
      category: editingProduct?.category || "Vegetables",
      unit: editingProduct?.unit || "plants",
      variants: formattedVariants,
      is_active: editingProduct ? editingProduct.is_active : true,
    };

    try {
      await SupabaseService.saveProduct(newProd);
      onProductsUpdated();
      setShowAddProdModal(false);
      setEditingProduct(null);
      setCropName("");
      setVariants([{ name: "", price: "", duration: "", description: "" }]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-[#f4f4f0] min-h-screen font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-[10px] border border-[#e8e8e8]">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">Crop Inventory Directory</h1>
          <p className="text-xs text-[#888] font-medium mt-0.5">
            Manage crop master catalog, seedling varieties, prices, and live surplus greenhouse stock
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#ccc] text-[#444] bg-white hover:bg-slate-50 rounded-[7px] font-semibold text-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#666]" />
            <span>Import Excel/CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setShowAddProdModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#1e4d2b] text-white px-4 py-2 rounded-[7px] font-bold text-xs hover:bg-[#163d21] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Crop</span>
          </button>
        </div>
      </div>

      {/* Live Surplus Stock Card */}
      {(() => {
        const surplusBatches = (batches || []).filter((b) => (b.surplus_quantity || 0) > 0);
        const totalSurplusPlants = surplusBatches.reduce((s, b) => s + (b.surplus_quantity || 0), 0);

        return (
          <div className="bg-[#1a2e1a] text-white p-5 rounded-[10px] border border-[#264226] space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#2d4e2d] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>🌱 Live Surplus Growing Stock</span>
                  </h3>
                  <span className="bg-[#2d5c36] text-[#7cad7c] font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                    {surplusBatches.length} Batches
                  </span>
                </div>
                <p className="text-[11px] text-[#7cad7c] font-medium mt-0.5">
                  Extra unallocated plants currently growing in greenhouses available for new incoming customer orders
                </p>
              </div>

              <div className="bg-[#233d23] px-3.5 py-1.5 rounded-[7px] border border-[#2d4e2d] font-mono text-xs flex items-center gap-2">
                <span className="text-[#7cad7c] font-medium">Total Surplus:</span>
                <span className="text-emerald-300 font-extrabold">🌱 {totalSurplusPlants.toLocaleString()} plants</span>
              </div>
            </div>

            {surplusBatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {surplusBatches.map((b) => {
                  const daysElapsed = Math.max(
                    0,
                    Math.floor(
                      (new Date().getTime() - new Date(b.sowing_date || "").getTime()) /
                        (1000 * 3600 * 24)
                    )
                  );
                  const daysRemaining = Math.max(0, (b.maturity_days || 30) - daysElapsed);

                  return (
                    <div
                      key={b.id || b.batch_no}
                      className="bg-[#233d23]/80 p-3 rounded-[8px] border border-[#2d4e2d] space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-white font-bold text-xs">
                            {b.product_name} - {b.variant_name}
                          </span>
                          <div className="text-[10px] text-[#7cad7c] font-mono mt-0.5">
                            Batch #{b.batch_code || b.batch_no} • {b.polyhouse || "Greenhouse A"}
                          </div>
                        </div>
                        <span className="bg-[#2d5c36] text-emerald-300 border border-[#3c7047] px-2 py-0.5 rounded font-extrabold font-mono text-[11px]">
                          🌱 {(b.surplus_quantity || 0).toLocaleString()} extra
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#2d4e2d] text-[#7cad7c]">
                        <span>Sowed {daysElapsed} days ago ({b.sowing_date})</span>
                        <span className="text-emerald-300 font-bold">
                          ⏳ {daysRemaining} Days Left (Ready {b.end_date})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-2 text-[#7cad7c] text-xs font-medium">
                No surplus stock currently growing in greenhouses.
              </div>
            )}
          </div>
        );
      })()}

      <div className="bg-white rounded-[10px] border border-[#e8e8e8] overflow-hidden">
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
              onClick={() => {
                setEditingProduct(null);
                setShowAddProdModal(true);
              }}
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
              {safeProducts.map((prod) => {
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProduct(prod);
                              setShowAddProdModal(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#00a651] rounded-md hover:bg-emerald-600 transition"
                          >
                            Edit
                          </button>
                        </div>
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
              <h2 className="text-lg font-bold text-[#1e3a5f]">
                {editingProduct ? "Edit Crop" : "Add Crop"}
              </h2>
              <button 
                onClick={() => {
                  setShowAddProdModal(false);
                  setEditingProduct(null);
                }} 
                className="text-slate-400 hover:text-slate-700"
              >
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
                onClick={() => {
                  setShowAddProdModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 py-2.5 border border-[#00a651] text-[#00a651] rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCrop}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#84cc9a] text-white rounded-lg font-semibold text-sm hover:bg-[#6cbe86] transition flex items-center justify-center disabled:opacity-55"
              >
                {submitting ? "Saving..." : (editingProduct ? "Save Changes" : "Create Crop")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
