import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Truck,
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  DollarSign,
  User,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  Sprout,
  Pencil,
  Trash2,
} from "lucide-react";
import { Customer, Order, OrderItem, DispatchRecord, PaymentReceipt, PurchaseBill, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "../components/SearchableSelect";

interface MetricLedgerScreenProps {
  customers: Customer[];
  orders: Order[];
  dispatches: DispatchRecord[];
  paymentReceipts?: PaymentReceipt[];
  purchaseBills?: PurchaseBill[];
  initialCustomerId?: string;
  onNavigateToCustomer?: (custId: string) => void;
  onNavigateToCreateOrder?: () => void;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
  onOpenReceivePayment?: (customerId?: string, orderId?: string) => void;
}

export const MetricLedgerScreen: React.FC<MetricLedgerScreenProps> = ({
  customers = [],
  orders = [],
  dispatches = [],
  paymentReceipts = [],
  purchaseBills = [],
  initialCustomerId = "",
  onNavigateToCustomer,
  onNavigateToCreateOrder,
  onEditOrder,
  onDeleteOrder,
  onOpenReceivePayment,
}) => {
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeDispatches = Array.isArray(dispatches) ? dispatches : [];
  const safePaymentReceipts = Array.isArray(paymentReceipts) ? paymentReceipts : [];
  const safePurchaseBills = Array.isArray(purchaseBills) ? purchaseBills : [];

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "bill" | "payment">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});

  // Item sorting within expanded bills
  const [billItemSortField, setBillItemSortField] = useState<"date" | "product" | "qty" | "price">("date");
  const [billItemSortDir, setBillItemSortDir] = useState<"asc" | "desc">("asc");

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return safeCustomers.find((c) => c.id === selectedCustomerId) || null;
  }, [safeCustomers, selectedCustomerId]);

  // Options for SearchableSelect
  const customerOptions: SearchableOption[] = useMemo(() => {
    return safeCustomers.map((c) => ({
      value: c.id || "",
      label: c.name || "Unnamed Customer",
      subLabel: `${c.phone || "No phone"} • ${c.city || "No city"} ${c.zone ? `(${c.zone})` : ""}`.trim(),
      badge: c.size_category || "Customer",
    }));
  }, [safeCustomers]);

  // Orders for selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return safeOrders.filter(
      (o) =>
        o.customer_id === selectedCustomerId ||
        (selectedCustomer && o.customer_name && o.customer_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
    );
  }, [safeOrders, selectedCustomerId, selectedCustomer]);

  // Dispatches for selected customer
  const customerDispatches = useMemo(() => {
    if (!selectedCustomerId) return [];
    return safeDispatches.filter(
      (d) =>
        d.customer_id === selectedCustomerId ||
        (selectedCustomer && d.customer_name && d.customer_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase()) ||
        customerOrders.some((o) => o.id === d.order_id)
    );
  }, [safeDispatches, selectedCustomerId, selectedCustomer, customerOrders]);

  // Payment receipts for selected customer
  const customerReceipts = useMemo(() => {
    if (!selectedCustomerId) return [];
    return safePaymentReceipts.filter(
      (r) =>
        r.customer_id === selectedCustomerId ||
        (selectedCustomer && r.customer_name && r.customer_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
    );
  }, [safePaymentReceipts, selectedCustomerId, selectedCustomer]);

  // Purchase bills for selected customer/vendor
  const customerPurchaseBills = useMemo(() => {
    if (!selectedCustomerId) return [];
    return safePurchaseBills.filter(
      (b) =>
        b.party_id === selectedCustomerId ||
        (selectedCustomer && b.party_name && b.party_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
    );
  }, [safePurchaseBills, selectedCustomerId, selectedCustomer]);

  // Calculate Ledger Transactions
  const ledgerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];

    const txns: Array<{
      id: string;
      date: string;
      type: "opening" | "bill" | "purchase_bill" | "payment";
      voucherNo: string;
      particulars: string;
      itemsCount: number;
      debit: number;
      credit: number;
      order?: Order;
      purchaseBill?: PurchaseBill;
      dispatchCount: number;
      mergedDispatches: DispatchRecord[];
    }> = [];

    // 1. Opening Balance
    if (selectedCustomer.opening_balance && selectedCustomer.opening_balance > 0) {
      txns.push({
        id: "txn-opening",
        date: selectedCustomer.created_at ? selectedCustomer.created_at.split("T")[0] : "2026-01-01",
        type: "opening",
        voucherNo: "OPENING",
        particulars: "Opening Balance Brought Forward",
        itemsCount: 0,
        debit: selectedCustomer.opening_balance,
        credit: 0,
        dispatchCount: 0,
        mergedDispatches: [],
      });
    }

    // 2. Orders as Sales Bills & Advance Payments (Debit = We are Owed Money)
    customerOrders.forEach((ord) => {
      const orderDate = ord.order_date || (ord.created_at ? ord.created_at.split("T")[0] : "2026-08-01");
      const orderTotal = ord.total_amount || 0;
      const advancePaid = ord.advance_payment || 0;

      // Find dispatches merged into this order
      const matchingDispatches = customerDispatches.filter(
        (d) => d.order_id === ord.id || (d.customer_name && d.customer_name === ord.customer_name)
      );

      // Main Order Bill Transaction (Debit)
      const itemSummaryStr = (ord.items || [])
        .map((i) => `${i.product_name} ${i.variant_name || ""} (x${i.quantity})`)
        .join(", ");

      txns.push({
        id: `txn-order-${ord.id || ord.order_no}`,
        date: orderDate,
        type: "bill",
        voucherNo: ord.order_no || `ORD-${ord.id}`,
        particulars: itemSummaryStr || "Sales Order Bill",
        itemsCount: ord.items?.length || 0,
        debit: orderTotal,
        credit: 0,
        order: ord,
        dispatchCount: matchingDispatches.length,
        mergedDispatches: matchingDispatches,
      });

      // Advance Payment Received Transaction (Credit)
      if (advancePaid > 0) {
        txns.push({
          id: `txn-adv-${ord.id || ord.order_no}`,
          date: orderDate,
          type: "payment",
          voucherNo: `ADV-${ord.order_no || ord.id}`,
          particulars: `Advance Received for Sales Order #${ord.order_no || ord.id}`,
          itemsCount: 0,
          debit: 0,
          credit: advancePaid,
          order: ord,
          dispatchCount: 0,
          mergedDispatches: [],
        });
      }
    });

    // 3. Purchase Bills (Credit = We Owe Vendor Money)
    customerPurchaseBills.forEach((pur) => {
      const purDate = pur.bill_date || (pur.created_at ? pur.created_at.split("T")[0] : "2026-08-01");
      const purTotal = pur.total_amount || 0;
      const purPaid = pur.paid_amount || 0;

      const itemSummaryStr = (pur.items || [])
        .map((i) => `${i.product_name} ${i.variant_name || ""} (x${i.quantity})`)
        .join(", ");

      txns.push({
        id: `txn-pur-${pur.id || pur.bill_no}`,
        date: purDate,
        type: "purchase_bill",
        voucherNo: pur.bill_no || `PUR-${pur.id}`,
        particulars: `Purchase Bill: ${itemSummaryStr || "Goods / Materials Supply"}`,
        itemsCount: pur.items?.length || 0,
        debit: 0,
        credit: purTotal,
        purchaseBill: pur,
        dispatchCount: 0,
        mergedDispatches: [],
      });

      if (purPaid > 0) {
        txns.push({
          id: `txn-purpaid-${pur.id || pur.bill_no}`,
          date: purDate,
          type: "payment",
          voucherNo: `PAY-${pur.bill_no || pur.id}`,
          particulars: `Payment Paid to Vendor for Purchase Bill #${pur.bill_no || pur.id}`,
          itemsCount: 0,
          debit: purPaid,
          credit: 0,
          purchaseBill: pur,
          dispatchCount: 0,
          mergedDispatches: [],
        });
      }
    });

    // 4. Payment Receipts (Credit = Money Received from Customer)
    customerReceipts.forEach((rec) => {
      const linkedOrd = safeOrders.find((o) => o.id === rec.order_id || o.order_no === rec.order_no);
      txns.push({
        id: `txn-receipt-${rec.id || rec.receipt_no}`,
        date: rec.receipt_date,
        type: "payment",
        voucherNo: rec.receipt_no || `REC-${rec.id}`,
        particulars: `Payment Rec. (${rec.payment_mode}) ${rec.reference_no ? `Ref: ${rec.reference_no}` : ""} ${rec.notes ? `• ${rec.notes}` : ""}`.trim(),
        itemsCount: 0,
        debit: 0,
        credit: rec.amount,
        order: linkedOrd,
        dispatchCount: 0,
        mergedDispatches: [],
      });
    });

    // Sort by Date
    txns.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    // Compute Running Balance
    let runningBal = 0;
    // Calculate running balance from oldest to newest regardless of display sort order
    const chronologicalTxns = [...txns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const balanceMap = new Map<string, number>();

    chronologicalTxns.forEach((t) => {
      runningBal += t.debit - t.credit;
      balanceMap.set(t.id, runningBal);
    });

    return txns.map((t) => ({
      ...t,
      balance: balanceMap.get(t.id) || 0,
    }));
  }, [selectedCustomer, customerOrders, customerDispatches, customerReceipts, customerPurchaseBills, sortOrder]);

  // Filtered Ledger Transactions based on Search & Filters
  const filteredTransactions = useMemo(() => {
    return ledgerTransactions.filter((t) => {
      // Type Filter
      if (typeFilter === "bill" && t.type !== "bill" && t.type !== "opening") return false;
      if (typeFilter === "payment" && t.type !== "payment") return false;

      // Date Range Filter
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;

      // Search Query Filter
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchVoucher = t.voucherNo.toLowerCase().includes(q);
        const matchParticulars = t.particulars.toLowerCase().includes(q);
        const matchDispatches = t.mergedDispatches.some(
          (d) =>
            (d.vehicle_no && d.vehicle_no.toLowerCase().includes(q)) ||
            (d.driver_name && d.driver_name.toLowerCase().includes(q))
        );
        return matchVoucher || matchParticulars || matchDispatches;
      }

      return true;
    });
  }, [ledgerTransactions, typeFilter, fromDate, toDate, searchTerm]);

  // Customer / Vendor Ledger Metrics Summary
  const ledgerMetrics = useMemo(() => {
    const opening = selectedCustomer?.opening_balance || 0;
    const totalSalesBilled = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) + opening;
    const totalPurchaseBilled = customerPurchaseBills.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const totalReceipts = customerReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalAdvances = customerOrders.reduce((sum, o) => sum + (o.advance_payment || 0), 0);
    const totalPaymentsReceived = totalAdvances + totalReceipts;

    const totalPaymentsPaid = customerPurchaseBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);

    const netReceivableDue = totalSalesBilled - totalPaymentsReceived;
    const netPayableDue = totalPurchaseBilled - totalPaymentsPaid;

    const netBalance = netReceivableDue - netPayableDue;
    const isReceivable = netBalance >= 0;

    return {
      opening,
      totalSalesBilled,
      totalPurchaseBilled,
      totalPaymentsReceived,
      totalPaymentsPaid,
      netBalance,
      isReceivable,
      absNetBalance: Math.abs(netBalance),
      totalDispatches: customerDispatches.length,
    };
  }, [selectedCustomer, customerOrders, customerDispatches, customerReceipts, customerPurchaseBills]);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">Party / Customer Ledger</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Complete financial passbook, sales bills, purchase bills & settlement history
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onOpenReceivePayment && (
            <button
              onClick={() => onOpenReceivePayment(selectedCustomerId)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition text-xs shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              <span>+ Receive Payment</span>
            </button>
          )}

          {selectedCustomer && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ledger</span>
            </button>
          )}

          {onNavigateToCreateOrder && (
            <button
              onClick={onNavigateToCreateOrder}
              className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm shadow-sm"
            >
              <Sprout className="w-4 h-4" />
              <span>+ Create Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Select Customer / Vendor to View Ledger
        </label>
        <div className="max-w-xl">
          <SearchableSelect
            options={customerOptions}
            value={selectedCustomerId}
            onChange={(val) => setSelectedCustomerId(val)}
            placeholder="Type customer or vendor name to search..."
          />
        </div>

        {/* Quick Customer Selection Pills */}
        {!selectedCustomerId && safeCustomers.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-slate-400 font-medium mb-2">Quick Select Recent Parties:</p>
            <div className="flex flex-wrap gap-2">
              {safeCustomers.slice(0, 5).map((cust) => (
                <button
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id || "")}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200/80 transition flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{cust.name}</span>
                  <span className="text-[10px] text-emerald-600 font-mono">({cust.city || "N/A"})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State - No Customer Selected */}
      {!selectedCustomerId && (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Party Selected</h3>
            <p className="text-xs text-slate-500">
              Please select a customer or vendor from the dropdown above to view their sales bills, purchase bills, and net receivable/payable balance.
            </p>
          </div>
        </div>
      )}

      {/* Active Customer View */}
      {selectedCustomer && (
        <>
          {/* Customer Summary Bar & Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Customer Details Box */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2 md:col-span-4 lg:col-span-1 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedCustomer.zone || "ZONE1"}
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedCustomer.org_id || ""}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-800">{selectedCustomer.name}</h2>
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{selectedCustomer.phone || "No phone recorded"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{selectedCustomer.address || `${selectedCustomer.city}, ${selectedCustomer.state}`}</span>
                </div>
              </div>
            </div>

            {/* Total Sales Billed Metric */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Billed</span>
              <div className="mt-2">
                <p className="text-2xl font-black text-slate-800">₹{ledgerMetrics.totalSalesBilled.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {customerOrders.length} Sales Bills {ledgerMetrics.opening > 0 ? `+ Opening (₹${ledgerMetrics.opening})` : ""}
                </p>
              </div>
            </div>

            {/* Total Purchases Billed Metric */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchased</span>
              <div className="mt-2">
                <p className="text-2xl font-black text-blue-700">₹{ledgerMetrics.totalPurchaseBilled.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {customerPurchaseBills.length} Vendor Purchase Bills
                </p>
              </div>
            </div>

            {/* Net Outstanding Balance Metric */}
            <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between border-r-4 ${
              ledgerMetrics.isReceivable ? "border-r-emerald-500" : "border-r-amber-500"
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Party Balance</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ledgerMetrics.isReceivable ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {ledgerMetrics.isReceivable ? "Receivable" : "Payable"}
                </span>
              </div>
              <div className="mt-2">
                <p className={`text-2xl font-black ${ledgerMetrics.isReceivable ? "text-emerald-700" : "text-amber-600"}`}>
                  ₹{ledgerMetrics.absNetBalance.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {ledgerMetrics.netBalance === 0
                    ? "Account Fully Settled (₹0)"
                    : ledgerMetrics.isReceivable
                    ? "Amount to Collect from Customer"
                    : "Amount Payable to Vendor"}
                </p>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search bill no, crop, vehicle no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    typeFilter === "all" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Txns
                </button>
                <button
                  onClick={() => setTypeFilter("bill")}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    typeFilter === "bill" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Bills Only
                </button>
                <button
                  onClick={() => setTypeFilter("payment")}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    typeFilter === "payment" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Payments Only
                </button>
              </div>

              {/* Date Pickers */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  title="From Date"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="p-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  title="To Date"
                />
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
              </button>
            </div>
          </div>

          {/* Ledger Passbook Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span>Transaction Passbook</span>
                <span className="text-xs font-normal text-slate-400">({filteredTransactions.length} entries)</span>
              </h3>

              <div className="text-xs text-slate-500 flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Bill Debit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Payment Credit
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                    <th className="py-3.5 px-4">DATE</th>
                    <th className="py-3.5 px-4">TYPE</th>
                    <th className="py-3.5 px-4">VOUCHER / BILL NO</th>
                    <th className="py-3.5 px-4">PARTICULARS & MERGED DISPATCHES</th>
                    <th className="py-3.5 px-4 text-right">DEBIT (BILL ₹)</th>
                    <th className="py-3.5 px-4 text-right">CREDIT (PAID ₹)</th>
                    <th className="py-3.5 px-4 text-right">RUNNING BALANCE (₹)</th>
                    <th className="py-3.5 px-4 text-center">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredTransactions.map((t) => {
                    const isExpanded = t.order ? expandedOrderIds[t.order.id || t.voucherNo] : false;
                    const ord = t.order;

                    return (
                      <React.Fragment key={t.id}>
                        <tr
                          className={`hover:bg-slate-50 transition cursor-pointer ${
                            isExpanded ? "bg-emerald-50/30" : ""
                          }`}
                          onClick={() => {
                            if (ord) toggleExpandOrder(ord.id || t.voucherNo);
                          }}
                        >
                          {/* Date */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">{t.date}</td>

                          {/* Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {t.type === "bill" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-max">
                                <Receipt className="w-3 h-3" /> Bill
                              </span>
                            )}
                            {t.type === "payment" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                                <DollarSign className="w-3 h-3" /> Payment
                              </span>
                            )}
                            {t.type === "opening" && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 w-max">
                                Opening
                              </span>
                            )}
                          </td>

                          {/* Voucher No */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                            {t.voucherNo}
                          </td>

                          {/* Particulars & Merged Dispatches */}
                          <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                            <p className="font-medium text-slate-800 line-clamp-1">{t.particulars}</p>

                            {/* Merged Dispatch Badges inside Order Row */}
                            {t.mergedDispatches && t.mergedDispatches.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {t.mergedDispatches.map((disp, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                                  >
                                    <Truck className="w-3 h-3 text-blue-600" />
                                    <span>
                                      {disp.dispatch_no} • {disp.vehicle_no || "Truck"} ({disp.dispatch_date})
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Debit (Billed Amount) */}
                          <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                            {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : "-"}
                          </td>

                          {/* Credit (Payment Amount) */}
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                            {t.credit > 0 ? `₹${t.credit.toLocaleString()}` : "-"}
                          </td>

                          {/* Running Balance */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            <span className={t.balance > 0 ? "text-amber-600" : "text-emerald-700"}>
                              ₹{t.balance.toLocaleString()}
                            </span>
                          </td>

                          {/* Details Toggle Button & Actions */}
                          <td className="py-3.5 px-4 text-center">
                            {ord ? (
                              <div className="flex items-center justify-center gap-1">
                                {onEditOrder && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditOrder(ord);
                                    }}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                    title="Edit Bill"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onDeleteOrder && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        window.confirm(
                                          `Are you sure you want to delete Bill #${ord.order_no || ord.id}? This will remove it from the customer ledger.`
                                        )
                                      ) {
                                        onDeleteOrder(ord.id || ord.order_no || "");
                                      }
                                    }}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Bill"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandOrder(ord.id || t.voucherNo);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                                  title="View/Collapse Bill Details"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>

                        {/* Level 3: Merged Bill Detail View */}
                        {isExpanded && ord && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={8} className="p-4 sm:p-6 border-b border-slate-200">
                              <MergedBillDetailCard
                                order={ord}
                                dispatches={t.mergedDispatches}
                                sortField={billItemSortField}
                                sortDir={billItemSortDir}
                                onEditOrder={onEditOrder}
                                onDeleteOrder={onDeleteOrder}
                                onSortChange={(field) => {
                                  if (billItemSortField === field) {
                                    setBillItemSortDir(billItemSortDir === "asc" ? "desc" : "asc");
                                  } else {
                                    setBillItemSortField(field);
                                    setBillItemSortDir("asc");
                                  }
                                }}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                        No transactions found for this customer matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── LEVEL 3: MERGED BILL DETAIL CARD ──────────────────────────────
interface MergedBillDetailCardProps {
  order: Order;
  dispatches: DispatchRecord[];
  sortField: "date" | "product" | "qty" | "price";
  sortDir: "asc" | "desc";
  onSortChange: (field: "date" | "product" | "qty" | "price") => void;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
}

const MergedBillDetailCard: React.FC<MergedBillDetailCardProps> = ({
  order,
  dispatches = [],
  sortField,
  sortDir,
  onSortChange,
  onEditOrder,
  onDeleteOrder,
}) => {
  const items = order.items || [];

  // Sorted Line Items
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "date") {
        valA = a.dispatch_from || "";
        valB = b.dispatch_from || "";
      } else if (sortField === "product") {
        valA = `${a.product_name} ${a.variant_name || ""}`;
        valB = `${b.product_name} ${b.variant_name || ""}`;
      } else if (sortField === "qty") {
        valA = a.quantity || 0;
        valB = b.quantity || 0;
      } else if (sortField === "price") {
        valA = a.price || 0;
        valB = b.price || 0;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDir]);

  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const transport = order.transport_charge || 0;
  const foc = order.foc_amount || 0;
  const netBillTotal = order.total_amount || itemsSubtotal + transport - foc;
  const advance = (order.advance_payment || 0) + (order.paid_amount || 0);
  const due = order.due_amount !== undefined ? order.due_amount : Math.max(0, netBillTotal - advance);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
      {/* Bill Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-800">
              Bill / Order Detail: <span className="font-mono text-emerald-700">{order.order_no || `ORD-${order.id}`}</span>
            </h4>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
              {order.status || "pending"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Order Date: <span className="font-medium text-slate-700">{order.order_date}</span> • Customer:{" "}
            <span className="font-semibold text-slate-800">{order.customer_name}</span>
          </p>
        </div>

        {/* Action Controls & Sort Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {(onEditOrder || onDeleteOrder) && (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              {onEditOrder && (
                <button
                  onClick={() => onEditOrder(order)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Bill</span>
                </button>
              )}
              {onDeleteOrder && (
                <button
                  onClick={() => {
                    const confirmStr = `Are you sure you want to delete Bill #${order.order_no || order.id}? This will remove it from the customer ledger.`;
                    if (window.confirm(confirmStr)) {
                      onDeleteOrder(order.id || order.order_no || "");
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete Bill</span>
                </button>
              )}
            </div>
          )}

          {/* Item Sort Bar */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Sort Bill Items:
            </span>
            <button
              onClick={() => onSortChange("date")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === "date" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Dispatch Date {sortField === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
            <button
              onClick={() => onSortChange("product")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === "product" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Product {sortField === "product" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
            <button
              onClick={() => onSortChange("qty")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                sortField === "qty" ? "bg-white text-emerald-700 shadow-sm border border-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Qty {sortField === "qty" ? (sortDir === "asc" ? "↑" : "↓") : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Bill Line Items Table */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase Bill Line Items</h5>
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                <th className="py-2.5 px-3">PRODUCT & VARIANT</th>
                <th className="py-2.5 px-3 text-right">UNIT PRICE</th>
                <th className="py-2.5 px-3 text-right">ORDERED QTY</th>
                <th className="py-2.5 px-3 text-right">DISPATCHED QTY</th>
                <th className="py-2.5 px-3">DISPATCH WINDOW (FROM - TO)</th>
                <th className="py-2.5 px-3 text-right">LINE TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedItems.map((item, idx) => {
                const lineTotal = (item.price || 0) * (item.quantity || 0);
                const dispQty = item.dispatched_qty || 0;
                const isFullyDispatched = dispQty >= item.quantity;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.product_name} <span className="text-slate-500 font-normal">- {item.variant_name || "Standard"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">₹{(item.price || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">{(item.quantity || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className={isFullyDispatched ? "text-emerald-600 font-bold" : "text-amber-600 font-semibold"}>
                        {dispQty.toLocaleString()} / {(item.quantity || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {item.dispatch_from || "N/A"} {item.dispatch_to ? `to ${item.dispatch_to}` : ""}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹{lineTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merged Vehicle Dispatch History for this Bill */}
      {dispatches && dispatches.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Merged Vehicle Dispatch Log ({dispatches.length} shipments)</span>
            </h5>
          </div>

          <div className="overflow-x-auto border border-blue-100 bg-blue-50/20 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50/80 text-[10px] uppercase font-bold text-blue-700 border-b border-blue-100">
                  <th className="py-2.5 px-3">DISPATCH NO</th>
                  <th className="py-2.5 px-3">DATE</th>
                  <th className="py-2.5 px-3">VEHICLE NO</th>
                  <th className="py-2.5 px-3">DRIVER & PHONE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100 text-slate-700">
                {dispatches.map((disp, i) => (
                  <tr key={i} className="hover:bg-blue-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-blue-800">{disp.dispatch_no}</td>
                    <td className="py-2 px-3 font-mono">{disp.dispatch_date}</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{disp.vehicle_no || "Truck"}</td>
                    <td className="py-2 px-3">
                      {disp.driver_name || "N/A"} {disp.driver_phone ? `(${disp.driver_phone})` : ""}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-700 border border-blue-200 capitalize">
                        {disp.status || "scheduled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill Financial Summary Breakdown */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {order.narration && (
          <div className="text-xs text-slate-600 max-w-sm">
            <span className="font-bold text-slate-700">Order Narration:</span> {order.narration}
          </div>
        )}

        <div className="w-full sm:w-72 space-y-1.5 text-xs ml-auto">
          <div className="flex justify-between text-slate-600">
            <span>Items Total:</span>
            <span className="font-mono font-medium">₹{itemsSubtotal.toLocaleString()}</span>
          </div>
          {transport > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Transport Charge:</span>
              <span className="font-mono font-medium">+₹{transport.toLocaleString()}</span>
            </div>
          )}
          {foc > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>FOC / Discount:</span>
              <span className="font-mono font-medium">-₹{foc.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5 text-sm">
            <span>Net Bill Amount:</span>
            <span className="font-mono">₹{netBillTotal.toLocaleString()}</span>
          </div>
          {advance > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Advance Paid:</span>
              <span className="font-mono">-₹{advance.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-amber-700 border-t border-slate-200 pt-1.5 text-sm">
            <span>Bill Balance Due:</span>
            <span className="font-mono">₹{due.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
