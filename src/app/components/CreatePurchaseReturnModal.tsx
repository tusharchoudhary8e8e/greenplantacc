import React, { useState, useEffect } from "react";
import { X, RotateCcw, AlertCircle, CheckCircle2, FileText, Printer, ShieldCheck } from "lucide-react";
import { Customer, PurchaseBill, PurchaseReturn, PurchaseReturnItem, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "./SearchableSelect";
import { roundCurrency } from "../utils/financialMath";
import { printDebitNotePDF } from "../utils/notePdfGenerator";

interface CreatePurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  bills: PurchaseBill[];
  initialPartyId?: string;
  initialBillId?: string;
  onReturnSaved: (savedReturn: PurchaseReturn) => void;
}

export const CreatePurchaseReturnModal: React.FC<CreatePurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  bills = [],
  initialPartyId = "",
  initialBillId = "",
  onReturnSaved,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialPartyId);
  const [selectedBillId, setSelectedBillId] = useState<string>(initialBillId);
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [debitNoteNo, setDebitNoteNo] = useState<string>(
    `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [generalReason, setGeneralReason] = useState<string>("");

  const [returnItems, setReturnItems] = useState<
    Array<{
      product_name: string;
      variant_name?: string;
      unit?: string;
      unit_price: number;
      original_qty: number;
      return_qty: number;
      return_reason: "damaged_defective" | "expired" | "substandard_quality" | "wrong_supply" | "other";
      selected: boolean;
    }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialPartyId) setSelectedPartyId(initialPartyId);
    if (initialBillId) setSelectedBillId(initialBillId);
  }, [initialPartyId, initialBillId, isOpen]);

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeBills = Array.isArray(bills) ? bills : [];

  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name,
    subLabel: `${c.phone || "No phone"} • ${c.city || ""}`.trim(),
    badge: c.size_category || "Vendor",
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedPartyId);

  // Bills for this vendor
  const vendorBills = safeBills.filter(
    (b) =>
      b.party_id === selectedPartyId ||
      (selectedCustomer && b.party_name?.toLowerCase() === selectedCustomer.name?.toLowerCase())
  );

  const billOptions: SearchableOption[] = vendorBills.map((b) => ({
    value: b.id || b.bill_no || "",
    label: `Purchase Bill #${b.bill_no || b.id}`,
    subLabel: `Date: ${b.bill_date} • Total: ₹${(b.total_amount || 0).toLocaleString("en-IN")}`,
    badge: b.status || "Bill",
  }));

  const selectedBill = vendorBills.find(
    (b) => b.id === selectedBillId || b.bill_no === selectedBillId
  );

  // When bill changes, populate returnItems
  useEffect(() => {
    if (selectedBill && selectedBill.items && selectedBill.items.length > 0) {
      setReturnItems(
        selectedBill.items.map((it) => ({
          product_name: it.product_name,
          variant_name: it.variant_name || "",
          unit: it.unit || "Units",
          unit_price: it.price || 0,
          original_qty: it.quantity || 0,
          return_qty: 0,
          return_reason: "damaged_defective",
          selected: false,
        }))
      );
    } else {
      setReturnItems([]);
    }
  }, [selectedBillId, selectedBill]);

  if (!isOpen) return null;

  // Calculate total debit return amount
  const totalReturnAmount = roundCurrency(
    returnItems
      .filter((i) => i.selected && i.return_qty > 0)
      .reduce((sum, i) => sum + i.return_qty * i.unit_price, 0)
  );

  const handleSubmit = async (e: React.FormEvent, andPrint = false) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!selectedPartyId && !selectedBill?.party_name) {
      setErrorMsg("Please select a vendor / supplier.");
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
        setErrorMsg(`Return qty for ${it.product_name} cannot exceed original purchased qty (${it.original_qty}).`);
        return;
      }
    }

    setSubmitting(true);

    const payloadItems: PurchaseReturnItem[] = activeItems.map((it) => ({
      product_name: it.product_name,
      variant_name: it.variant_name,
      unit: it.unit,
      quantity: it.return_qty,
      unit_price: it.unit_price,
      return_reason: it.return_reason,
      line_total: roundCurrency(it.return_qty * it.unit_price),
    }));

    const purchaseReturnPayload: Partial<PurchaseReturn> = {
      debit_note_no: debitNoteNo,
      bill_id: selectedBill?.id || selectedBillId,
      bill_no: selectedBill?.bill_no || selectedBillId,
      party_id: selectedCustomer?.id || selectedPartyId,
      party_name: selectedCustomer?.name || selectedBill?.party_name || "Supplier",
      return_date: returnDate,
      total_amount: totalReturnAmount,
      refund_status: "adjusted_in_ledger",
      reason: generalReason || "Defective goods / Expired seeds / Damaged trays",
      items: payloadItems,
    };

    try {
      const saved = await SupabaseService.savePurchaseReturn(purchaseReturnPayload);
      onReturnSaved(saved);
      if (andPrint) {
        printDebitNotePDF(saved);
      }
      onClose();
    } catch (err) {
      console.error("Save purchase return error:", err);
      setErrorMsg("Failed to save Debit Note. Please try again.");
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
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Issue Purchase Return (Debit Note)</h2>
              <p className="text-xs text-slate-500 font-medium">
                Record returned raw materials/plants &amp; reduce payable balance owed to supplier
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

          {/* Row 1: Supplier & Linked Bill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Supplier / Nursery / Vendor*
              </label>
              <SearchableSelect
                options={customerOptions}
                value={selectedPartyId}
                onChange={(val) => {
                  setSelectedPartyId(val);
                  setSelectedBillId("");
                }}
                placeholder="Search vendor / supplier..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Linked Purchase Bill*
              </label>
              <SearchableSelect
                options={billOptions}
                value={selectedBillId}
                onChange={(val) => setSelectedBillId(val)}
                placeholder="Select purchase bill..."
              />
            </div>
          </div>

          {/* Row 2: Debit Note No & Return Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Debit Note No*
              </label>
              <input
                type="text"
                value={debitNoteNo}
                onChange={(e) => setDebitNoteNo(e.target.value)}
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
                placeholder="e.g. 50 plastic trays cracked / defective"
                value={generalReason}
                onChange={(e) => setGeneralReason(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50"
              />
            </div>
          </div>

          {/* Row 3: Items Breakdown Table */}
          <div className="space-y-2 pt-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Select Materials / Plants Returned:
            </label>

            {returnItems.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-50 px-3 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-slate-500">
                  <div className="col-span-1 text-center">SELECT</div>
                  <div className="col-span-4">MATERIAL / ITEM</div>
                  <div className="col-span-2 text-right">PURCHASED</div>
                  <div className="col-span-2 text-right">RETURN QTY</div>
                  <div className="col-span-3 text-right">DEBIT (₹)</div>
                </div>

                {returnItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-3 grid grid-cols-12 gap-2 items-center transition ${
                      item.selected ? "bg-blue-50/40" : "hover:bg-slate-50/50"
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
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="col-span-4">
                      <div className="font-bold text-slate-800">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400">{item.variant_name || item.unit || "Nursery Supply"}</div>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="font-medium text-slate-600">{item.original_qty.toLocaleString("en-IN")} {item.unit || ""}</div>
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
                      <span className="font-extrabold text-blue-700 text-sm">
                        ₹{(roundCurrency((item.return_qty || 0) * item.unit_price)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                {selectedBillId ? "No line items found in this purchase bill." : "Please select a purchase bill above to view materials."}
              </div>
            )}
          </div>

          {/* Total Summary Bar */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <div>
                <div className="text-xs font-bold text-blue-900">Total Debit Amount from Supplier Payable:</div>
                <div className="text-[10px] text-blue-700">Will reduce what you owe {selectedCustomer?.name || selectedBill?.party_name || "Supplier"}</div>
              </div>
            </div>
            <div className="text-xl font-black text-blue-800">
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
            <span>Save &amp; Print Debit Note</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting || totalReturnAmount === 0}
            className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Saving..." : "Issue Debit Note"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
