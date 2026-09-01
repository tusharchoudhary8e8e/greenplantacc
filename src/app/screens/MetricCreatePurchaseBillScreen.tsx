import React, { useState } from "react";
import {
  Plus,
  X,
  Calendar,
  User,
  CheckCircle2,
  ArrowLeft,
  Receipt,
  Percent,
  DollarSign,
  Sprout,
  Package,
  Layers,
  FlaskConical,
  Wrench,
  Sparkles,
} from "lucide-react";
import {
  Customer,
  Product,
  PurchaseBill,
  PurchaseBillItem,
  SupabaseService,
} from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "../components/SearchableSelect";
import {
  calculatePurchaseBillTotals,
  roundCurrency,
  formatCurrencyINR,
} from "../utils/financialMath";

interface CreatePurchaseBillProps {
  customers: Customer[];
  products: Product[];
  editingBill?: PurchaseBill | null;
  onBillSaved: (savedBill: PurchaseBill) => void;
  onCancel: () => void;
}

// Quick presets for common Nursery Materials & Ready Plants
const NURSERY_ITEM_PRESETS = [
  // Ready Plants (from other nurseries)
  { type: "plants", name: "Papaya Red Lady (Ready Saplings)", unit: "Plants", defaultPrice: 10 },
  { type: "plants", name: "Tomato Abhilash (Ready Seedlings)", unit: "Plants", defaultPrice: 1.5 },
  { type: "plants", name: "Chilli US-341 (Ready Seedlings)", unit: "Plants", defaultPrice: 2.0 },
  { type: "plants", name: "Marigold Calcutta Orange (Ready)", unit: "Plants", defaultPrice: 3.5 },
  { type: "plants", name: "Mango Grafted Saplings (Kesar/Alphonso)", unit: "Plants", defaultPrice: 120 },
  { type: "plants", name: "Guava VNR Bihi Ready Plants", unit: "Plants", defaultPrice: 65 },

  // Cocopeat & Media
  { type: "cocopeat", name: "Cocopeat 5kg Block (Low EC)", unit: "Blocks", defaultPrice: 160 },
  { type: "cocopeat", name: "Cocopeat Loose Bag (Washed)", unit: "Bags", defaultPrice: 280 },
  { type: "cocopeat", name: "Vermiculite Grade-2", unit: "Bags", defaultPrice: 450 },
  { type: "cocopeat", name: "Perlite Growing Medium", unit: "Bags", defaultPrice: 600 },

  // Seedling Trays & Containers
  { type: "trays", name: "Seedling Pro-Tray 104 Cavity", unit: "Trays", defaultPrice: 14 },
  { type: "trays", name: "Seedling Pro-Tray 98 Cavity", unit: "Trays", defaultPrice: 15 },
  { type: "trays", name: "Seedling Pro-Tray 50 Cavity (Papaya)", unit: "Trays", defaultPrice: 18 },
  { type: "trays", name: "Seedling Pro-Tray 126 Cavity", unit: "Trays", defaultPrice: 16 },
  { type: "trays", name: "Poly Bags 6x9 (Nursery Packing)", unit: "Kg", defaultPrice: 190 },
  { type: "trays", name: "Plastic Vegetable Crates", unit: "Nos", defaultPrice: 280 },

  // Seeds & Grains
  { type: "seeds", name: "Tomato Abhinash 10g Seed Packet", unit: "Packets", defaultPrice: 950 },
  { type: "seeds", name: "Chilli US-341 10g Seed Packet", unit: "Packets", defaultPrice: 850 },
  { type: "seeds", name: "Papaya Red Lady 786 10g Packet", unit: "Packets", defaultPrice: 4200 },
  { type: "seeds", name: "Cabbage Seminis Fieldwinner 10g", unit: "Packets", defaultPrice: 650 },

  // Fertilizers & Chemicals
  { type: "fertilizer", name: "NPK 19:19:19 Water Soluble", unit: "Bags (25kg)", defaultPrice: 2400 },
  { type: "fertilizer", name: "12:61:00 (Mono Ammonium Phosphate)", unit: "Bags (25kg)", defaultPrice: 3200 },
  { type: "fertilizer", name: "Humic Acid 98% Potassium Humate", unit: "Kg", defaultPrice: 380 },
  { type: "fertilizer", name: "Saaf Fungicide (Carbendazim + Mancozeb)", unit: "Kg", defaultPrice: 680 },
  { type: "fertilizer", name: "Trichoderma Viride Bio-Fungicide", unit: "Kg", defaultPrice: 180 },
  { type: "fertilizer", name: "Confidor Insecticide (Imidacloprid)", unit: "Litres", defaultPrice: 1400 },
];

const QUICK_UNITS = [
  "Plants",
  "Trays",
  "Bags",
  "Blocks",
  "Packets",
  "Kg",
  "Grams",
  "Litres",
  "Boxes",
  "Nos",
  "Rolls",
];

export const MetricCreatePurchaseBillScreen: React.FC<CreatePurchaseBillProps> = ({
  customers = [],
  products = [],
  editingBill = null,
  onBillSaved,
  onCancel,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedPartyId, setSelectedPartyId] = useState<string>(editingBill?.party_id || "");
  const [customPartyName, setCustomPartyName] = useState<string>(editingBill?.party_name || "");
  const [billDate, setBillDate] = useState<string>(editingBill?.bill_date || todayStr);
  const [billNo, setBillNo] = useState<string>(
    editingBill?.bill_no || `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // GST State
  const [gstType, setGstType] = useState<"percentage" | "amount" | "none">(
    editingBill?.gst_type || "percentage"
  );
  const [gstValue, setGstValue] = useState<string>(
    editingBill?.gst_value !== undefined ? String(editingBill.gst_value) : "18"
  );

  const [transportCharge, setTransportCharge] = useState<string>(
    editingBill?.transport_charge ? String(editingBill.transport_charge) : ""
  );
  const [paidAmount, setPaidAmount] = useState<string>(
    editingBill?.paid_amount ? String(editingBill.paid_amount) : ""
  );
  const [narration, setNarration] = useState<string>(editingBill?.narration || "");

  // Line items state
  const [items, setItems] = useState<PurchaseBillItem[]>(
    editingBill?.items && editingBill.items.length > 0
      ? editingBill.items
      : [
          {
            product_name: "",
            variant_name: "",
            unit: "Plants",
            item_type: "plants",
            price: 0,
            quantity: 0,
            notes: "",
          },
        ]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeCustomers = Array.isArray(customers) ? customers : [];

  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name,
    subLabel: c.address || `${c.city || ""}, ${c.state || ""}`.trim(),
    badge: c.size_category || "Vendor / Supplier",
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedPartyId);
  const effectivePartyName = selectedCustomer ? selectedCustomer.name : customPartyName;

  // Calculate Subtotal & GST with exact 2-decimal GAAP banker's precision
  const numGstVal = parseFloat(gstValue) || 0;
  const rawTransportVal = parseFloat(transportCharge) || 0;
  const rawPaidVal = parseFloat(paidAmount) || 0;

  const {
    itemsTotal,
    gstAmount,
    transportVal,
    paidVal,
    netGrandTotal: totalAmount,
    dueBalance,
  } = calculatePurchaseBillTotals(
    items.map((i) => ({ price: i.price || 0, quantity: i.quantity || 0 })),
    gstType,
    numGstVal,
    rawTransportVal,
    rawPaidVal
  );

  const addItemRow = (preset?: typeof NURSERY_ITEM_PRESETS[0]) => {
    setItems([
      ...items,
      {
        product_name: preset ? preset.name : "",
        variant_name: "",
        unit: preset ? preset.unit : "Plants",
        item_type: preset ? (preset.type as any) : "plants",
        price: preset ? preset.defaultPrice : 0,
        quantity: 0,
        notes: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          product_name: "",
          variant_name: "",
          unit: "Plants",
          item_type: "plants",
          price: 0,
          quantity: 0,
          notes: "",
        },
      ]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof PurchaseBillItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const applyPresetToRow = (index: number, preset: typeof NURSERY_ITEM_PRESETS[0]) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_name: preset.name,
      unit: preset.unit,
      item_type: preset.type as any,
      price: preset.defaultPrice || updated[index].price,
    };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!effectivePartyName.trim()) {
      setErrorMsg("Please select or enter a supplier / nursery / vendor name.");
      return;
    }

    if (items.length === 0 || items.some((i) => !i.product_name.trim() || !i.quantity)) {
      setErrorMsg("Please ensure all line items have an item/plant name and a quantity.");
      return;
    }

    setSubmitting(true);

    const billPayload: PurchaseBill = {
      ...(editingBill ? editingBill : {}),
      bill_no: billNo,
      party_id: selectedCustomer?.id || selectedPartyId,
      party_name: effectivePartyName.trim(),
      bill_date: billDate,
      gst_type: gstType,
      gst_value: numGstVal,
      gst_amount: gstAmount,
      transport_charge: transportVal,
      paid_amount: paidVal,
      items_total: itemsTotal,
      total_amount: totalAmount,
      due_amount: dueBalance,
      narration: narration.trim(),
      items: items,
    };

    try {
      const saved = await SupabaseService.savePurchaseBill(billPayload);
      onBillSaved(saved);
    } catch (err) {
      console.error("Save purchase bill error:", err);
      setErrorMsg("Failed to save purchase bill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">RKK Nursery — Record Purchase Bill</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5 ml-7">
            {editingBill
              ? `Editing Purchase Bill #${editingBill.bill_no}`
              : "Record purchases of plants from other nurseries, cocopeat, trays, seeds & fertilizers"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-xs text-xs disabled:opacity-55 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Saving..." : editingBill ? "Update Purchase Bill" : "Save Purchase Bill"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 animate-fadeIn">
          {errorMsg}
        </div>
      )}

      {/* Section 1: Supplier / Party Details */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Supplier / Nursery / Vendor Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Party Search / Free-Text */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Supplier / Party Name*
            </label>
            <SearchableSelect
              options={customerOptions}
              value={selectedPartyId}
              onChange={(val) => {
                setSelectedPartyId(val);
                const cust = safeCustomers.find((c) => c.id === val);
                if (cust) setCustomPartyName(cust.name);
              }}
              placeholder="Search supplier / other nursery name..."
            />
            <div className="pt-1">
              <input
                type="text"
                placeholder="Or type new supplier / nursery name (e.g. Shree Ram Nursery / Mahyco Agro)"
                value={customPartyName}
                onChange={(e) => {
                  setCustomPartyName(e.target.value);
                  if (selectedPartyId && e.target.value !== selectedCustomer?.name) {
                    setSelectedPartyId("");
                  }
                }}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Bill No & Date */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase Bill / Invoice No*
              </label>
              <input
                type="text"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase Date*
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Purchased Items (Plants / Cocopeat / Trays / Seeds / Fertilizers) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Purchased Materials &amp; Plants Breakdown
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Type anything freely (ready plants from other nurseries, media, seeds, fertilizer)
          </span>
        </div>

        {/* Quick Item Category Presets Toolbar */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick-Add Common Nursery Items:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NURSERY_ITEM_PRESETS.slice(0, 8).map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => addItemRow(preset)}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>+</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="space-y-3 pt-1">
          {items.map((item, idx) => {
            const lineTotal = roundCurrency((item.price || 0) * (item.quantity || 0));

            return (
              <div
                key={idx}
                className="p-4 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition space-y-3 shadow-2xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Item / Plant Name (Free-Text with Datalist) */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Item / Plant / Material Name*
                    </label>
                    <input
                      type="text"
                      list={`preset-items-${idx}`}
                      placeholder="e.g. Papaya Red Lady Plants / Cocopeat 5kg / 104 Trays"
                      value={item.product_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateItemRow(idx, "product_name", val);
                        const matched = NURSERY_ITEM_PRESETS.find((p) => p.name === val);
                        if (matched) {
                          applyPresetToRow(idx, matched);
                        }
                      }}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                      required
                    />
                    <datalist id={`preset-items-${idx}`}>
                      {NURSERY_ITEM_PRESETS.map((p, pIdx) => (
                        <option key={pIdx} value={p.name} />
                      ))}
                    </datalist>
                  </div>

                  {/* Variety / Source / Specs */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Variety / Source / Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Shree Ram Nursery / US-341"
                      value={item.variant_name || ""}
                      onChange={(e) => updateItemRow(idx, "variant_name", e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50"
                    />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      list={`preset-units-${idx}`}
                      placeholder="Plants / Bags / Trays"
                      value={item.unit || "Plants"}
                      onChange={(e) => updateItemRow(idx, "unit", e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50"
                    />
                    <datalist id={`preset-units-${idx}`}>
                      {QUICK_UNITS.map((u, uIdx) => (
                        <option key={uIdx} value={u} />
                      ))}
                    </datalist>
                  </div>

                  {/* Rate per Unit */}
                  <div className="md:col-span-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rate (₹)*
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Rate"
                      value={item.price || ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) =>
                        updateItemRow(idx, "price", parseFloat(e.target.value) || 0)
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 text-right"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Qty*
                    </label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) =>
                        updateItemRow(idx, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50 text-right"
                      required
                    />
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex justify-end pt-6">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1.5 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-lg transition cursor-pointer"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Line Total Badge */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 pt-1 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-normal">
                    {item.quantity ? `${item.quantity.toLocaleString("en-IN")} ${item.unit || "Units"} × ₹${item.price || 0}` : "Enter quantity & rate"}
                  </span>
                  <div>
                    Subtotal: <span className="text-emerald-700 font-extrabold text-sm ml-1">₹{lineTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => addItemRow()}
          className="flex items-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Custom Line Item</span>
        </button>
      </div>

      {/* Section 3: GST, Transport & Payment Settlement */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>GST, Inward Freight &amp; Payment Settlement</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* GST Type & Rate */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">GST Calculation</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={gstType}
                onChange={(e) => setGstType(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50"
              >
                <option value="percentage">GST Rate (%)</option>
                <option value="amount">Fixed GST (₹)</option>
                <option value="none">No GST (0%)</option>
              </select>

              {gstType !== "none" && (
                <input
                  type="number"
                  step="any"
                  placeholder={gstType === "percentage" ? "% Rate" : "₹ Amount"}
                  value={gstValue}
                  onChange={(e) => setGstValue(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50"
                />
              )}
            </div>
          </div>

          {/* Transport / Inward Freight */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Inward Freight / Transport (₹)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={transportCharge}
              onChange={(e) => setTransportCharge(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-slate-50"
            />
          </div>

          {/* Amount Paid Now */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount Paid Now (₹)
            </label>
            <input
              type="number"
              step="any"
              placeholder="0 (or full payment)"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50/50"
            />
          </div>

          {/* Narration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bill Narration / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Purchased for summer plantation batch"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50"
            />
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Items Total</span>
            <span className="font-extrabold text-slate-800 text-sm">₹{itemsTotal.toLocaleString("en-IN")}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">GST Amount</span>
            <span className="font-extrabold text-slate-800 text-sm">₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Transport</span>
            <span className="font-extrabold text-slate-800 text-sm">₹{transportVal.toLocaleString("en-IN")}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Net Bill Total</span>
            <span className="font-black text-emerald-700 text-base">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Payable Due (You Owe)</span>
            <span className={`font-black text-base ${dueBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              ₹{dueBalance.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </form>
  );
};
