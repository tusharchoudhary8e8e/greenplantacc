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
  Pencil,
  Trash2,
  DollarSign,
} from "lucide-react";
import { Order, Customer, SupabaseService } from "../../db/supabaseService";
import { printReceiptPDF } from "../utils/receiptPdfGenerator";
import { PaginationControl } from "../components/PaginationControl";

interface OrdersListProps {
  orders: Order[];
  customers: Customer[];
  onCreateOrder: () => void;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onViewLedger?: (customerId: string) => void;
  onOpenReceivePayment?: (customerId?: string, orderId?: string) => void;
}

export const MetricOrdersListScreen: React.FC<OrdersListProps> = ({
  orders = [],
  customers = [],
  onCreateOrder,
  onEditOrder,
  onDeleteOrder,
  onViewLedger,
  onOpenReceivePayment,
}) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [isExporting, setIsExporting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, fromDate, toDate]);

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

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

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

  const activeOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => (o.status || "pending") !== "cancelled").length;
  }, [filteredOrders]);

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-[#f4f4f0] min-h-screen font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-[#e8e8e8]">
        <div>
          <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider block">
            RKK Nursery — <span className="text-[#1a2e1a]">Sales &amp; Fulfillments Log</span>
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">
              Sales Orders Log
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f4ed] text-[#2d7a4f] border border-[#b8ddc8]">
              {activeOrdersCount} {activeOrdersCount === 1 ? "Order Active" : "Orders Active"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#ccc] text-[#444] bg-white hover:bg-slate-50 rounded-[7px] font-semibold text-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#666]" />
            <span>{isExporting ? "Exporting..." : "Export Log"}</span>
          </button>

          <button
            onClick={onCreateOrder}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1e4d2b] text-white hover:bg-[#163d21] rounded-[7px] font-bold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create Order</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white p-3.5 rounded-[10px] border border-[#e8e8e8]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-[#aaa] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Customer, Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-[#e0e0e0] rounded-[7px] text-xs font-medium text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-[#f9f9f7]"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 border border-[#e0e0e0] rounded-[7px] text-xs text-[#444] font-medium bg-white focus:ring-1 focus:ring-[#1e4d2b]"
          >
            <option value="all">Status: All Orders</option>
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
            className="p-1.5 border border-[#e0e0e0] rounded-[7px] text-xs text-[#444] bg-white focus:ring-1 focus:ring-[#1e4d2b]"
            title="From Date"
          />

          {/* Date To */}
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-1.5 border border-[#e0e0e0] rounded-[7px] text-xs text-[#444] bg-white focus:ring-1 focus:ring-[#1e4d2b]"
            title="To Date"
          />

          {/* Clear Button */}
          {(searchTerm || statusFilter !== "all" || fromDate || toDate) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#888] hover:text-[#1a1a1a] font-medium underline px-1"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[10px] border border-[#e8e8e8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f9f9f7] text-[10px] font-bold uppercase tracking-wider text-[#888] border-b border-[#f0f0ec]">
                <th className="py-3 px-4">ORDER ID</th>
                <th className="py-3 px-4">ORDER DATE</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">ITEMS</th>
                <th className="py-3 px-4 text-right">DUE AMOUNT</th>
                <th className="py-3 px-4 text-right">TOTAL AMOUNT</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ec] font-medium text-[#333]">
              {paginatedOrders.map((ord) => {
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#e6f4ed] text-[#2d7a4f] flex items-center justify-center font-bold text-xs shrink-0">
                            {(ord.customer_name || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#1a1a1a] text-xs">{ord.customer_name || "Customer"}</p>
                            <span className="text-[10px] text-[#888] block">
                              {cust?.city ? `${cust.city} • ` : ""}Premium Distributor
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[#555]">
                          {(ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1).toLocaleString()}
                        </span>
                      </td>

                      {/* Due Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#e05c00] whitespace-nowrap">
                        ₹ {dueAmountVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#1a1a1a] whitespace-nowrap">
                        ₹ {totalAmountVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "paid" || dueAmountVal === 0
                              ? "bg-[#d4edda] text-[#155724]"
                              : ord.status === "partially_paid" || (advanceVal > 0 && dueAmountVal > 0)
                              ? "bg-blue-100 text-blue-800"
                              : ord.status === "dispatched"
                              ? "bg-purple-100 text-purple-800"
                              : ord.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-[#fff3cd] text-[#856404]"
                          }`}
                        >
                          {ord.status === "paid" || dueAmountVal === 0
                            ? "PAID"
                            : ord.status === "partially_paid" || (advanceVal > 0 && dueAmountVal > 0)
                            ? "PARTIALLY PAID"
                            : (ord.status || "PENDING").toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {onOpenReceivePayment && dueAmountVal > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReceivePayment(ord.customer_id || cust?.id, ord.id || ord.order_no);
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                              title="Receive Payment for this Bill"
                            >
                              <DollarSign className="w-3.5 h-3.5 font-bold text-emerald-600" />
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              printReceiptPDF({
                                receiptNo: ord.order_no || ord.id || "REC-1001",
                                date: ord.order_date || new Date().toISOString().split("T")[0],
                                customerName: ord.customer_name || cust?.name || "Customer",
                                customerAddress: cust?.address || `${cust?.city || ""}, ${cust?.state || ""}`.trim() || "",
                                customerPhone: cust?.phone || "N/A",
                                totalAmount: totalAmountVal,
                                amount: advanceVal,
                                previousBalance: cust?.opening_balance || 0,
                                currentBalance: dueAmountVal,
                                paymentType: ord.payment_type || "Cash",
                                items: ord.items,
                              });
                            }}
                            className="p-1.5 text-[#f58220] hover:text-[#d46a10] hover:bg-amber-50 rounded-lg transition"
                            title="Download / Print PDF Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 font-bold" />
                          </button>

                          {onEditOrder && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditOrder(ord);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Order"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteOrder && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmStr = `Are you sure you want to delete Order #${ord.order_no || ord.id}? This will remove the bill from ledger records.`;
                                if (window.confirm(confirmStr)) {
                                  onDeleteOrder(ord.id || ord.order_no || "");
                                }
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onViewLedger && cust?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewLedger(cust.id);
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                              title="View Customer Ledger"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
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
                            <MoreHorizontal className="w-3.5 h-3.5" />
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

        {/* Pagination Controls */}
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredOrders.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />

        {/* Sub-footer matching photo 2 */}
        <div className="py-4 text-center border-t border-[#f0f0ec]">
          <span className="text-[11px] font-medium text-[#aaa]">End of active dispatch list</span>
        </div>
      </div>
    </div>
  );
};
