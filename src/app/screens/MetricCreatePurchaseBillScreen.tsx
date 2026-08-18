import React, { useState } from "react";
import { Plus, X, Calendar, User, CheckCircle2, ArrowLeft, Receipt, Percent, DollarSign } from "lucide-react";
import { Customer, Product, PurchaseBill, PurchaseBillItem, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "../components/SearchableSelect";

interface CreatePurchaseBillProps {
  customers: Customer[];
  products: Product[];
  editingBill?: PurchaseBill | null;
  onBillSaved: (savedBill: PurchaseBill) => void;
  onCancel: () => void;
}

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

  const [items, setItems] = useState<PurchaseBillItem[]>(
    editingBill?.items && editingBill.items.length > 0
      ? editingBill.items
      : [
          {
            product_name: "",
            variant_name: "",
            price: 0,
            quantity: 0,
          },
        ]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name,
    subLabel: c.address || `${c.city || ""}, ${c.state || ""}`.trim(),
    badge: c.zone || "Party",
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedPartyId);
  const effectivePartyName = selectedCustomer ? selectedCustomer.name : customPartyName;

  // Calculate Subtotal & GST
  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  const numGstVal = parseFloat(gstValue) || 0;
  let gstAmount = 0;
  if (gstType === "percentage") {
    gstAmount = (itemsTotal * numGstVal) / 100;
  } else if (gstType === "amount") {
    gstAmount = numGstVal;
  }

  const transportVal = parseFloat(transportCharge) || 0;
  const paidVal = parseFloat(paidAmount) || 0;
  const totalAmount = itemsTotal + gstAmount + transportVal;
  const dueBalance = Math.max(0, totalAmount - paidVal);

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_name: "",
        variant_name: "",
        price: 0,
        quantity: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof PurchaseBillItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "product_name") {
      const matchedProd = safeProducts.find((p) => p.name === value);
      if (matchedProd && matchedProd.variants && matchedProd.variants.length > 0) {
        updated[index].variant_name = matchedProd.variants[0].name;
        updated[index].price = matchedProd.variants[0].price || 0;
      }
    }

    if (field === "variant_name") {
      const matchedProd = safeProducts.find((p) => p.name === updated[index].product_name);
      const matchedVar = matchedProd?.variants?.find((v) => v.name === value);
      if (matchedVar) {
        updated[index].price = matchedVar.price || 0;
      }
    }

    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!effectivePartyName.trim()) {
      setErrorMsg("Please select or enter a party/vendor name.");
      return;
    }

    if (items.length === 0 || items.some((i) => !i.product_name || !i.quantity)) {
      setErrorMsg("Please ensure all line items have an item name and quantity.");
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
    <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">RKK Nursery</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5 ml-7">
            {editingBill ? `Edit Purchase Bill #${editingBill.bill_no}` : "Create Purchase Bill / Vendor Supply Invoice"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm text-xs disabled:opacity-55 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Saving..." : editingBill ? "Update Purchase Bill" : "Save Purchase Bill"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Section 1: Party & Bill Information */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Vendor / Party Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Party Search/Select */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Party / Vendor Name*
            </label>
            <SearchableSelect
              options={customerOptions}
              value={selectedPartyId}
              onChange={(val) => {
                setSelectedPartyId(val);
                const cust = safeCustomers.find((c) => c.id === val);
                if (cust) setCustomPartyName(cust.name);
              }}
              placeholder="Search vendor / party from registered list..."
            />
            {!selectedPartyId && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Or type new party/vendor name (e.g. Mahavir Seeds Corp)"
                  value={customPartyName}
                  onChange={(e) => setCustomPartyName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Bill No & Date */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase Bill / Voucher No*
              </label>
              <input
                type="text"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bill Date*
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Purchased Line Items */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>Purchased Items & Material Breakdown</span>
        </h3>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const lineTotal = (item.price || 0) * (item.quantity || 0);

            return (
              <div
                key={idx}
                className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Item Name */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Item / Product Name*
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tomato Seeds / Cocopeat / Trays"
                      value={item.product_name}
                      onChange={(e) => updateItemRow(idx, "product_name", e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Variety / Specs */}
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Variety / Variety Specs
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abhilash / 104 Tray"
                      value={item.variant_name || ""}
                      onChange={(e) => updateItemRow(idx, "variant_name", e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Unit Rate */}
                  <div className="md:col-span-1.5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Unit Rate (₹)*
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
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1.5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Qty*
                    </label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) =>
                        updateItemRow(idx, "quantity", parseInt(e.target.value) || 0)
                      }
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Delete Row Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                      title="Remove Item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end text-xs font-bold text-slate-700 pt-1">
                  Line Subtotal: <span className="text-emerald-700 ml-1.5">₹{lineTotal.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addItemRow}
          className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          Add Item Row
        </button>
      </div>

      {/* Section 3: Custom GST & Payment Charges */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-600" />
          <span>Custom GST & Vendor Payments</span>
        </h3>

        {/* GST Configuration Grid */}
        <div className="p-4 border border-emerald-100 bg-emerald-50/40 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            GST Option (Custom Numerical Value)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                GST Type
              </label>
              <select
                value={gstType}
                onChange={(e) => setGstType(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value="percentage">% Percentage Rate (e.g. 5%, 18%)</option>
                <option value="amount">₹ Custom Flat Amount</option>
                <option value="none">No GST (0%)</option>
              </select>
            </div>

            {gstType !== "none" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Custom GST Value ({gstType === "percentage" ? "% Rate" : "₹ Amount"})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder={gstType === "percentage" ? "e.g. 18" : "e.g. 1500"}
                  value={gstValue}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setGstValue(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white"
                />
              </div>
            )}

            <div className="flex flex-col justify-end">
              <div className="text-xs text-slate-500 font-medium">Calculated GST Amount:</div>
              <div className="text-lg font-extrabold text-emerald-700">
                ₹{gstAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Transport & Payment Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Freight / Transport Charge (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={transportCharge}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => setTransportCharge(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Advance Payment Paid to Vendor (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={paidAmount}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            />
          </div>
        </div>

        {/* Remarks / Narration */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Bill Remarks / Narration
          </label>
          <input
            type="text"
            placeholder="e.g. Purchased 50 bags of hybrid tomato seeds from Mahavir Seeds"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
        </div>

        {/* Live Purchase Summary Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Items Subtotal</span>
              <span className="font-bold text-slate-800 text-sm">₹{itemsTotal.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">GST Tax (+)</span>
              <span className="font-bold text-emerald-600 text-sm">+₹{gstAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Freight (+)</span>
              <span className="font-bold text-blue-600 text-sm">+₹{transportVal.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Paid to Vendor (-)</span>
              <span className="font-bold text-purple-600 text-sm">-₹{paidVal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
            <div>
              <div className="text-xs text-slate-500 font-medium">Balance Payable to Vendor</div>
              <div className="text-xl font-extrabold text-amber-600">
                ₹{dueBalance.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Grand Purchase Total</div>
              <div className="text-2xl font-extrabold text-emerald-800">
                ₹{totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
