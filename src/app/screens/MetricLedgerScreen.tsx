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
  Wallet,
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
  initialMode?: "party_balances" | "transaction_details";
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
  initialMode,
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

  // View Mode: "party_balances" | "transaction_details"
  const [viewMode, setViewMode] = useState<"party_balances" | "transaction_details">(
    initialMode || (initialCustomerId ? "transaction_details" : "party_balances")
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [searchTerm, setSearchTerm] = useState("");
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [partyFilter, setPartyFilter] = useState<"all" | "get" | "give" | "zero">("all");
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

  // Calculate Ledger Transactions for single selected customer
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

    // 2. Orders as Sales Bills & Advance Payments
    customerOrders.forEach((ord) => {
      const orderDate = ord.order_date || (ord.created_at ? ord.created_at.split("T")[0] : "2026-08-01");
      const orderTotal = ord.total_amount || 0;
      const advancePaid = ord.advance_payment || 0;

      const matchingDispatches = customerDispatches.filter(
        (d) => d.order_id === ord.id || (d.customer_name && d.customer_name === ord.customer_name)
      );

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

    // 3. Purchase Bills
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

    // 4. Payment Receipts
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

  // Filtered Ledger Transactions
  const filteredTransactions = useMemo(() => {
    return ledgerTransactions.filter((t) => {
      if (typeFilter === "bill" && t.type !== "bill" && t.type !== "opening") return false;
      if (typeFilter === "payment" && t.type !== "payment") return false;

      if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
      if (toDate && new Date(t.date) > new Date(toDate)) return false;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const voucherMatch = t.voucherNo.toLowerCase().includes(query);
        const partMatch = t.particulars.toLowerCase().includes(query);
        if (!voucherMatch && !partMatch) return false;
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

  // Calculate Party Balances for ALL Customers/Vendors
  const partyBalancesList = useMemo(() => {
    return safeCustomers.map((cust) => {
      const cOrders = safeOrders.filter(
        (o) =>
          o.customer_id === cust.id ||
          (o.customer_name && o.customer_name.trim().toLowerCase() === cust.name.trim().toLowerCase())
      );
      const totalSales = cOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalAdvance = cOrders.reduce((sum, o) => sum + (o.advance_payment || 0), 0);

      const cReceipts = safePaymentReceipts.filter(
        (r) =>
          r.customer_id === cust.id ||
          (r.customer_name && r.customer_name.trim().toLowerCase() === cust.name.trim().toLowerCase())
      );
      const totalReceipts = cReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

      const cPurchaseBills = safePurchaseBills.filter(
        (b) =>
          b.party_id === cust.id ||
          (b.party_name && b.party_name.trim().toLowerCase() === cust.name.trim().toLowerCase())
      );
      const totalPurchases = cPurchaseBills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const totalPurchasePaid = cPurchaseBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);

      const openingBal = cust.opening_balance || 0;
      const netBalance = (openingBal + totalSales - totalReceipts - totalAdvance) - (totalPurchases - totalPurchasePaid);

      const dates = [
        cust.created_at ? cust.created_at.split("T")[0] : null,
        ...cOrders.map((o) => o.order_date),
        ...cReceipts.map((r) => r.receipt_date),
        ...cPurchaseBills.map((b) => b.bill_date),
      ].filter(Boolean) as string[];

      const sortedDates = dates.sort().reverse();
      const rawLastDate = sortedDates[0] || "2026-08-25";

      let formattedLastDate = "25 Aug, 26";
      try {
        const dObj = new Date(rawLastDate);
        if (!isNaN(dObj.getTime())) {
          formattedLastDate = `${dObj.getDate()} ${dObj.toLocaleDateString("en-US", { month: "short" })}, ${String(dObj.getFullYear()).slice(2)}`;
        }
      } catch {}

      return {
        customer: cust,
        netBalance,
        formattedLastDate,
      };
    });
  }, [safeCustomers, safeOrders, safePaymentReceipts, safePurchaseBills]);

  const totalYoullGet = useMemo(() => {
    return partyBalancesList.filter((p) => p.netBalance > 0).reduce((sum, p) => sum + p.netBalance, 0);
  }, [partyBalancesList]);

  const totalYoullGive = useMemo(() => {
    return partyBalancesList.filter((p) => p.netBalance < 0).reduce((sum, p) => sum + Math.abs(p.netBalance), 0);
  }, [partyBalancesList]);

  const filteredPartyBalances = useMemo(() => {
    return partyBalancesList.filter((p) => {
      if (partySearchTerm) {
        const query = partySearchTerm.toLowerCase();
        const nameMatch = p.customer.name.toLowerCase().includes(query);
        const cityMatch = (p.customer.city || p.customer.address || "").toLowerCase().includes(query);
        const phoneMatch = (p.customer.phone || "").toLowerCase().includes(query);
        if (!nameMatch && !cityMatch && !phoneMatch) return false;
      }
      if (partyFilter === "get" && p.netBalance <= 0) return false;
      if (partyFilter === "give" && p.netBalance >= 0) return false;
      if (partyFilter === "zero" && p.netBalance !== 0) return false;

      return true;
    });
  }, [partyBalancesList, partySearchTerm, partyFilter]);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Mode Toggle Bar (Matching media_1787739698118.png) */}
      <div className="flex items-center gap-3 justify-center bg-white p-2 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto">
        <button
          onClick={() => setViewMode("transaction_details")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition text-center cursor-pointer ${
            viewMode === "transaction_details"
              ? "bg-[#00a651] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Transaction Details
        </button>
        <button
          onClick={() => setViewMode("party_balances")}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-extrabold transition text-center cursor-pointer ${
            viewMode === "party_balances"
              ? "bg-[#ff4d4d] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          Party Details
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">Party Balances & Financial Ledger</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Real-time party balances directory, receivables, payables & settlement statements
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

      {/* VIEW MODE 1: PARTY DETAILS & BALANCES DIRECTORY (Matching media_1787739698118.png) */}
      {viewMode === "party_balances" && (
        <div className="space-y-6">
          {/* Total Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-extrabold uppercase text-emerald-700 tracking-wider">Total You'll Get (Receivables)</span>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                ₹ {totalYoullGet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Outstanding sales balance to collect from farmers</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-extrabold uppercase text-red-600 tracking-wider">Total You'll Give (Payables)</span>
              <div className="text-2xl font-black text-red-600 font-mono mt-1">
                ₹ {totalYoullGive.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-red-500 font-medium mt-1">Outstanding bills payable to vendors & suppliers</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Total Active Parties</span>
              <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                {safeCustomers.length} Parties
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Registered farmers & nursery partners</p>
            </div>
          </div>

          {/* Party Balances Directory Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Search & Filter Toolbar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search any party by name, village or phone..."
                  value={partySearchTerm}
                  onChange={(e) => setPartySearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setPartyFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    partyFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({partyBalancesList.length})
                </button>
                <button
                  onClick={() => setPartyFilter("get")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    partyFilter === "get" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  You'll Get
                </button>
                <button
                  onClick={() => setPartyFilter("give")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    partyFilter === "give" ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  You'll Give
                </button>
              </div>
            </div>

            {/* Party Balances List (Matching media_1787739698118.png layout) */}
            <div className="divide-y divide-slate-100">
              {filteredPartyBalances.map((item) => {
                const isGet = item.netBalance > 0;
                const isGive = item.netBalance < 0;
                const absVal = Math.abs(item.netBalance);

                return (
                  <div
                    key={item.customer.id || item.customer.name}
                    onClick={() => {
                      setSelectedCustomerId(item.customer.id || "");
                      setViewMode("transaction_details");
                    }}
                    className="p-4 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-700 transition uppercase tracking-tight">
                        {item.customer.name} {item.customer.city ? item.customer.city.toUpperCase() : ""}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {item.formattedLastDate}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`font-black font-mono text-base ${
                          isGet
                            ? "text-[#00a651]"
                            : isGive
                            ? "text-[#ff4d4d]"
                            : "text-slate-700"
                        }`}
                      >
                        ₹ {absVal.toLocaleString("en-IN", { minimumFractionDigits: absVal % 1 === 0 ? 0 : 2 })}
                      </span>
                      {isGet ? (
                        <span className="text-[11px] font-bold text-[#00a651] mt-0.5">You'll Get</span>
                      ) : isGive ? (
                        <span className="text-[11px] font-bold text-[#ff4d4d] mt-0.5">You'll Give</span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 mt-0.5">₹ 0</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredPartyBalances.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium text-xs">
                  No party balances found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TRANSACTION DETAILS & LEDGER PASSBOOK */}
      {viewMode === "transaction_details" && (
        <div className="space-y-6">
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
            <div className="space-y-6">
              {/* Customer Summary Bar & Financial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Customer Details Box */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2 md:col-span-4 lg:col-span-1 border-l-4 border-l-emerald-600">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      PARTY
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

                {/* Net Balance Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    NET RUNNING BALANCE
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-black font-mono ${
                        ledgerMetrics.isReceivable ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      ₹{ledgerMetrics.absNetBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        ledgerMetrics.isReceivable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {ledgerMetrics.isReceivable ? "RECEIVABLE (GET)" : "PAYABLE (GIVE)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    {ledgerMetrics.isReceivable
                      ? "Customer owes this amount to the nursery"
                      : "Nursery owes this amount to the vendor"}
                  </p>
                </div>

                {/* Total Sales / Billed Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    TOTAL SALES BILLED
                  </span>
                  <div className="text-2xl font-black text-slate-800 font-mono">
                    ₹{ledgerMetrics.totalSalesBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 font-medium">
                    <span>{customerOrders.length} Sales Orders</span>
                    <span>Opening: ₹{ledgerMetrics.opening.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total Payments Received Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    TOTAL PAYMENTS RECEIVED
                  </span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    ₹{ledgerMetrics.totalPaymentsReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium pt-1">
                    Settled via cash, UPI, & bank receipts
                  </p>
                </div>
              </div>

              {/* Passbook Filter Controls & Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
                  {/* Search Bar */}
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search voucher number, particulars, crops..."
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

                                {/* Debit */}
                                <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                                  {t.debit > 0 ? `₹${t.debit.toLocaleString()}` : "-"}
                                </td>

                                {/* Credit */}
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
              </div>
            </div>
          )}
        </div>
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
  dispatches,
  sortField,
  sortDir,
  onEditOrder,
  onDeleteOrder,
  onSortChange,
}) => {
  const items = order.items || [];
  const transportVal = order.transport_charge || 0;
  const advanceVal = order.advance_payment || 0;
  const focVal = order.foc_amount || 0;

  const itemsSubtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
  const netTotalAmount = Math.max(0, itemsSubtotal + transportVal - focVal);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "date") {
        valA = a.sowing_date || a.dispatch_from || "";
        valB = b.sowing_date || b.dispatch_from || "";
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
    return arr;
  }, [items, sortField, sortDir]);

  return (
    <div className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-[#009b4d] font-bold rounded-lg text-xs font-mono">
            {order.order_no || `#ORD-${order.id}`}
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            Order Date: {order.order_date}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onEditOrder && (
            <button
              onClick={() => onEditOrder(order)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Bill</span>
            </button>
          )}
          {onDeleteOrder && (
            <button
              onClick={() => {
                if (window.confirm(`Delete Bill #${order.order_no || order.id}?`)) {
                  onDeleteOrder(order.id || order.order_no || "");
                }
              }}
              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Bill</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
              <th
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition"
                onClick={() => onSortChange("product")}
              >
                CROP VARIETY {sortField === "product" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition"
                onClick={() => onSortChange("qty")}
              >
                ORDERED QTY {sortField === "qty" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition"
                onClick={() => onSortChange("price")}
              >
                RATE (₹) {sortField === "price" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="py-2.5 px-3 text-right font-bold text-slate-700">LINE TOTAL (₹)</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition"
                onClick={() => onSortChange("date")}
              >
                SOWING / DISPATCH DATES {sortField === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {sortedItems.map((item, idx) => {
              const lineTot = (item.price || 0) * (item.quantity || 0);
              return (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    <span className="text-emerald-700">{item.product_name}</span>{" "}
                    <span className="text-slate-500 font-normal">({item.variant_name || "Std"})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    🌱 {(item.quantity || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono">₹{(item.price || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    ₹{lineTot.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    Sow: {item.sowing_date || "N/A"} | Disp: {item.dispatch_from || "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-3 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl text-xs">
        <div className="space-y-1 text-slate-500">
          <div>Items Subtotal: <strong className="text-slate-800 font-mono">₹{itemsSubtotal.toLocaleString()}</strong></div>
          {transportVal > 0 && <div>Transport Charge: <strong className="text-slate-800 font-mono">+₹{transportVal.toLocaleString()}</strong></div>}
          {focVal > 0 && <div>FOC Discount: <strong className="text-emerald-600 font-mono">-₹{focVal.toLocaleString()}</strong></div>}
          {advanceVal > 0 && <div>Advance Paid: <strong className="text-blue-600 font-mono">₹{advanceVal.toLocaleString()}</strong></div>}
        </div>

        <div className="text-right space-y-1">
          <div className="text-xs text-slate-500 font-bold uppercase">NET GRAND TOTAL</div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            ₹{netTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
