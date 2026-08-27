import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, DollarSign, Calendar, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Customer, Order, PaymentReceipt, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "./SearchableSelect";

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: Order[];
  initialCustomerId?: string;
  initialOrderId?: string;
  onPaymentSaved: (receipt: PaymentReceipt) => void;
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  orders = [],
  initialCustomerId = "",
  initialOrderId = "",
  onPaymentSaved,
}) => {
  const [selectedCustId, setSelectedCustId] = useState<string>(initialCustomerId);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId);
  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank Transfer" | "Cheque">("UPI");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (initialCustomerId) setSelectedCustId(initialCustomerId);
    if (initialOrderId) setSelectedOrderId(initialOrderId);
  }, [initialCustomerId, initialOrderId, isOpen]);

  if (!isOpen) return null;

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name || "Customer",
    subLabel: c.address || `${c.city || ""}, ${c.state || ""}`.trim(),
    badge: c.zone || "ZONE1",
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedCustId);

  // Orders belonging to the selected customer with open due balance
  const customerOrders = safeOrders.filter(
    (o) =>
      o.customer_id === selectedCustId ||
      (selectedCustomer && o.customer_name && o.customer_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
  );

  const selectedOrder = customerOrders.find(
    (o) => o.id === selectedOrderId || o.order_no === selectedOrderId
  );

  const orderOptions: SearchableOption[] = customerOrders.map((o) => {
    const totalAmt = o.total_amount || 0;
    const advance = o.advance_payment || 0;
    const paid = o.paid_amount || 0;
    const due = o.due_amount !== undefined ? o.due_amount : Math.max(0, totalAmt - advance - paid);

    return {
      value: o.id || o.order_no || "",
      label: `Bill / Order #${o.order_no || o.id}`,
      subLabel: `Date: ${o.order_date} • Remaining Due: ₹${due.toLocaleString()}`,
      badge: due === 0 ? "Paid" : `Due ₹${due}`,
    };
  });

  // Calculate current due on selected order
  const currentDueOnSelectedOrder = selectedOrder
    ? selectedOrder.due_amount !== undefined
      ? selectedOrder.due_amount
      : Math.max(
          0,
          (selectedOrder.total_amount || 0) -
            (selectedOrder.advance_payment || 0) -
            (selectedOrder.paid_amount || 0)
        )
    : 0;

  const handleFillFullAmount = () => {
    if (currentDueOnSelectedOrder > 0) {
      setAmount(currentDueOnSelectedOrder);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!selectedCustId || !selectedCustomer) {
      setErrorMsg("Please search and select a customer.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    setSubmitting(true);

    const newReceipt: Partial<PaymentReceipt> = {
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      order_id: selectedOrder?.id || selectedOrderId,
      order_no: selectedOrder?.order_no || selectedOrderId,
      receipt_date: receiptDate,
      amount: Number(amount),
      payment_mode: paymentMode,
      reference_no: referenceNo.trim(),
      notes: notes.trim(),
    };

    try {
      const saved = await SupabaseService.savePaymentReceipt(newReceipt);
      onPaymentSaved(saved);
      onClose();
    } catch (err: any) {
      console.error("Save receipt error:", err);
      setErrorMsg("Failed to save payment receipt. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
        >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00a651] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Receive Payment</h2>
              <p className="text-xs text-slate-500 font-medium">
                Record Cash, UPI, or Bank settlement for customer bills
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Customer* (Search & Select)
            </label>
            <SearchableSelect
              options={customerOptions}
              value={selectedCustId}
              onChange={(val) => {
                setSelectedCustId(val);
                setSelectedOrderId("");
                setErrorMsg("");
              }}
              placeholder="Search customer by name or location..."
            />
          </div>

          {/* Section 2: Bill Selection */}
          {selectedCustomer && (
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Link to Purchase Order / Bill (Optional)
              </label>
              <SearchableSelect
                options={orderOptions}
                value={selectedOrderId}
                onChange={(val) => {
                  setSelectedOrderId(val);
                  const chosenOrd = customerOrders.find(
                    (o) => o.id === val || o.order_no === val
                  );
                  if (chosenOrd) {
                    const due =
                      chosenOrd.due_amount !== undefined
                        ? chosenOrd.due_amount
                        : Math.max(
                            0,
                            (chosenOrd.total_amount || 0) -
                              (chosenOrd.advance_payment || 0) -
                              (chosenOrd.paid_amount || 0)
                          );
                    setAmount(due);
                  }
                }}
                placeholder="Select bill to apply payment..."
              />
            </div>
          )}

          {/* Bill Summary Alert Box */}
          {selectedOrder && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
              <div className="flex justify-between items-center font-bold">
                <span>Bill #{selectedOrder.order_no || selectedOrder.id} Details:</span>
                <span className="text-emerald-700">₹{(selectedOrder.total_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-800">
                <span>Advance + Payments Received:</span>
                <span>₹{((selectedOrder.advance_payment || 0) + (selectedOrder.paid_amount || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-extrabold text-amber-700 pt-1 border-t border-emerald-200/60">
                <span>Remaining Due Balance:</span>
                <span>₹{currentDueOnSelectedOrder.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Section 3: Receipt Date & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Receipt Date*
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-bold text-slate-700">
                  Amount Received (₹)*
                </label>
                {selectedOrder && currentDueOnSelectedOrder > 0 && (
                  <button
                    type="button"
                    onClick={handleFillFullAmount}
                    className="text-[10px] font-bold text-[#00a651] hover:underline"
                  >
                    Pay Full Due
                  </button>
                )}
              </div>
              <input
                type="number"
                step="any"
                placeholder="e.g. 5000"
                value={amount}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Section 4: Payment Mode & Reference/UTR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Payment Mode*
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="UPI">UPI (PhonePe / Google Pay / Paytm)</option>
                <option value="Cash">Cash Handover</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Reference / UTR / Cheque No
              </label>
              <input
                type="text"
                placeholder="e.g. UTR 423984102938"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono"
              />
            </div>
          </div>

          {/* Section 5: Remarks / Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Payment Remarks / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Received partial payment for order #ORD-0002"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 transition font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm disabled:opacity-55 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Save Payment Receipt"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  </AnimatePresence>
  );
};
