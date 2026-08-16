import React, { useState } from "react";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plus,
  X,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";
import { Customer, Product, Order, OrderItem, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "../components/SearchableSelect";

interface CreateOrderProps {
  customers: Customer[];
  products: Product[];
  onOrderSaved: (newOrder: Order) => void;
  onCancel: () => void;
}

export const MetricCreateOrderScreen: React.FC<CreateOrderProps> = ({
  customers,
  products,
  onOrderSaved,
  onCancel,
}) => {
  // NO default customer selected initially
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedCustId, setSelectedCustId] = useState<string>("");
  const [orderDate, setOrderDate] = useState(todayStr);
  const [errorMsg, setErrorMsg] = useState("");

  // Selected customer object (undefined if not selected yet)
  const selectedCustomer = customers.find((c) => c.id === selectedCustId);

  // Customer options for SearchableSelect
  const customerOptions: SearchableOption[] = customers.map((c) => {
    const hasDuplicateName = customers.filter(
      (cust) => (cust.name || "").trim().toLowerCase() === (c.name || "").trim().toLowerCase()
    ).length > 1;
    const label = hasDuplicateName
      ? `${c.name} (${c.city || c.address || "No Address"})`
      : c.name;
    return {
      value: c.id,
      label,
      subLabel: c.address || `${c.city || ""}, ${c.state || ""}`.trim(),
      badge: c.zone || "ZONE1",
    };
  });

  // Product options for SearchableSelect
  const productOptions: SearchableOption[] = products.map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: `${p.variants?.length || 0} varieties`,
    badge: p.category || "Crop",
  }));

  // Order Line Items - Starts completely empty (no pre-filled product, variety, price or qty)
  const [items, setItems] = useState<OrderItem[]>([
    {
      product_name: "",
      variant_name: "",
      price: 0,
      quantity: 0,
      dispatch_from: todayStr,
      dispatch_to: todayStr,
      sowing_date: todayStr,
      remaining_qty: 0,
    },
  ]);

  // Payment States
  const [transportCharge, setTransportCharge] = useState("");
  const [advancePayment, setAdvancePayment] = useState("");
  const [focAmount, setFocAmount] = useState("");

  const itemsTotal = items.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const totalAmount = itemsTotal + (parseFloat(transportCharge) || 0);

  const calculateSowingDate = (dispatchFrom: string, productName: string, variantName: string): string => {
    const prod = products.find(p => p.name === productName);
    const variant = prod?.variants?.find(v => v.name === variantName);
    const duration = variant?.duration || 0;
    if (!dispatchFrom) return dispatchFrom;
    const date = new Date(dispatchFrom);
    date.setDate(date.getDate() - duration);
    return date.toISOString().split("T")[0];
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_name: "",
        variant_name: "",
        price: 0,
        quantity: 0,
        dispatch_from: orderDate,
        dispatch_to: orderDate,
        sowing_date: orderDate,
        remaining_qty: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === "product_name") {
      updated[index].variant_name = "";
      updated[index].price = 0;
    }

    if (field === "variant_name") {
      const selectedProd = products.find(p => p.name === updated[index].product_name);
      const selectedVar = selectedProd?.variants?.find(v => v.name === value);
      if (selectedVar) {
        updated[index].price = selectedVar.price || 0;
        updated[index].sowing_date = calculateSowingDate(
          updated[index].dispatch_from || orderDate,
          updated[index].product_name,
          selectedVar.name
        );
      }
    }

    if (field === "dispatch_from") {
      updated[index].sowing_date = calculateSowingDate(
        value,
        updated[index].product_name,
        updated[index].variant_name || ""
      );
    }
    
    setItems(updated);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!selectedCustId || !selectedCustomer) {
      setErrorMsg("Please search and select a customer before saving the order.");
      return;
    }

    setSubmitting(true);

    const newOrdPayload: Order = {
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      order_date: orderDate,
      transport_charge: parseFloat(transportCharge) || 0,
      advance_payment: parseFloat(advancePayment) || 0,
      foc_amount: parseFloat(focAmount) || 0,
      items: items,
    };

    try {
      const saved = await SupabaseService.createOrder(newOrdPayload);
      onOrderSaved(saved);
    } catch (err) {
      console.error("Order save error:", err);
      setErrorMsg("Failed to save order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">
          RKK Nursery
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Orders</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Create Order</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#00a651] text-white rounded-xl font-semibold hover:bg-emerald-600 transition shadow-sm text-sm disabled:opacity-55"
          >
            {submitting ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
          {errorMsg}
        </div>
      )}

      {/* Section 1: Order Information */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          Order Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Customer* (Search & Select)
            </label>
            <SearchableSelect
              options={customerOptions}
              value={selectedCustId}
              onChange={(val) => {
                setSelectedCustId(val);
                setErrorMsg("");
              }}
              placeholder="Type customer name to search & select..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Order Date*
            </label>
            <div className="relative">
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Selected Customer Details Card */}
        {selectedCustomer && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                {selectedCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedCustomer.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedCustomer.org_id || "#ORG1_CUST_2026_0002"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {selectedCustomer.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-500" />
                    {selectedCustomer.email || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5 max-w-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{selectedCustomer.address || `${selectedCustomer.city}, ${selectedCustomer.state}`}</span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                  {selectedCustomer.zone || "ZONE1 ZONE"}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
                  {(selectedCustomer.size_category || "SMALL").toUpperCase()}
                </span>
                {(selectedCustomer.crop_types || ["Tomato"]).map((crop, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Order Items */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          Order Items
        </h3>

        <div className="space-y-4">
          {items.map((item, idx) => {
            const currentProd = products.find((p) => p.name === item.product_name) || products[0];

            const variantOptions: SearchableOption[] = (
              currentProd?.variants || [{ name: item.variant_name || "TALWAR", price: 1.6 }]
            ).map((v) => ({
              value: v.name,
              label: v.name,
              subLabel: `₹${v.price} | Duration: ${v.duration || 0} days`,
            }));

            return (
              <div
                key={idx}
                className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50 shadow-sm"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Product SearchableSelect */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Product
                    </label>
                    <SearchableSelect
                      options={productOptions}
                      value={item.product_name}
                      onChange={(val) => updateItemRow(idx, "product_name", val)}
                      placeholder="Select Product..."
                    />
                  </div>

                  {/* Variant SearchableSelect */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Variant
                    </label>
                    <SearchableSelect
                      options={variantOptions}
                      value={item.variant_name}
                      onChange={(val) => updateItemRow(idx, "variant_name", val)}
                      placeholder="Select Variant..."
                    />
                  </div>

                  {/* Price */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.00"
                      value={item.price || ""}
                      onChange={(e) =>
                        updateItemRow(idx, "price", parseFloat(e.target.value) || 0)
                      }
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold bg-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateItemRow(idx, "quantity", parseInt(e.target.value) || 0)
                      }
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold bg-white"
                    />
                  </div>

                  {/* Dispatch Window (No Overlapping!) */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Dispatch Window (From & To)
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <input
                        type="date"
                        value={item.dispatch_from || orderDate}
                        onChange={(e) => updateItemRow(idx, "dispatch_from", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="date"
                        value={item.dispatch_to || orderDate}
                        onChange={(e) => updateItemRow(idx, "dispatch_to", e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Sowing Date (Dedicated Grid Column) */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Sowing Date
                    </label>
                    <input
                      type="date"
                      value={item.sowing_date || orderDate}
                      onChange={(e) => updateItemRow(idx, "sowing_date", e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex items-center justify-end pt-5">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Row Sub-bar: Remaining & Link Batch */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-red-500 font-semibold">
                    Remaining: {item.remaining_qty || item.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[#00a651] border border-[#00a651] bg-emerald-50/50 hover:bg-emerald-100/50 px-3 py-1 rounded-lg text-xs font-semibold transition"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Link Batch
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addItemRow}
          className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          Add Item
        </button>
      </div>

      {/* Section 3: Order Payment */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          Order Payment
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Transport Charge (₹)
            </label>
            <input
              type="number"
              placeholder="eg. 1500"
              value={transportCharge}
              onChange={(e) => setTransportCharge(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Advance Payment (₹)
            </label>
            <input
              type="number"
              placeholder="eg. 10000"
              value={advancePayment}
              onChange={(e) => setAdvancePayment(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              FOC (₹)
            </label>
            <input
              type="number"
              placeholder="eg. 750"
              value={focAmount}
              onChange={(e) => setFocAmount(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        {/* Totals Summary Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Items Total: <span className="font-bold text-slate-800">₹{itemsTotal.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Grand Total</div>
            <div className="text-2xl font-extrabold text-slate-800">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
