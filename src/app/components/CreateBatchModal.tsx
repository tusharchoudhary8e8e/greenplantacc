import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Product, ProductionBatch } from "../../db/supabaseService";

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSave: (batch: Partial<ProductionBatch>) => void;
}

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  products,
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

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  // Calculated fields
  const [totalSowingQuantity, setTotalSowingQuantity] = useState(0);
  const [numberOfTrays, setNumberOfTrays] = useState(0);
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
      const duration = variant?.duration || 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        batch_no: `BCH-${Date.now().toString().slice(-6)}`,
        lot_no: lotNo,
        unit,
        polyhouse,
        table_no: tableNo,
        tray_size: traySize,
        product_name: selectedProduct,
        variant_name: selectedVariant,
        required_quantity: Number(requiredQuantity) || 0,
        buffer_quantity_pct: Number(bufferQuantity) || 0,
        total_seeds: totalSowingQuantity, // map to total_seeds for backward compatibility
        trays_used: numberOfTrays,
        sowing_date: startDate,
        end_date: endDate,
        status: "sowing",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProdObj = products.find((p) => p.name === selectedProduct);

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
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSelectedVariant("");
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Variant</label>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-500"
                  required
                  disabled={!selectedProduct}
                >
                  <option value="">Select Variant</option>
                  {selectedProdObj?.variants?.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Quantity</label>
                <input
                  type="number"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Total Sowing Quantity</label>
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
