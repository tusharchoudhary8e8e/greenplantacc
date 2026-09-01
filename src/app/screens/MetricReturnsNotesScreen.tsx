import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Plus,
  Search,
  Calendar,
  User,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Customer,
  Order,
  PurchaseBill,
  SalesReturn,
  PurchaseReturn,
  SupabaseService,
} from "../../db/supabaseService";
import { CreateSalesReturnModal } from "../components/CreateSalesReturnModal";
import { CreatePurchaseReturnModal } from "../components/CreatePurchaseReturnModal";
import { printCreditNotePDF, printDebitNotePDF } from "../utils/notePdfGenerator";
import { PaginationControl } from "../components/PaginationControl";
import { roundCurrency } from "../utils/financialMath";

interface ReturnsNotesScreenProps {
  customers: Customer[];
  orders: Order[];
  purchaseBills: PurchaseBill[];
  onDataUpdated?: () => void;
}

export const MetricReturnsNotesScreen: React.FC<ReturnsNotesScreenProps> = ({
  customers = [],
  orders = [],
  purchaseBills = [],
  onDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"sales_returns" | "purchase_returns">("sales_returns");
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showSalesReturnModal, setShowSalesReturnModal] = useState(false);
  const [showPurchaseReturnModal, setShowPurchaseReturnModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sr, pr] = await Promise.all([
        SupabaseService.getSalesReturns(),
        SupabaseService.getPurchaseReturns(),
      ]);
      setSalesReturns(sr || []);
      setPurchaseReturns(pr || []);
    } catch (e) {
      console.error("Error loading returns data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSalesReturn = async (id: string, cnNo: string) => {
    if (window.confirm(`Delete Credit Note #${cnNo}? This will restore the customer's ledger balance.`)) {
      await SupabaseService.deleteSalesReturn(id);
      loadData();
      if (onDataUpdated) onDataUpdated();
    }
  };

  const handleDeletePurchaseReturn = async (id: string, dnNo: string) => {
    if (window.confirm(`Delete Debit Note #${dnNo}? This will restore the vendor's payable balance.`)) {
      await SupabaseService.deletePurchaseReturn(id);
      loadData();
      if (onDataUpdated) onDataUpdated();
    }
  };

  // Filtered lists
  const filteredSalesReturns = useMemo(() => {
    if (!searchTerm.trim()) return salesReturns;
    const q = searchTerm.trim().toLowerCase();
    return salesReturns.filter(
      (r) =>
        (r.credit_note_no || "").toLowerCase().includes(q) ||
        (r.customer_name || "").toLowerCase().includes(q) ||
        (r.order_no || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q)
    );
  }, [salesReturns, searchTerm]);

  const filteredPurchaseReturns = useMemo(() => {
    if (!searchTerm.trim()) return purchaseReturns;
    const q = searchTerm.trim().toLowerCase();
    return purchaseReturns.filter(
      (r) =>
        (r.debit_note_no || "").toLowerCase().includes(q) ||
        (r.party_name || "").toLowerCase().includes(q) ||
        (r.bill_no || "").toLowerCase().includes(q) ||
        (r.reason || "").toLowerCase().includes(q)
    );
  }, [purchaseReturns, searchTerm]);

  const activeList = activeTab === "sales_returns" ? filteredSalesReturns : filteredPurchaseReturns;
  const totalPages = Math.ceil(activeList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeList.slice(start, start + pageSize);
  }, [activeList, currentPage, pageSize]);

  // Aggregates
  const totalCreditAmount = useMemo(
    () => salesReturns.reduce((sum, r) => sum + (r.total_amount || 0), 0),
    [salesReturns]
  );
  const totalDebitAmount = useMemo(
    () => purchaseReturns.reduce((sum, r) => sum + (r.total_amount || 0), 0),
    [purchaseReturns]
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Returns &amp; Notes (CN / DN)</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Sales Returns (Credit Notes to Customers) &amp; Purchase Returns (Debit Notes to Suppliers)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSalesReturnModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00a651] text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Issue Credit Note (Sale Return)</span>
          </button>

          <button
            onClick={() => setShowPurchaseReturnModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Issue Debit Note (Purchase Return)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sales Returns (Credit Notes)
            </span>
            <div className="text-2xl font-black text-emerald-700">
              ₹{roundCurrency(totalCreditAmount).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{salesReturns.length} Credit Notes Issued</div>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Purchase Returns (Debit Notes)
            </span>
            <div className="text-2xl font-black text-blue-700">
              ₹{roundCurrency(totalDebitAmount).toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{purchaseReturns.length} Debit Notes Issued</div>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setActiveTab("sales_returns");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "sales_returns"
              ? "bg-[#00a651] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Sales Returns (Credit Notes) ({salesReturns.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("purchase_returns");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "purchase_returns"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Purchase Returns (Debit Notes) ({purchaseReturns.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              activeTab === "sales_returns"
                ? "Search customer, credit note no, order no..."
                : "Search vendor, debit note no, bill no..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <th className="py-3 px-4">NOTE NO &amp; DATE</th>
                <th className="py-3 px-4">
                  {activeTab === "sales_returns" ? "CUSTOMER NAME" : "SUPPLIER / VENDOR"}
                </th>
                <th className="py-3 px-4">
                  {activeTab === "sales_returns" ? "LINKED ORDER" : "LINKED BILL"}
                </th>
                <th className="py-3 px-4">RETURNED ITEMS</th>
                <th className="py-3 px-4 text-right">TOTAL AMOUNT</th>
                <th className="py-3 px-4 text-center">LEDGER STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeTab === "sales_returns" &&
                paginatedList.map((record) => {
                  const sr = record as SalesReturn;
                  return (
                    <tr key={sr.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-800 font-mono">#{sr.credit_note_no}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{sr.return_date}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{sr.customer_name}</td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {sr.order_no ? `#${sr.order_no}` : "-"}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {sr.items.map((it, iIdx) => (
                            <div key={iIdx} className="text-[11px]">
                              <span className="font-bold">{it.quantity?.toLocaleString("en-IN")}</span> × {it.product_name}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                        ₹{(sr.total_amount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Credited to Ledger
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => printCreditNotePDF(sr)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Print Credit Note PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSalesReturn(sr.id!, sr.credit_note_no)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Credit Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {activeTab === "purchase_returns" &&
                paginatedList.map((record) => {
                  const pr = record as PurchaseReturn;
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-blue-800 font-mono">#{pr.debit_note_no}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{pr.return_date}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{pr.party_name}</td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {pr.bill_no ? `#${pr.bill_no}` : "-"}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {pr.items.map((it, iIdx) => (
                            <div key={iIdx} className="text-[11px]">
                              <span className="font-bold">{it.quantity?.toLocaleString("en-IN")} {it.unit || ""}</span> × {it.product_name}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-blue-700 text-sm">
                        ₹{(pr.total_amount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          ✓ Debited from Payable
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => printDebitNotePDF(pr)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Print Debit Note PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchaseReturn(pr.id!, pr.debit_note_no)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Debit Note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {paginatedList.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {activeTab === "sales_returns"
                      ? "No Sales Returns (Credit Notes) recorded yet."
                      : "No Purchase Returns (Debit Notes) recorded yet."}
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
          totalItems={activeList.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Modals */}
      <CreateSalesReturnModal
        isOpen={showSalesReturnModal}
        onClose={() => setShowSalesReturnModal(false)}
        customers={customers}
        orders={orders}
        onReturnSaved={() => {
          loadData();
          if (onDataUpdated) onDataUpdated();
        }}
      />

      <CreatePurchaseReturnModal
        isOpen={showPurchaseReturnModal}
        onClose={() => setShowPurchaseReturnModal(false)}
        customers={customers}
        bills={purchaseBills}
        onReturnSaved={() => {
          loadData();
          if (onDataUpdated) onDataUpdated();
        }}
      />
    </div>
  );
};
