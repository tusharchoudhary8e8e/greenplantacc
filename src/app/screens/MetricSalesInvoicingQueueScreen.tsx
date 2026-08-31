import React, { useState, useMemo } from "react";
import {
  FileCheck,
  CheckSquare,
  Square,
  Search,
  ArrowRight,
  Receipt,
  RotateCcw,
  Sparkles,
  Calendar,
  User,
  Truck,
  CheckCircle2,
  AlertCircle,
  Edit,
  X,
  Eye,
} from "lucide-react";
import { Order, Customer, SupabaseService } from "../../db/supabaseService";
import { PaginationControl } from "../components/PaginationControl";
import { roundCurrency } from "../utils/financialMath";

interface SalesInvoicingQueueProps {
  orders: Order[];
  customers: Customer[];
  onOrdersUpdated: () => void;
}

export const MetricSalesInvoicingQueueScreen: React.FC<SalesInvoicingQueueProps> = ({
  orders,
  customers,
  onOrdersUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "posted">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Single Order Review & Adjust Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [customInvoiceNo, setCustomInvoiceNo] = useState("");
  const [adjTransport, setAdjTransport] = useState<number>(0);
  const [adjTotal, setAdjTotal] = useState<number>(0);
  const [adjNarration, setAdjNarration] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter Orders into Pending (Uninvoiced) vs Posted (Invoiced)
  const pendingOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        !o.is_invoiced &&
        !o.posted_to_ledger &&
        o.status !== "invoiced" &&
        o.status !== "cancelled"
    );
  }, [orders]);

  const postedOrders = useMemo(() => {
    return orders.filter(
      (o) => o.is_invoiced || o.posted_to_ledger || o.status === "invoiced"
    );
  }, [orders]);

  const activeList = activeSubTab === "pending" ? pendingOrders : postedOrders;

  // Search Filter
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return activeList;
    const q = searchTerm.trim().toLowerCase();
    return activeList.filter(
      (o) =>
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.order_no || "").toLowerCase().includes(q) ||
        (o.invoice_no || "").toLowerCase().includes(q) ||
        (o.narration || "").toLowerCase().includes(q) ||
        (o.items || []).some((it) => (it.product_name || "").toLowerCase().includes(q))
    );
  }, [activeList, searchTerm]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Select / Deselect Logic
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredList.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredList.map((o) => o.id || o.order_no || ""));
    }
  };

  // Calculate Selected Totals
  const selectedTotals = useMemo(() => {
    const selected = pendingOrders.filter((o) =>
      selectedOrderIds.includes(o.id || o.order_no || "")
    );
    const count = selected.length;
    const amount = selected.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return { count, amount: roundCurrency(amount) };
  }, [pendingOrders, selectedOrderIds]);

  // Bulk Post Action
  const handleBulkPost = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsPosting(true);
    try {
      await SupabaseService.postOrdersToLedger(selectedOrderIds);
      setSuccessMsg(`Successfully generated ${selectedOrderIds.length} Sales Invoices & posted to Party Ledgers!`);
      setSelectedOrderIds([]);
      onOrdersUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error("Bulk posting error:", e);
    } finally {
      setIsPosting(false);
    }
  };

  // Single Order Post Action
  const handleSinglePost = async (ord: Order) => {
    const id = ord.id || ord.order_no;
    if (!id) return;
    setIsPosting(true);
    try {
      await SupabaseService.postOrdersToLedger([id]);
      setSuccessMsg(`Order #${ord.order_no} posted to Sales Ledger for ${ord.customer_name}!`);
      onOrdersUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error("Single post error:", e);
    } finally {
      setIsPosting(false);
    }
  };

  // Open Review & Adjust Modal
  const openReviewModal = (ord: Order) => {
    setReviewOrder(ord);
    setCustomInvoiceNo(
      ord.invoice_no || `INV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
    );
    setAdjTransport(ord.transport_charge || 0);
    setAdjTotal(ord.total_amount || 0);
    setAdjNarration(ord.narration || "");
  };

  // Confirm Adjusted Post
  const handleConfirmAdjustedPost = async () => {
    if (!reviewOrder) return;
    const id = reviewOrder.id || reviewOrder.order_no;
    if (!id) return;

    setIsPosting(true);
    try {
      await SupabaseService.postOrdersToLedger([id], {
        [id]: {
          invoice_no: customInvoiceNo,
          transport_charge: adjTransport,
          total_amount: adjTotal,
          narration: adjNarration,
        },
      });
      setSuccessMsg(`Invoice #${customInvoiceNo} posted to ${reviewOrder.customer_name}'s Ledger!`);
      setReviewOrder(null);
      onOrdersUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.error("Adjusted post error:", e);
    } finally {
      setIsPosting(false);
    }
  };

  // Revert / Unpost Action
  const handleRevert = async (ord: Order) => {
    const id = ord.id || ord.order_no;
    if (!id) return;
    if (window.confirm(`Unpost Sales Invoice #${ord.invoice_no || ord.order_no} and return to draft queue?`)) {
      setIsPosting(true);
      await SupabaseService.revertOrderFromLedger(id);
      setSuccessMsg(`Invoice #${ord.invoice_no || ord.order_no} unposted and returned to queue.`);
      onOrdersUpdated();
      setTimeout(() => setSuccessMsg(null), 4000);
      setIsPosting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Post Orders to Sales & Ledger</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Booked orders remain provisional notes. Select and convert orders here to generate official Sales Invoices and post to Party Ledgers.
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <div className="text-[10px] uppercase font-bold text-amber-600">Awaiting Invoicing</div>
            <div className="text-sm font-extrabold">{pendingOrders.length} Orders</div>
          </div>
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
            <div className="text-[10px] uppercase font-bold text-emerald-600">Posted Invoices</div>
            <div className="text-sm font-extrabold">{postedOrders.length} Invoices</div>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub Tabs: Awaiting Invoicing vs Posted Invoices */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveSubTab("pending");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "pending"
              ? "bg-[#00a651] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Awaiting Invoicing Queue ({pendingOrders.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("posted");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "posted"
              ? "bg-slate-800 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Posted Sales Invoices ({postedOrders.length})</span>
        </button>
      </div>

      {/* Bulk Action & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search party name, order no, crop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        {/* Bulk Action Controls (Only for Pending Queue) */}
        {activeSubTab === "pending" && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              {selectedOrderIds.length === filteredList.length && filteredList.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({filteredList.length})</span>
            </button>

            {selectedTotals.count > 0 && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="font-bold text-emerald-800">
                  {selectedTotals.count} selected • ₹{selectedTotals.amount.toLocaleString("en-IN")}
                </span>
                <button
                  onClick={handleBulkPost}
                  disabled={isPosting}
                  className="px-3.5 py-1 bg-[#00a651] text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPosting ? "Posting..." : `Post to Sales & Ledger`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                {activeSubTab === "pending" && <th className="py-3 px-4 w-10 text-center">SELECT</th>}
                <th className="py-3 px-4">ORDER / INVOICE NO</th>
                <th className="py-3 px-4">CUSTOMER / PARTY</th>
                <th className="py-3 px-4">BOOKED CROPS & QUANTITY</th>
                <th className="py-3 px-4 text-right">TOTAL AMOUNT</th>
                <th className="py-3 px-4 text-right">ADVANCE PAID</th>
                <th className="py-3 px-4 text-center">LEDGER STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedList.map((ord) => {
                const ordKey = ord.id || ord.order_no || "";
                const isSelected = selectedOrderIds.includes(ordKey);

                return (
                  <tr
                    key={ordKey}
                    className={`hover:bg-slate-50/80 transition ${
                      isSelected ? "bg-emerald-50/40" : ""
                    }`}
                  >
                    {/* Checkbox for Pending Orders */}
                    {activeSubTab === "pending" && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(ordKey)}
                          className="cursor-pointer text-slate-400 hover:text-emerald-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}

                    {/* Order / Invoice No */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {activeSubTab === "posted" ? ord.invoice_no || ord.order_no : `#${ord.order_no}`}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{ord.order_date}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{ord.customer_name}</div>
                      {ord.narration && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{ord.narration}</div>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4">
                      {ord.items && ord.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700">
                              <span className="font-bold">{it.quantity?.toLocaleString("en-IN")}</span> × {it.product_name} {it.variant_name ? `(${it.variant_name})` : ""}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No items listed</span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{(ord.total_amount || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Advance Paid */}
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      ₹{(ord.advance_payment || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      {activeSubTab === "pending" ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⏳ Provisional Note (₹0 Ledger)
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Posted to Ledger
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {activeSubTab === "pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSinglePost(ord)}
                            disabled={isPosting}
                            className="px-2.5 py-1 bg-[#00a651] text-white rounded-lg text-[11px] font-bold hover:bg-emerald-600 transition shadow-xs cursor-pointer flex items-center gap-1"
                            title="Post directly to Customer Ledger"
                          >
                            <span>Post</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => openReviewModal(ord)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Review & Adjust before posting"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRevert(ord)}
                            disabled={isPosting}
                            className="px-2 py-1 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Unpost from Ledger"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Unpost</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    {activeSubTab === "pending"
                      ? "🎉 All orders have been posted to Sales & Ledger! No pending orders."
                      : "No posted sales invoices found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredList.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Review & Adjust Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Review & Post Sales Invoice: #{reviewOrder.order_no}
                </h3>
              </div>
              <button
                onClick={() => setReviewOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
              <div>
                <strong>Customer:</strong> {reviewOrder.customer_name}
              </div>
              <div>
                <strong>Booking Date:</strong> {reviewOrder.order_date}
              </div>
              <div>
                <strong>Items:</strong>{" "}
                {(reviewOrder.items || [])
                  .map((it) => `${it.quantity} × ${it.product_name}`)
                  .join(", ")}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Invoice Number:
                </label>
                <input
                  type="text"
                  value={customInvoiceNo}
                  onChange={(e) => setCustomInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Transport Charge (₹):
                  </label>
                  <input
                    type="number"
                    value={adjTransport}
                    onChange={(e) => {
                      const tr = parseFloat(e.target.value) || 0;
                      setAdjTransport(tr);
                      setAdjTotal((reviewOrder.items_total || 0) + tr);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Final Invoice Total (₹):
                  </label>
                  <input
                    type="number"
                    value={adjTotal}
                    onChange={(e) => setAdjTotal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Narration / Notes:
                </label>
                <input
                  type="text"
                  value={adjNarration}
                  onChange={(e) => setAdjNarration(e.target.value)}
                  placeholder="e.g. Delivered 10,000 saplings via Truck MH-14-1234"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReviewOrder(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdjustedPost}
                disabled={isPosting}
                className="px-5 py-2 bg-[#00a651] text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isPosting ? "Posting..." : "Confirm & Post to Ledger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
