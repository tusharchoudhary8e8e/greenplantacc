import React, { useState, useEffect } from "react";
import { X, CheckSquare, Square, Sprout, AlertCircle } from "lucide-react";
import { Product, ProductionBatch, Order } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "./SearchableSelect";

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders?: Order[];
  onSave: (batch: Partial<ProductionBatch>) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  products,
  orders = [],
  onSave,
}) => {
  const [lotNo, setLotNo] = useState("");
  const [unit, setUnit] = useState("");
  const [polyhouse, setPolyhouse] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [traySize, setTraySize] = useState("T-120");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [requiredQuantity, setRequiredQuantity] = useState<number | "">("");
  const [bufferQuantity, setBufferQuantity] = useState<number | "">(0);

  // Selected Order IDs for this batch
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const productOptions: SearchableOption[] = products.map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: `${p.variants?.length || 0} varieties`,
    badge: p.category || "Crop",
  }));

  const selectedProdObj = products.find((p) => p.name === selectedProduct);

  const variantOptions: SearchableOption[] = (selectedProdObj?.variants || []).map((v) => ({
    value: v.name,
    label: v.name,
    subLabel: `Duration: ${v.duration || 0} days | Price: ₹${v.price}`,
  }));

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  // Calculated fields
  const [totalSowingQuantity, setTotalSowingQuantity] = useState(0);
  const [numberOfTrays, setNumberOfTrays] = useState(0);
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Pending Customer Orders matching selected Product & Variant
  const matchingOrders = React.useMemo(() => {
    if (!selectedProduct) return [];
    return (orders || []).filter((ord) => {
      if (!ord.items || ord.items.length === 0) return false;
      return ord.items.some(
        (i) =>
          i.product_name.toLowerCase() === selectedProduct.toLowerCase() &&
          (!selectedVariant || (i.variant_name || "").toLowerCase() === selectedVariant.toLowerCase())
      );
    });
  }, [orders, selectedProduct, selectedVariant]);

  // Sum of quantities of selected customer orders
  const allocatedDemand = React.useMemo(() => {
    let sum = 0;
    matchingOrders.forEach((ord) => {
      if (selectedOrderIds.includes(ord.id || "")) {
        ord.items?.forEach((i) => {
          if (
            i.product_name.toLowerCase() === selectedProduct.toLowerCase() &&
            (!selectedVariant || (i.variant_name || "").toLowerCase() === selectedVariant.toLowerCase())
          ) {
            sum += i.quantity || 0;
          }
        });
      }
    });
    return sum;
  }, [matchingOrders, selectedOrderIds, selectedProduct, selectedVariant]);

  // Auto update required quantity if allocated demand changes and user hasn't typed a higher number
  useEffect(() => {
    if (allocatedDemand > 0 && (Number(requiredQuantity) || 0) < allocatedDemand) {
      setRequiredQuantity(allocatedDemand);
    }
  }, [allocatedDemand]);

  const surplusQuantity = Math.max(0, (Number(requiredQuantity) || 0) - allocatedDemand);

  useEffect(() => {
    // Calculate Sowing Quantity
    const reqQty = Number(requiredQuantity) || 0;
    const bufPct = Number(bufferQuantity) || 0;
    const total = Math.ceil(reqQty + reqQty * (bufPct / 100));
    setTotalSowingQuantity(total);

    // Calculate Trays
    const capacityMatch = traySize.match(/\d+/);
    const capacity = capacityMatch ? parseInt(capacityMatch[0]) : 126;
    setNumberOfTrays(Math.ceil(total / capacity));
  }, [requiredQuantity, bufferQuantity, traySize]);

  useEffect(() => {
    // Calculate End Date
    if (selectedProduct && selectedVariant) {
      const product = products.find((p) => p.name === selectedProduct);
      const variant = product?.variants?.find((v) => v.name === selectedVariant);
      const duration = variant?.duration || 30;
      setDurationDays(duration);

      if (startDate && duration > 0) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + duration);
        setEndDate(start.toISOString().split("T")[0]);
      } else {
        setEndDate(startDate);
      }
    }
  }, [selectedProduct, selectedVariant, startDate, products]);

  if (!isOpen) return null;

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        batch_no: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
        batch_code: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
        lot_no: lotNo || `${Math.floor(10000 + Math.random() * 90000)}`,
        unit: unit || "Unit 1",
        polyhouse: polyhouse || "Polyhouse A",
        table_no: tableNo || "Table 1",
        tray_size: traySize,
        product_name: selectedProduct,
        variant_name: selectedVariant,
        required_quantity: Number(requiredQuantity) || 0,
        allocated_quantity: allocatedDemand,
        surplus_quantity: surplusQuantity,
        linked_order_ids: selectedOrderIds,
        maturity_days: durationDays || 30,
        buffer_quantity_pct: Number(bufferQuantity) || 0,
        total_seeds: totalSowingQuantity,
        trays_used: numberOfTrays,
        trays_sown: numberOfTrays,
        sowing_date: startDate,
        end_date: endDate,
        status: "germinating",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#1e3a5f]">Create Batch</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Batch Details */}
          <div className="space-y-4 border border-slate-100 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Batch Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LOT No.</label>
                <input
                  type="text"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 002200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Unit</option>
                  <option value="Unit 1">Unit 1</option>
                  <option value="Unit 2">Unit 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Polyhouse</label>
                <select
                  value={polyhouse}
                  onChange={(e) => setPolyhouse(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Polyhouse</option>
                  <option value="Polyhouse A">Polyhouse A</option>
                  <option value="Polyhouse B">Polyhouse B</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Table</label>
                <select
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Table</option>
                  <option value="Table 1">Table 1</option>
                  <option value="Table 2">Table 2</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Tray</label>
                <select
                  value={traySize}
                  onChange={(e) => setTraySize(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="T-98">T-98</option>
                  <option value="T-104">T-104</option>
                  <option value="T-120">T-120</option>
                  <option value="T-126">T-126</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sowing Plan */}
          <div className="space-y-4 border border-slate-100 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Sowing Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
                <SearchableSelect
                  options={productOptions}
                  value={selectedProduct}
                  onChange={(val) => {
                    setSelectedProduct(val);
                    setSelectedVariant("");
                  }}
                  placeholder="Type to search & select Product..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Variant</label>
                <SearchableSelect
                  options={variantOptions}
                  value={selectedVariant}
                  onChange={(val) => setSelectedVariant(val)}
                  placeholder="Type to search & select Variant..."
                  disabled={!selectedProduct}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Sowing Quantity (Seeds/Plants)</label>
                <input
                  type="number"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm font-extrabold focus:outline-none focus:border-emerald-500 text-emerald-800"
                  placeholder="e.g. 40000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Buffer Quantity (%)</label>
                <input
                  type="number"
                  value={bufferQuantity}
                  onChange={(e) => setBufferQuantity(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Total Seeds Sown</label>
                <input
                  type="number"
                  value={totalSowingQuantity}
                  disabled
                  className="w-full p-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Number of Trays</label>
                <input
                  type="number"
                  value={numberOfTrays}
                  disabled
                  className="w-full p-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Customer Orders Linking */}
            {selectedProduct && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    <span>Link Pending Customer Orders</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {matchingOrders.length} Matching Orders
                  </span>
                </div>

                {matchingOrders.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 bg-slate-50/50">
                    {matchingOrders.map((ord) => {
                      const isSelected = selectedOrderIds.includes(ord.id || "");
                      const ordQty = (ord.items || [])
                        .filter(
                          (i) =>
                            i.product_name.toLowerCase() === selectedProduct.toLowerCase() &&
                            (!selectedVariant || (i.variant_name || "").toLowerCase() === selectedVariant.toLowerCase())
                        )
                        .reduce((s, i) => s + (i.quantity || 0), 0);

                      return (
                        <div
                          key={ord.id}
                          onClick={() => toggleOrderSelection(ord.id || "")}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="font-bold text-slate-800">{ord.customer_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                #{ord.order_no || ord.id} • {ord.order_date}
                              </div>
                            </div>
                          </div>
                          <span className="font-extrabold font-mono text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-100">
                            🌱 {ordQty.toLocaleString()} plants
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg">
                    No pending orders found for {selectedProduct} {selectedVariant}. Total sowing quantity will be stored as Surplus Inventory.
                  </p>
                )}

                {/* Stock Allocation & Surplus Breakdown Box */}
                <div className="bg-emerald-950/90 text-emerald-100 p-3.5 rounded-xl text-xs space-y-1.5 shadow-md">
                  <div className="flex justify-between items-center font-bold">
                    <span>Allocated for Linked Orders:</span>
                    <span className="font-mono text-emerald-300">🌱 {allocatedDemand.toLocaleString()} plants</span>
                  </div>
                  <div className="flex justify-between items-center font-extrabold text-amber-300 border-t border-emerald-800/80 pt-1.5">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      Unallocated Extra Surplus Stock:
                    </span>
                    <span className="font-mono text-sm bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30">
                      🌱 {surplusQuantity.toLocaleString()} plants
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Batch Timeline */}
          <div className="space-y-4 border border-slate-100 p-4 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Batch Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  disabled
                  className="w-full p-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
            {durationDays > 0 && (
              <p className="text-xs font-medium text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                Production will complete in {durationDays} days (based on Inventory).
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#00a651] text-[#00a651] rounded-lg font-semibold text-sm hover:bg-emerald-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#84cc9a] text-white rounded-lg font-semibold text-sm hover:bg-[#6cbe86] transition flex items-center justify-center disabled:opacity-55"
            >
              {submitting ? "Creating..." : "Create Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
