import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Plus,
  Filter,
  Calendar,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Percent,
  Receipt,
  Download,
} from "lucide-react";
import { PurchaseBill, Customer, SupabaseService } from "../../db/supabaseService";
import { PaginationControl } from "../components/PaginationControl";

interface PurchaseBillsScreenProps {
  bills: PurchaseBill[];
  customers: Customer[];
  onCreateBill: () => void;
  onEditBill?: (bill: PurchaseBill) => void;
  onDeleteBill?: (billId: string) => void;
  onViewLedger?: (partyId: string) => void;
}

export const MetricPurchaseBillsScreen: React.FC<PurchaseBillsScreenProps> = ({
  bills = [],
  customers = [],
  onCreateBill,
  onEditBill,
  onDeleteBill,
  onViewLedger,
}) => {
  const safeBills = Array.isArray(bills) ? bills : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedBillIds, setExpandedBillIds] = useState<Record<string, boolean>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, fromDate, toDate]);

  const toggleExpand = (id: string) => {
    setExpandedBillIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter bills
  const filteredBills = useMemo(() => {
    return safeBills.filter((b) => {
      const matchesSearch =
        (b.bill_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.party_name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter;

      let matchesDate = true;
      if (fromDate && b.bill_date < fromDate) matchesDate = false;
      if (toDate && b.bill_date > toDate) matchesDate = false;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [safeBills, searchTerm, statusFilter, fromDate, toDate]);

  const totalPages = Math.ceil(filteredBills.length / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Calculate Aggregates
  const totalPurchases = safeBills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalPaid = safeBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const totalPayableDue = safeBills.reduce((sum, b) => sum + (b.due_amount || 0), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">RKK Nursery</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">
          Purchase Bills & Vendor Supply Invoices
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total Purchase Bills</span>
          <div className="text-2xl font-extrabold text-slate-800">
            ₹{totalPurchases.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{safeBills.length} Total Bills</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Paid to Vendors</span>
          <div className="text-2xl font-extrabold text-emerald-600">
            ₹{totalPaid.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Completed Settlements</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-medium">Outstanding Vendor Payables</span>
          <div className="text-2xl font-extrabold text-amber-600">
            ₹{totalPayableDue.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Balance Liability</span>
        </div>
      </div>

      {/* Action Bar & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/80">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-700" />
          <span className="text-sm font-bold text-slate-800">
            Purchase Register ({filteredBills.length} bills)
          </span>
        </div>

        <button
          onClick={onCreateBill}
          className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition text-xs flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Purchase Bill</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Bill No or Party Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg text-xs text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="p-1.5 border border-slate-200 rounded-lg text-xs text-slate-700"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="unpaid">Unpaid / Due</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>
      </div>

      {/* Purchase Bills Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-4">BILL NO</th>
                <th className="py-3.5 px-4">BILL DATE</th>
                <th className="py-3.5 px-4">PARTY / VENDOR NAME</th>
                <th className="py-3.5 px-4 text-right">GST TAX</th>
                <th className="py-3.5 px-4 text-right">PURCHASE TOTAL</th>
                <th className="py-3.5 px-4 text-right">DUE PAYABLE</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedBills.map((b) => {
                const billIdKey = b.id || b.bill_no || "";
                const isExpanded = expandedBillIds[billIdKey];
                const cust = safeCustomers.find(
                  (c) => c.id === b.party_id || (c.name && b.party_name && c.name.toLowerCase() === b.party_name.toLowerCase())
                );

                return (
                  <React.Fragment key={billIdKey}>
                    <tr
                      onClick={() => toggleExpand(billIdKey)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isExpanded ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          <span>{b.bill_no}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{b.bill_date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {b.party_name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        +₹{(b.gst_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        ₹{(b.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                        ₹{(b.due_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border capitalize ${
                            b.status === "paid" || b.due_amount === 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : b.status === "partially_paid"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {b.status === "paid" || b.due_amount === 0
                            ? "Paid"
                            : b.status === "partially_paid"
                            ? "Partially Paid"
                            : "Unpaid / Due"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditBill && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditBill(b);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Purchase Bill"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteBill && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete Purchase Bill #${b.bill_no}?`)) {
                                  onDeleteBill(b.id || b.bill_no || "");
                                }
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete Purchase Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Level 2: Expanded Line Items Detail */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={8} className="p-4 sm:p-6 border-b border-slate-200">
                          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <h4 className="font-bold text-slate-800 text-sm">
                                Purchase Bill Details: <span className="font-mono text-emerald-700">{b.bill_no}</span>
                              </h4>
                              <div className="text-xs text-slate-500">
                                Vendor: <span className="font-bold text-slate-800">{b.party_name}</span> • Date: {b.bill_date}
                              </div>
                            </div>

                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-100">
                                  <th className="py-2 px-3">PRODUCT / MATERIAL</th>
                                  <th className="py-2 px-3">VARIETY / SPECS</th>
                                  <th className="py-2 px-3 text-right">UNIT RATE</th>
                                  <th className="py-2 px-3 text-right">QTY</th>
                                  <th className="py-2 px-3 text-right">LINE TOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(b.items || []).map((it, idx) => (
                                  <tr key={idx}>
                                    <td className="py-2 px-3 font-semibold text-slate-800">{it.product_name}</td>
                                    <td className="py-2 px-3 text-slate-600">{it.variant_name || "-"}</td>
                                    <td className="py-2 px-3 text-right font-mono">₹{(it.price || 0).toFixed(2)}</td>
                                    <td className="py-2 px-3 text-right font-bold">{(it.quantity || 0).toLocaleString()}</td>
                                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                      ₹{((it.price || 0) * (it.quantity || 0)).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-100">
                              <div className="text-slate-500 italic">
                                Narration: {b.narration || "No additional remarks"}
                              </div>
                              <div className="flex items-center gap-4 text-slate-700 font-medium">
                                <span>Subtotal: ₹{(b.items_total || 0).toLocaleString()}</span>
                                <span className="text-emerald-700 font-bold">GST: +₹{(b.gst_amount || 0).toLocaleString()} ({b.gst_type === "percentage" ? `${b.gst_value}%` : "Custom ₹"})</span>
                                <span>Freight: +₹{(b.transport_charge || 0).toLocaleString()}</span>
                                <span className="text-sm font-extrabold text-slate-900">Total: ₹{(b.total_amount || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No purchase bills found. Click "+ Create Purchase Bill" to record vendor supply bills.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredBills.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};
