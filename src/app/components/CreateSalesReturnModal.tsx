import React, { useState, useEffect } from "react";
import { X, RotateCcw, AlertCircle, CheckCircle2, FileText, Printer, ShieldCheck } from "lucide-react";
import { Customer, Order, SalesReturn, SalesReturnItem, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "./SearchableSelect";
import { roundCurrency } from "../utils/financialMath";
import { printCreditNotePDF } from "../utils/notePdfGenerator";

interface CreateSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: Order[];
  initialCustomerId?: string;
  initialOrderId?: string;
  onReturnSaved: (savedReturn: SalesReturn) => void;
}

export const CreateSalesReturnModal: React.FC<CreateSalesReturnModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  orders = [],
  initialCustomerId = "",
  initialOrderId = "",
  onReturnSaved,
}) => {
  const [selectedCustId, setSelectedCustId] = useState<string>(initialCustomerId);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [creditNoteNo, setCreditNoteNo] = useState<string>(
    `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [generalReason, setGeneralReason] = useState<string>("");

  const [returnItems, setReturnItems] = useState<
    Array<{
      product_name: string;
      variant_name?: string;
      unit_price: number;
      original_qty: number;
      return_qty: number;
      return_reason: "damaged_in_transit" | "disease_wilted" | "wrong_variety" | "excess_unsold" | "other";
      restock_action: "restock_to_inventory" | "write_off_loss";
      selected: boolean;
    }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialCustomerId) setSelectedCustId(initialCustomerId);
    if (initialOrderId) setSelectedOrderId(initialOrderId);
  }, [initialCustomerId, initialOrderId, isOpen]);

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name,
    subLabel: `${c.phone || "No phone"} • ${c.city || ""}`.trim(),
    badge: c.size_category || "Customer",
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedCustId);

  // Orders for this customer
  const customerOrders = safeOrders.filter(
    (o) =>
      o.customer_id === selectedCustId ||
      (selectedCustomer && o.customer_name?.toLowerCase() === selectedCustomer.name?.toLowerCase())
  );

  const orderOptions: SearchableOption[] = customerOrders.map((o) => ({
    value: o.id || o.order_no || "",
    label: `Order #${o.order_no || o.id}`,
    subLabel: `Date: ${o.order_date} • Total: ₹${(o.total_amount || 0).toLocaleString("en-IN")}`,
    badge: o.is_invoiced ? "Invoiced" : "Booked",
  }));

  const selectedOrder = customerOrders.find(
    (o) => o.id === selectedOrderId || o.order_no === selectedOrderId
  );

  // When order changes, populate returnItems
  useEffect(() => {
    if (selectedOrder && selectedOrder.items && selectedOrder.items.length > 0) {
      setReturnItems(
        selectedOrder.items.map((it) => ({
          product_name: it.product_name,
          variant_name: it.variant_name || "",
          unit_price: it.price || 0,
          original_qty: it.quantity || 0,
          return_qty: 0,
          return_reason: "damaged_in_transit",
          restock_action: "write_off_loss",
          selected: false,
        }))
      );
    } else {
      setReturnItems([]);
    }
  }, [selectedOrderId, selectedOrder]);

  if (!isOpen) return null;

  // Calculate total return amount
  const totalReturnAmount = roundCurrency(
    returnItems
      .filter((i) => i.selected && i.return_qty > 0)
      .reduce((sum, i) => sum + i.return_qty * i.unit_price, 0)
  );

  const handleSubmit = async (e: React.FormEvent, andPrint = false) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!selectedCustId || !selectedCustomer) {
      setErrorMsg("Please select a customer.");
      return;
    }

    const activeItems = returnItems.filter((i) => i.selected && i.return_qty > 0);
    if (activeItems.length === 0) {
      setErrorMsg("Please select at least 1 item to return and enter a valid return quantity.");
      return;
    }

    // Validate quantities
    for (const it of activeItems) {
      if (it.return_qty > it.original_qty) {
        setErrorMsg(`Return qty for ${it.product_name} cannot exceed original booked qty (${it.original_qty}).`);
        return;
      }
    }

    setSubmitting(true);

    const payloadItems: SalesReturnItem[] = activeItems.map((it) => ({
      product_name: it.product_name,
      variant_name: it.variant_name,
      quantity: it.return_qty,
      unit_price: it.unit_price,
      return_reason: it.return_reason,
      restock_action: it.restock_action,
      line_total: roundCurrency(it.return_qty * it.unit_price),
    }));

    const salesReturnPayload: Partial<SalesReturn> = {
      credit_note_no: creditNoteNo,
      order_id: selectedOrder?.id || selectedOrderId,
      order_no: selectedOrder?.order_no || selectedOrderId,
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      return_date: returnDate,
      total_amount: totalReturnAmount,
      refund_status: "adjusted_in_ledger",
      reason: generalReason || "Plant transit return / mortality",
      items: payloadItems,
    };

    try {
      const saved = await SupabaseService.saveSalesReturn(salesReturnPayload);
      onReturnSaved(saved);
      if (andPrint) {
        printCreditNotePDF(saved);
      }
      onClose();
    } catch (err) {
      console.error("Save sales return error:", err);
      setErrorMsg("Failed to save Credit Note. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn font-sans">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Issue Sales Return (Credit Note)</h2>
              <p className="text-xs text-slate-500 font-medium">
                Record returned/damaged plants &amp; credit customer's party ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Customer & Linked Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer Name*
              </label>
              <SearchableSelect
                options={customerOptions}
                value={selectedCustId}
                onChange={(val) => {
                  setSelectedCustId(val);
                  setSelectedOrderId("");
                }}
                placeholder="Search customer..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Linked Sales Order / Bill*
              </label>
              <SearchableSelect
                options={orderOptions}
                value={selectedOrderId}
                onChange={(val) => setSelectedOrderId(val)}
                placeholder="Select order to return from..."
              />
            </div>
          </div>

          {/* Row 2: Credit Note No & Return Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Credit Note No*
              </label>
              <input
                type="text"
                value={creditNoteNo}
                onChange={(e) => setCreditNoteNo(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Return Date*
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Return Reason Summary
              </label>
              <input
                type="text"
                placeholder="e.g. 500 saplings crushed in transit"
                value={generalReason}
                onChange={(e) => setGeneralReason(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50"
              />
            </div>
          </div>

          {/* Row 3: Items Breakdown Table */}
          <div className="space-y-2 pt-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Select Plants / Items Returned:
            </label>

            {returnItems.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-3 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-slate-500">
                  <div className="col-span-1 text-center">SELECT</div>
                  <div className="col-span-4">PLANT / VARIETY</div>
                  <div className="col-span-2 text-right">BOOKED / RATE</div>
                  <div className="col-span-2 text-right">RETURN QTY</div>
                  <div className="col-span-3 text-right">CREDIT (₹)</div>
                </div>

                {returnItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-3 grid grid-cols-12 gap-2 items-center transition ${
                      item.selected ? "bg-emerald-50/40" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="col-span-1 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[idx].selected = e.target.checked;
                          if (e.target.checked && updated[idx].return_qty === 0) {
                            updated[idx].return_qty = updated[idx].original_qty;
                          }
                          setReturnItems(updated);
                        }}
                        className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="col-span-4">
                      <div className="font-bold text-slate-800">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400">{item.variant_name || "Standard Variety"}</div>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="font-medium text-slate-600">{item.original_qty.toLocaleString("en-IN")} Plants</div>
                      <div className="text-[10px] text-slate-400">@ ₹{item.unit_price}</div>
                    </div>

                    <div className="col-span-2 text-right">
                      <input
                        type="number"
                        disabled={!item.selected}
                        value={item.return_qty || ""}
                        onChange={(e) => {
                          const updated = [...returnItems];
                          updated[idx].return_qty = parseFloat(e.target.value) || 0;
                          setReturnItems(updated);
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs font-bold text-right disabled:bg-slate-100 bg-white"
                        placeholder="Qty"
                        max={item.original_qty}
                      />
                    </div>

                    <div className="col-span-3 text-right">
                      <span className="font-extrabold text-emerald-700 text-sm">
                        ₹{(roundCurrency((item.return_qty || 0) * item.unit_price)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                {selectedOrderId ? "No line items found in this order." : "Please select a sales order above to view line items."}
              </div>
            )}
          </div>

          {/* Total Summary Bar */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <div className="text-xs font-bold text-emerald-900">Total Credit Amount to Customer Ledger:</div>
                <div className="text-[10px] text-emerald-700">Will reduce {selectedCustomer?.name || "Customer"}'s balance due</div>
              </div>
            </div>
            <div className="text-xl font-black text-emerald-800">
              ₹{totalReturnAmount.toLocaleString("en-IN")}
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting || totalReturnAmount === 0}
            className="w-full sm:w-auto px-4 py-2 bg-[#f58220] hover:bg-[#e07010] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Save &amp; Print Credit Note</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting || totalReturnAmount === 0}
            className="w-full sm:w-auto px-5 py-2 bg-[#00a651] hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Saving..." : "Issue Credit Note"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
