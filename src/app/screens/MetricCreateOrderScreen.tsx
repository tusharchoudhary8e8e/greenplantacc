import React, { useState, useEffect } from "react";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  Plus,
  X,
  Link as LinkIcon,
  CheckCircle,
  Printer,
  CreditCard,
  Sprout,
  AlertCircle,
} from "lucide-react";
import { Customer, Product, Order, OrderItem, ProductionBatch, BankAccount, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "../components/SearchableSelect";
import { printReceiptPDF } from "../utils/receiptPdfGenerator";
import { calculateOrderTotals, roundCurrency, formatCurrencyINR } from "../utils/financialMath";

interface CreateOrderProps {
  customers: Customer[];
  products: Product[];
  batches?: ProductionBatch[];
  editingOrder?: Order | null;
  onOrderSaved: (newOrder: Order) => void;
  onCancel: () => void;
}

export const MetricCreateOrderScreen: React.FC<CreateOrderProps> = ({
  customers = [],
  products = [],
  batches = [],
  editingOrder = null,
  onOrderSaved,
  onCancel,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    editingOrder?.customer_id || ""
  );
  const [orderDate, setOrderDate] = useState<string>(
    editingOrder?.order_date || new Date().toISOString().split("T")[0]
  );
  const [transportCharge, setTransportCharge] = useState<string>(
    editingOrder?.transport_charge ? String(editingOrder.transport_charge) : ""
  );
  const [advancePayment, setAdvancePayment] = useState<string>(
    editingOrder?.advance_payment ? String(editingOrder.advance_payment) : ""
  );
  const [focAmount, setFocAmount] = useState<string>(
    editingOrder?.foc_amount ? String(editingOrder.foc_amount) : ""
  );
  const [paymentType, setPaymentType] = useState<string>("Cash");
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [items, setItems] = useState<OrderItem[]>(
    editingOrder?.items && editingOrder.items.length > 0
      ? editingOrder.items
      : [
          {
            product_name: "",
            variant_name: "",
            price: 0,
            quantity: 0,
            dispatch_from: new Date().toISOString().split("T")[0],
            dispatch_to: new Date().toISOString().split("T")[0],
            sowing_date: new Date().toISOString().split("T")[0],
            remaining_qty: 0,
          },
        ]
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const list = await SupabaseService.getBankAccounts();
        setBankAccounts(list || []);
      } catch {}
    };
    fetchBanks();
  }, []);

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name,
    subLabel: `${c.phone || "No phone"} • ${c.city || "No city"} ${c.zone ? `(${c.zone})` : ""}`.trim(),
    badge: c.size_category || "Customer",
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedCustomerId);

  const productOptions: SearchableOption[] = safeProducts.map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: `${p.variants?.length || 0} varieties`,
    badge: p.category || "Crop",
  }));

  // Calculate Order Totals with exact 2-decimal GAAP banker's precision
  const rawTransportVal = parseFloat(transportCharge) || 0;
  const rawAdvanceVal = parseFloat(advancePayment) || 0;
  const rawFocVal = parseFloat(focAmount) || 0;

  const {
    itemsTotal,
    transportVal,
    focVal,
    advanceVal,
    netGrandTotal: netTotalAmount,
    dueBalanceAmount,
  } = calculateOrderTotals(
    items.map((i) => ({ price: i.price || 0, quantity: i.quantity || 0 })),
    rawTransportVal,
    rawFocVal,
    rawAdvanceVal
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!selectedCustomerId || !selectedCustomer) {
      setErrorMsg("Please search and select a customer before saving the order.");
      return;
    }

    if (items.length === 0 || items.some((i) => !i.product_name || !i.quantity)) {
      setErrorMsg("Please ensure all line items have a selected crop and a quantity.");
      return;
    }

    setSubmitting(true);

    const ordPayload: Order = {
      ...(editingOrder ? editingOrder : {}),
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      order_date: orderDate,
      transport_charge: transportVal,
      advance_payment: advanceVal,
      foc_amount: focVal,
      items_total: itemsTotal,
      total_amount: netTotalAmount,
      due_amount: dueBalanceAmount,
      items: items,
    };

    try {
      let saved: Order;
      if (editingOrder && editingOrder.id) {
        saved = await SupabaseService.updateOrder(ordPayload);
      } else {
        saved = await SupabaseService.createOrder(ordPayload);
      }
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
        <h2 className="text-xl font-bold text-slate-800">
          {editingOrder ? `Edit Order: ${editingOrder.order_no || editingOrder.id}` : "Create Order"}
        </h2>
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
              value={selectedCustomerId}
              onChange={(val) => {
                setSelectedCustomerId(val);
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
                {/* Smart Stock Allocation Alert Banner */}
                {(() => {
                  const matchingSurplusBatch = (batches || []).find((b) => {
                    if (!b.product_name || !item.product_name) return false;
                    const isProdMatch = b.product_name.toLowerCase() === item.product_name.toLowerCase();
                    const isVarMatch =
                      !item.variant_name ||
                      (b.variant_name || "").toLowerCase() === item.variant_name.toLowerCase();
                    return isProdMatch && isVarMatch && (b.surplus_quantity || 0) > 0;
                  });

                  if (!matchingSurplusBatch || !item.product_name || !(item.quantity > 0)) return null;

                  const daysElapsed = Math.max(
                    0,
                    Math.floor(
                      (new Date().getTime() - new Date(matchingSurplusBatch.sowing_date || "").getTime()) /
                        (1000 * 3600 * 24)
                    )
                  );
                  const daysRemaining = Math.max(
                    0,
                    (matchingSurplusBatch.maturity_days || 30) - daysElapsed
                  );

                  return (
                    <div className="p-3.5 bg-emerald-950 text-emerald-100 rounded-xl text-xs space-y-2 border border-emerald-800 shadow-md">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-extrabold text-amber-300">
                            💡 Existing In-Progress Stock Found!
                          </span>
                        </div>
                        <span className="bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded font-mono text-[11px] border border-amber-400/30 font-bold">
                          🌱 {(matchingSurplusBatch.surplus_quantity || 0).toLocaleString()} extra plants available
                        </span>
                      </div>

                      <p className="text-[11px] text-emerald-200 leading-relaxed">
                        Batch <strong className="text-white">#{matchingSurplusBatch.batch_code || matchingSurplusBatch.batch_no}</strong> was sowed <strong className="text-white">{daysElapsed} days ago</strong> on {matchingSurplusBatch.sowing_date}. 
                        It will be fully germinated in <strong className="text-amber-300 font-extrabold">{daysRemaining} days remaining</strong> (Ready on {matchingSurplusBatch.end_date}).
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            updateItemRow(idx, "batch_id", matchingSurplusBatch.id);
                            updateItemRow(idx, "status", "sowing_done");
                            alert(
                              `Allocated ${item.quantity.toLocaleString()} plants from Batch #${
                                matchingSurplusBatch.batch_code || matchingSurplusBatch.batch_no
                              }! Plants will be ready in ${daysRemaining} days (on ${matchingSurplusBatch.end_date}).`
                            );
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4 text-slate-950" />
                          <span>Reserve {item.quantity.toLocaleString()} plants from Existing Batch #{matchingSurplusBatch.batch_code || matchingSurplusBatch.batch_no}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
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
                      onWheel={(e) => e.currentTarget.blur()}
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
                        updateItemRow(idx, "quantity", Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Line Total */}
                  <div className="md:col-span-2 space-y-1 text-right">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Line Total
                    </label>
                    <div className="py-2.5 font-mono font-extrabold text-slate-800 text-sm">
                      ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Dispatch Window */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Dispatch Window (From &amp; To)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
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

                  {/* Sowing Date */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Estimated Sowing Date
                    </label>
                    <input
                      type="date"
                      value={item.sowing_date || orderDate}
                      onChange={(e) => updateItemRow(idx, "sowing_date", e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-5 flex items-center justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
          Add Crop Item
        </button>
      </div>

      {/* Section 3: Order Payment & Payment Method */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
          Order Payment &amp; Payment Method
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Payment Method *
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
            >
              <option value="Cash">💵 Cash</option>
              <option value="UPI / PhonePe / GPay">📱 UPI / PhonePe / GPay</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.account_name}>
                  🏦 {b.account_name}
                </option>
              ))}
              <option value="custom">➕ Add Payment Method...</option>
            </select>
            {paymentType === "custom" && (
              <input
                type="text"
                placeholder="Enter payment mode (e.g. Paytm, Cheque)"
                value={customPaymentMethod}
                onChange={(e) => setCustomPaymentMethod(e.target.value)}
                className="w-full p-2.5 mt-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Transport Charge (₹)
            </label>
            <input
              type="number"
              placeholder="eg. 1500"
              value={transportCharge}
              onWheel={(e) => e.currentTarget.blur()}
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
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => setAdvancePayment(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              FOC Discount (₹)
            </label>
            <input
              type="number"
              placeholder="eg. 750"
              value={focAmount}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) => setFocAmount(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>

        {/* Live Totals Summary Breakdown Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Items Subtotal</span>
              <span className="font-bold text-slate-800 text-sm">₹{itemsTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Transport (+)</span>
              <span className="font-bold text-blue-600 text-sm">+₹{transportVal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">FOC Discount (-)</span>
              <span className="font-bold text-red-600 text-sm">-₹{focVal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Advance Paid (-)</span>
              <span className="font-bold text-emerald-600 text-sm">-₹{advanceVal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
            <div>
              <div className="text-xs text-slate-500 font-medium">Balance Due Amount</div>
              <div className="text-xl font-extrabold text-amber-600">
                ₹{dueBalanceAmount.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Net Grand Total</div>
              <div className="text-2xl font-extrabold text-emerald-700">
                ₹{netTotalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#f58220] hover:bg-[#e07010] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Save &amp; Print PDF Receipt</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#1e4d2b] hover:bg-[#163d21] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{editingOrder ? "Update Order" : "Save Order"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
