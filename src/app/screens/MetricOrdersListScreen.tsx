import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Download,
  Filter,
  X,
  Phone,
  MapPin,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Sprout,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Printer,
  BookOpen,
} from "lucide-react";
import { Order, Customer, SupabaseService } from "../../db/supabaseService";

interface OrdersListProps {
  orders: Order[];
  customers: Customer[];
  onCreateOrder: () => void;
  onViewLedger?: (customerId: string) => void;
}

export const MetricOrdersListScreen: React.FC<OrdersListProps> = ({
  orders = [],
  customers = [],
  onCreateOrder,
  onViewLedger,
}) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return safeOrders.filter((ord) => {
      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchNo = (ord.order_no || "").toLowerCase().includes(q) || (ord.id || "").toLowerCase().includes(q);
        const matchCust = (ord.customer_name || "").toLowerCase().includes(q);
        const matchItem = (ord.items || []).some(
          (i) => i.product_name.toLowerCase().includes(q) || (i.variant_name || "").toLowerCase().includes(q)
        );
        if (!matchNo && !matchCust && !matchItem) return false;
      }

      // Status Filter
      if (statusFilter !== "all" && (ord.status || "pending") !== statusFilter) {
        return false;
      }

      // Date Range Filter
      if (fromDate && (ord.order_date || "") < fromDate) return false;
      if (toDate && (ord.order_date || "") > toDate) return false;

      return true;
    });
  }, [safeOrders, searchTerm, statusFilter, fromDate, toDate]);

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const headers = ["Order ID", "Order Date", "Customer", "Items", "Due Amount", "Total Amount", "Status"];
        const rows = filteredOrders.map((o) => [
          o.order_no || o.id,
          o.order_date,
          o.customer_name,
          o.items?.length || 0,
          o.due_amount || 0,
          o.total_amount || 0,
          o.status || "pending",
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Export failed:", e);
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">Greenza Solutions Demo</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Orders</p>
      </div>

      {/* Top Action Bar (Order Counter + Export & Create Buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100/80">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
            {filteredOrders.length}
          </span>
          <span className="text-sm font-bold text-emerald-900">Orders</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>

          {/* Create Order Button */}
          <button
            onClick={onCreateOrder}
            className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition text-xs sm:text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium bg-white focus:ring-2 focus:ring-emerald-500 min-w-[130px]"
          >
            <option value="all">Status: All</option>
            <option value="pending">Pending</option>
            <option value="sowing_done">Sowing Done</option>
            <option value="dispatched">Dispatched</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500"
            title="From Date"
          />

          {/* Date To */}
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500"
            title="To Date"
          />

          {/* Clear Button */}
          {(searchTerm || statusFilter !== "all" || fromDate || toDate) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          {/* Search Action Button */}
          <button
            onClick={() => {}}
            className="bg-[#00a651] text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-600 transition shadow-sm ml-auto sm:ml-0"
          >
            Search
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-4">ORDER ID</th>
                <th className="py-3.5 px-4">ORDER DATE</th>
                <th className="py-3.5 px-4">CUSTOMER</th>
                <th className="py-3.5 px-4">ITEMS</th>
                <th className="py-3.5 px-4 text-right">DUE AMOUNT</th>
                <th className="py-3.5 px-4 text-right">TOTAL AMOUNT</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredOrders.map((ord) => {
                const orderIdKey = ord.id || ord.order_no || "";
                const isExpanded = expandedOrderIds[orderIdKey];

                // Match customer details
                const cust = safeCustomers.find(
                  (c) => c.id === ord.customer_id || (c.name && ord.customer_name && c.name.toLowerCase() === ord.customer_name.toLowerCase())
                );

                const formattedDate = ord.order_date
                  ? new Date(ord.order_date).toDateString()
                  : "Wed Jul 29 2026";

                const itemsCount = ord.items?.length || 1;
                const totalAmountVal = ord.total_amount || 0;
                const advanceVal = (ord.advance_payment || 0) + (ord.paid_amount || 0);
                const dueAmountVal = ord.due_amount !== undefined ? ord.due_amount : Math.max(0, totalAmountVal - advanceVal);

                return (
                  <React.Fragment key={orderIdKey}>
                    <tr
                      onClick={() => toggleExpand(orderIdKey)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isExpanded ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button className="text-slate-400 hover:text-emerald-600 transition">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <span>{ord.order_no || `ORG1_ORD_${ord.id}`}</span>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{ord.customer_name || "Customer"}</p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            {cust?.phone && (
                              <span className="flex items-center gap-1 text-slate-600 font-mono">
                                <Phone className="w-3 h-3 text-emerald-600" /> {cust.phone}
                              </span>
                            )}
                            {(cust?.city || cust?.address) && (
                              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                <MapPin className="w-3 h-3 text-emerald-500" /> {cust.city || cust.address}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {cust?.org_id || "#ORG1_CUST_2026_0001"}
                          </p>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                          <Sprout className="w-3 h-3 text-emerald-600" />
                          <span>T-{itemsCount}</span>
                        </span>
                      </td>

                      {/* Due Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                        ₹{dueAmountVal.toLocaleString()}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{totalAmountVal.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border capitalize ${
                            ord.status === "dispatched"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.status === "sowing_done"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ord.status === "cancelled"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {ord.status || "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onViewLedger && cust?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewLedger(cust.id);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="View Customer Ledger"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(orderIdKey);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                            title="Order Details"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={8} className="p-4 sm:p-6 border-b border-slate-200">
                          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                Order Breakdown — Line Items
                              </h4>
                              {ord.narration && (
                                <p className="text-xs text-slate-500 italic">
                                  Note: {ord.narration}
                                </p>
                              )}
                            </div>

                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                                  <th className="py-2 px-3">CROP / VARIANT</th>
                                  <th className="py-2 px-3 text-right">UNIT PRICE</th>
                                  <th className="py-2 px-3 text-right">QUANTITY</th>
                                  <th className="py-2 px-3">DISPATCH WINDOW</th>
                                  <th className="py-2 px-3 text-right">LINE TOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {(ord.items || []).map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                                      {item.product_name} <span className="text-slate-400 font-normal">- {item.variant_name || "Standard"}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                      ₹{(item.price || 0).toFixed(2)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                      {(item.quantity || 0).toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-slate-500">
                                      {item.dispatch_from || "N/A"} {item.dispatch_to ? `to ${item.dispatch_to}` : ""}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                      ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No orders created yet. Click "+ Create Order" to add a new purchase order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
