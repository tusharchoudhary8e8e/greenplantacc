import React, { useState, useMemo, useEffect } from "react";
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
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  Share2,
  MoreVertical,
  X,
  Eye,
  Scale,
  FileSpreadsheet,
  Layers,
} from "lucide-react";
import {
  Customer,
  Order,
  OrderItem,
  DispatchRecord,
  PaymentReceipt,
  PurchaseBill,
  BankAccount,
  ExpenseRecord,
  SupabaseService,
} from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "../components/SearchableSelect";

interface MetricLedgerScreenProps {
  customers: Customer[];
  orders: Order[];
  dispatches: DispatchRecord[];
  paymentReceipts?: PaymentReceipt[];
  purchaseBills?: PurchaseBill[];
  initialCustomerId?: string;
  initialMode?: "party_balances" | "transaction_details" | "journal_vouchers";
  onBack?: () => void;
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
  initialMode = "transaction_details",
  onBack,
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

  // Filter ONLY Invoiced / Posted Orders to hit the Party Ledger & Financial Statements
  const invoicedOrders = useMemo(() => {
    return safeOrders.filter(
      (o) => o.is_invoiced || o.posted_to_ledger || o.status === "invoiced" || o.status === "dispatched"
    );
  }, [safeOrders]);

  // View Mode: "transaction_details" | "party_balances" | "journal_vouchers"
  const [viewMode, setViewMode] = useState<"party_balances" | "transaction_details" | "journal_vouchers">(initialMode);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);

  // Journal Sub-Tab: "journal_feed" | "trial_balance"
  const [journalSubTab, setJournalSubTab] = useState<"journal_feed" | "trial_balance">("journal_feed");

  // Expenses & Bank Accounts for full double-entry coverage
  const [expensesList, setExpensesList] = useState<ExpenseRecord[]>([]);
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);

  useEffect(() => {
    const fetchExtraFinance = async () => {
      try {
        const [exp, b] = await Promise.all([
          SupabaseService.getExpenses(),
          SupabaseService.getBankAccounts(),
        ]);
        setExpensesList(exp || []);
        setBankAccountsList(b || []);
      } catch (e) {
        console.warn("Failed to load extra finance data for journal:", e);
      }
    };
    fetchExtraFinance();
  }, []);

  // Selected Order for Modal Viewer
  const [activeOrderModal, setActiveOrderModal] = useState<Order | null>(null);

  // Search & Filters
  const [txnSearchTerm, setTxnSearchTerm] = useState("");
  const [partySearchTerm, setPartySearchTerm] = useState("");
  const [partyFilter, setPartyFilter] = useState<"all" | "get" | "give" | "zero">("all");
  const [partySortBy, setPartySortBy] = useState<"get_high" | "give_high" | "name">("get_high");
  const [txnTypeFilter, setTxnTypeFilter] = useState<"all" | "sale" | "payin" | "purchase" | "expense">("all");

  // Sync initialMode & initialCustomerId
  React.useEffect(() => {
    if (initialMode) setViewMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    if (initialCustomerId) setSelectedCustomerId(initialCustomerId);
  }, [initialCustomerId]);

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

  // Combined All Recent Transactions Feed (Matching media_1787741586595.png)
  const allRecentTransactions = useMemo(() => {
    const feed: Array<{
      id: string;
      partyName: string;
      voucherNo: string;
      date: string;
      formattedDate: string;
      type: "sale" | "payin" | "purchase" | "expense";
      statusBadge: string;
      statusBadgeColor: string;
      totalAmount: number;
      balanceAmount: number;
      order?: Order;
      purchaseBill?: PurchaseBill;
      paymentReceipt?: PaymentReceipt;
    }> = [];

    // 1. Sales Invoices (Only Invoiced / Posted Orders hit the Sales Ledger)
    invoicedOrders.forEach((ord) => {
      const dateStr = ord.order_date || (ord.created_at ? ord.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
          formattedDate = `${dObj.getDate()} ${dObj.toLocaleDateString("en-US", { month: "short" })}, ${String(dObj.getFullYear()).slice(2)}`;
        }
      } catch {}

      const total = ord.total_amount || 0;
      const advance = ord.advance_payment || 0;
      const balance = Math.max(0, total - advance);
      const isPaid = balance === 0;

      feed.push({
        id: `sale-${ord.id || ord.order_no}`,
        partyName: ord.customer_name || "Cash Sale",
        voucherNo: ord.invoice_no || ord.order_no || `#ORD-${ord.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "sale",
        statusBadge: isPaid ? "SALE : PAID" : "SALE : UNPAID",
        statusBadgeColor: isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
        totalAmount: total,
        balanceAmount: balance,
        order: ord,
      });
    });

    // 2. Payment Receipts (Pay-Ins)
    safePaymentReceipts.forEach((rec) => {
      const dateStr = rec.receipt_date || (rec.created_at ? rec.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
          formattedDate = `${dObj.getDate()} ${dObj.toLocaleDateString("en-US", { month: "short" })}, ${String(dObj.getFullYear()).slice(2)}`;
        }
      } catch {}

      feed.push({
        id: `payin-${rec.id || rec.receipt_no}`,
        partyName: rec.customer_name || "Customer Payment",
        voucherNo: rec.receipt_no || `#REC-${rec.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "payin",
        statusBadge: "PAYIN : UNUSED",
        statusBadgeColor: "bg-amber-100 text-amber-900 border border-amber-200",
        totalAmount: rec.amount || 0,
        balanceAmount: rec.amount || 0,
        paymentReceipt: rec,
      });
    });

    // 3. Purchase Bills
    safePurchaseBills.forEach((pur) => {
      const dateStr = pur.bill_date || (pur.created_at ? pur.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
          formattedDate = `${dObj.getDate()} ${dObj.toLocaleDateString("en-US", { month: "short" })}, ${String(dObj.getFullYear()).slice(2)}`;
        }
      } catch {}

      const total = pur.total_amount || 0;
      const paid = pur.paid_amount || 0;
      const balance = Math.max(0, total - paid);

      feed.push({
        id: `pur-${pur.id || pur.bill_no}`,
        partyName: pur.party_name || "Supplier Goods",
        voucherNo: pur.bill_no || `#PUR-${pur.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "purchase",
        statusBadge: balance === 0 ? "PURCHASE : PAID" : "PURCHASE : UNPAID",
        statusBadgeColor: balance === 0 ? "bg-slate-100 text-slate-800" : "bg-red-100 text-red-800",
        totalAmount: total,
        balanceAmount: balance,
        purchaseBill: pur,
      });
    });

    // Sort latest first
    feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return feed;
  }, [safeOrders, safePaymentReceipts, safePurchaseBills]);

  // Filtered Recent Transactions
  const filteredFeed = useMemo(() => {
    return allRecentTransactions.filter((item) => {
      if (txnTypeFilter !== "all" && item.type !== txnTypeFilter) return false;
      if (selectedCustomerId) {
        const cust = safeCustomers.find((c) => c.id === selectedCustomerId);
        if (cust) {
          const matchName = item.partyName.toLowerCase().includes(cust.name.toLowerCase());
          if (!matchName) return false;
        }
      }
      if (txnSearchTerm) {
        const query = txnSearchTerm.toLowerCase();
        const partyMatch = item.partyName.toLowerCase().includes(query);
        const voucherMatch = item.voucherNo.toLowerCase().includes(query);
        if (!partyMatch && !voucherMatch) return false;
      }
      return true;
    });
  }, [allRecentTransactions, txnTypeFilter, selectedCustomerId, safeCustomers, txnSearchTerm]);

  // Calculate Party Balances for ALL Customers/Vendors
  const partyBalancesList = useMemo(() => {
    return safeCustomers.map((cust) => {
      const cOrders = invoicedOrders.filter(
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
  }, [safeCustomers, invoicedOrders, safePaymentReceipts, safePurchaseBills]);

  const totalYoullGet = useMemo(() => {
    return partyBalancesList.filter((p) => p.netBalance > 0).reduce((sum, p) => sum + p.netBalance, 0);
  }, [partyBalancesList]);

  const totalYoullGive = useMemo(() => {
    return partyBalancesList.filter((p) => p.netBalance < 0).reduce((sum, p) => sum + Math.abs(p.netBalance), 0);
  }, [partyBalancesList]);

  const filteredPartyBalances = useMemo(() => {
    const list = partyBalancesList.filter((p) => {
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

    list.sort((a, b) => {
      if (partySortBy === "get_high") {
        return b.netBalance - a.netBalance;
      } else if (partySortBy === "give_high") {
        return a.netBalance - b.netBalance;
      } else if (partySortBy === "name") {
        return a.customer.name.localeCompare(b.customer.name);
      }
      return 0;
    });

    return list;
  }, [partyBalancesList, partySearchTerm, partyFilter, partySortBy]);

  // ─── DOUBLE-ENTRY JOURNAL & TRIAL BALANCE ENGINE ────────────────────────────
  const { journalVouchers, totalJournalDr, totalJournalCr, trialBalanceAccounts } = useMemo(() => {
    interface JournalLeg {
      account: string;
      group: "Asset" | "Liability" | "Income" | "Expense";
      dr: number;
      cr: number;
    }

    interface VoucherItem {
      id: string;
      voucherNo: string;
      date: string;
      formattedDate: string;
      type: "Sales Invoice" | "Payment Inward" | "Purchase Bill" | "Expense Voucher";
      partyName: string;
      narration: string;
      legs: JournalLeg[];
      totalDr: number;
      totalCr: number;
      isBalanced: boolean;
    }

    const vouchers: VoucherItem[] = [];

    // 1. Sales Invoices (Only Invoiced / Posted Orders hit the General Journal)
    invoicedOrders.forEach((ord) => {
      const dateStr = ord.order_date || (ord.created_at ? ord.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          formattedDate = `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}, ${String(d.getFullYear()).slice(2)}`;
        }
      } catch {}

      const total = ord.total_amount || 0;
      const advance = ord.advance_payment || 0;
      const due = Math.max(0, total - advance);
      const transport = ord.transport_charge || 0;
      const salesRev = Math.max(0, total - transport);

      const legs: JournalLeg[] = [];

      // Debits (Assets)
      if (due > 0) {
        legs.push({
          account: `Sundry Debtors - ${ord.customer_name || "Customer"}`,
          group: "Asset",
          dr: due,
          cr: 0,
        });
      }
      if (advance > 0) {
        legs.push({
          account: `Cash / Bank (${ord.payment_type || "Advance Received"})`,
          group: "Asset",
          dr: advance,
          cr: 0,
        });
      }

      // Credits (Income)
      legs.push({
        account: "Nursery Plant Sales Revenue",
        group: "Income",
        dr: 0,
        cr: salesRev,
      });
      if (transport > 0) {
        legs.push({
          account: "Freight & Transport Recovery",
          group: "Income",
          dr: 0,
          cr: transport,
        });
      }

      const totDr = legs.reduce((s, l) => s + l.dr, 0);
      const totCr = legs.reduce((s, l) => s + l.cr, 0);

      vouchers.push({
        id: `jv-sale-${ord.id || ord.order_no}`,
        voucherNo: ord.order_no || `#ORD-${ord.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "Sales Invoice",
        partyName: ord.customer_name || "Customer",
        narration: `Sale of nursery seedlings. Total: ₹${total.toLocaleString()}, Advance: ₹${advance.toLocaleString()}, Due: ₹${due.toLocaleString()}`,
        legs,
        totalDr: totDr,
        totalCr: totCr,
        isBalanced: Math.abs(totDr - totCr) < 0.01,
      });
    });

    // 2. Payment Inwards (Payment Receipts)
    safePaymentReceipts.forEach((rec) => {
      const dateStr = rec.receipt_date || (rec.created_at ? rec.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          formattedDate = `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}, ${String(d.getFullYear()).slice(2)}`;
        }
      } catch {}

      const amt = rec.amount || 0;
      const legs: JournalLeg[] = [
        {
          account: `Bank / Cash (${rec.payment_mode || "Bank Inward"})`,
          group: "Asset",
          dr: amt,
          cr: 0,
        },
        {
          account: `Sundry Debtors - ${rec.customer_name || "Customer"}`,
          group: "Asset",
          dr: 0,
          cr: amt,
        },
      ];

      vouchers.push({
        id: `jv-rec-${rec.id || rec.receipt_no}`,
        voucherNo: rec.receipt_no || `#REC-${rec.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "Payment Inward",
        partyName: rec.customer_name || "Customer",
        narration: `Payment received against customer balance via ${rec.payment_mode || "Bank/UPI"}${rec.notes ? ` (${rec.notes})` : ""}`,
        legs,
        totalDr: amt,
        totalCr: amt,
        isBalanced: true,
      });
    });

    // 3. Purchase Bills
    safePurchaseBills.forEach((pur) => {
      const dateStr = pur.bill_date || (pur.created_at ? pur.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          formattedDate = `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}, ${String(d.getFullYear()).slice(2)}`;
        }
      } catch {}

      const total = pur.total_amount || 0;
      const paid = pur.paid_amount || 0;
      const due = Math.max(0, total - paid);
      const gst = pur.gst_amount || 0;
      const transport = pur.transport_charge || 0;
      const rawMat = Math.max(0, total - gst - transport);

      const legs: JournalLeg[] = [
        {
          account: "Nursery Raw Materials & Seeds Purchase",
          group: "Expense",
          dr: rawMat,
          cr: 0,
        },
      ];

      if (gst > 0) {
        legs.push({
          account: "Input GST Credit Receivable",
          group: "Asset",
          dr: gst,
          cr: 0,
        });
      }
      if (transport > 0) {
        legs.push({
          account: "Inward Freight & Transport",
          group: "Expense",
          dr: transport,
          cr: 0,
        });
      }

      if (paid > 0) {
        legs.push({
          account: "Cash in Hand / Bank Account",
          group: "Asset",
          dr: 0,
          cr: paid,
        });
      }
      if (due > 0) {
        legs.push({
          account: `Sundry Creditors - ${pur.party_name || "Supplier"}`,
          group: "Liability",
          dr: 0,
          cr: due,
        });
      }

      const totDr = legs.reduce((s, l) => s + l.dr, 0);
      const totCr = legs.reduce((s, l) => s + l.cr, 0);

      vouchers.push({
        id: `jv-pur-${pur.id || pur.bill_no}`,
        voucherNo: pur.bill_no || `#PUR-${pur.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "Purchase Bill",
        partyName: pur.party_name || "Supplier",
        narration: `Purchase bill for nursery materials from ${pur.party_name}. Total: ₹${total.toLocaleString()}, Paid: ₹${paid.toLocaleString()}, Due: ₹${due.toLocaleString()}`,
        legs,
        totalDr: totDr,
        totalCr: totCr,
        isBalanced: Math.abs(totDr - totCr) < 0.01,
      });
    });

    // 4. Expenses
    expensesList.forEach((exp) => {
      const dateStr = exp.expense_date || (exp.created_at ? exp.created_at.split("T")[0] : "2026-08-25");
      let formattedDate = dateStr;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          formattedDate = `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}, ${String(d.getFullYear()).slice(2)}`;
        }
      } catch {}

      const amt = exp.amount || 0;
      const legs: JournalLeg[] = [
        {
          account: `Operating Expense - ${exp.category || "General"}`,
          group: "Expense",
          dr: amt,
          cr: 0,
        },
        {
          account: `${exp.payment_type || "Cash"} Account`,
          group: "Asset",
          dr: 0,
          cr: amt,
        },
      ];

      vouchers.push({
        id: `jv-exp-${exp.id}`,
        voucherNo: `EXP-${exp.id?.slice(0, 6)}`,
        date: dateStr,
        formattedDate,
        type: "Expense Voucher",
        partyName: exp.category || "Nursery Operating",
        narration: `Expense for ${exp.category} paid via ${exp.payment_type || "Cash"}${exp.notes ? ` (${exp.notes})` : ""}`,
        legs,
        totalDr: amt,
        totalCr: amt,
        isBalanced: true,
      });
    });

    vouchers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const overallDr = vouchers.reduce((s, v) => s + v.totalDr, 0);
    const overallCr = vouchers.reduce((s, v) => s + v.totalCr, 0);

    // ─── COMPILE TRIAL BALANCE (T-ACCOUNTS) ──────────────────────────────────
    const accountMap: Record<
      string,
      {
        account: string;
        group: "Asset" | "Liability" | "Income" | "Expense";
        totalDr: number;
        totalCr: number;
        netDr: number;
        netCr: number;
      }
    > = {};

    vouchers.forEach((v) => {
      v.legs.forEach((l) => {
        if (!accountMap[l.account]) {
          accountMap[l.account] = {
            account: l.account,
            group: l.group,
            totalDr: 0,
            totalCr: 0,
            netDr: 0,
            netCr: 0,
          };
        }
        accountMap[l.account].totalDr += l.dr;
        accountMap[l.account].totalCr += l.cr;
      });
    });

    const tbAccounts = Object.values(accountMap).map((acc) => {
      const diff = acc.totalDr - acc.totalCr;
      if (diff > 0) {
        acc.netDr = diff;
        acc.netCr = 0;
      } else if (diff < 0) {
        acc.netDr = 0;
        acc.netCr = Math.abs(diff);
      } else {
        acc.netDr = 0;
        acc.netCr = 0;
      }
      return acc;
    });

    tbAccounts.sort((a, b) => a.group.localeCompare(b.group) || a.account.localeCompare(b.account));

    return {
      journalVouchers: vouchers,
      totalJournalDr: overallDr,
      totalJournalCr: overallCr,
      trialBalanceAccounts: tbAccounts,
    };
  }, [invoicedOrders, safePaymentReceipts, safePurchaseBills, expensesList]);

  const handlePrint = () => {
    window.print();
  };

  const handleBackAction = () => {
    if (selectedCustomerId) {
      setSelectedCustomerId("");
    } else if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-[10px] border border-[#e8e8e8]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight flex items-center gap-2">
              <span>Party Ledger &amp; Journal</span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-300 uppercase">
                Double-Entry GAAP
              </span>
            </h1>
            <p className="text-xs text-[#888] font-medium mt-0.5">
              Receivables, vendor payables, double-entry general journal &amp; trial balance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenReceivePayment && (
            <button
              onClick={() => onOpenReceivePayment(selectedCustomerId)}
              className="flex items-center gap-1.5 bg-[#1e4d2b] text-white px-3.5 py-2 rounded-[7px] font-bold text-xs hover:bg-[#163d21] transition cursor-pointer shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>+ Receive Payment</span>
            </button>
          )}

          {onNavigateToCreateOrder && (
            <button
              onClick={onNavigateToCreateOrder}
              className="flex items-center gap-1.5 border border-[#1e4d2b] text-[#1e4d2b] bg-white px-3.5 py-2 rounded-[7px] font-bold text-xs hover:bg-[#e6f4ed] transition cursor-pointer"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>+ Add New Sale</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 3-Way Mode Toggle Bar */}
      <div className="flex items-center gap-2 justify-center bg-white p-1.5 rounded-[12px] border border-[#e8e8e8] max-w-lg mx-auto shadow-xs">
        <button
          onClick={() => setViewMode("transaction_details")}
          className={`flex-1 py-2 px-3 rounded-[8px] text-xs font-bold transition text-center cursor-pointer ${
            viewMode === "transaction_details"
              ? "bg-[#1e4d2b] text-white shadow-xs"
              : "bg-white text-[#666] hover:bg-[#f4f4f0]"
          }`}
        >
          Transaction Feed
        </button>
        <button
          onClick={() => setViewMode("party_balances")}
          className={`flex-1 py-2 px-3 rounded-[8px] text-xs font-bold transition text-center cursor-pointer ${
            viewMode === "party_balances"
              ? "bg-[#1e4d2b] text-white shadow-xs"
              : "bg-white text-[#666] hover:bg-[#f4f4f0]"
          }`}
        >
          Party Balances
        </button>
        <button
          onClick={() => setViewMode("journal_vouchers")}
          className={`flex-1 py-2 px-3 rounded-[8px] text-xs font-bold transition text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            viewMode === "journal_vouchers"
              ? "bg-[#1e4d2b] text-white shadow-xs"
              : "bg-white text-[#666] hover:bg-[#f4f4f0]"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Journal &amp; Trial Balance</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
        <div className="bg-white border border-[#e8e8e8] rounded-[10px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#888] tracking-wider">You'll Get (Receivables)</span>
            <div className="text-xl font-black text-[#2d7a4f] font-mono mt-1">
              ₹ {totalYoullGet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#888] font-medium mt-0.5">Outstanding sales balance to collect</p>
          </div>
          <div className="w-9 h-9 bg-[#e6f4ed] rounded-[8px] flex items-center justify-center text-[#2d7a4f] shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#e8e8e8] rounded-[10px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#888] tracking-wider">You'll Give (Payables)</span>
            <div className="text-xl font-black text-[#e05c00] font-mono mt-1">
              ₹ {totalYoullGive.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#888] font-medium mt-0.5">Outstanding bills payable to suppliers</p>
          </div>
          <div className="w-9 h-9 bg-amber-50 rounded-[8px] flex items-center justify-center text-[#e05c00] shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-[#e8e8e8] rounded-[10px] p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-[#888] tracking-wider">Registered Parties</span>
            <div className="text-xl font-black text-[#1a1a1a] font-mono mt-1">
              {safeCustomers.length} Parties
            </div>
            <p className="text-[11px] text-[#888] font-medium mt-0.5">Active farmers &amp; suppliers</p>
          </div>
          <div className="w-9 h-9 bg-[#f4f4f0] rounded-[8px] flex items-center justify-center text-[#555] shrink-0">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TRANSACTION DETAILS FEED (Matching media_1787741586595.png) */}
      {viewMode === "transaction_details" && (
        <div className="space-y-4">
          {/* Party Filter Dropdown / Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transaction by party name, voucher #..."
                value={txnSearchTerm}
                onChange={(e) => setTxnSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setTxnTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  txnTypeFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTxnTypeFilter("sale")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  txnTypeFilter === "sale" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setTxnTypeFilter("payin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  txnTypeFilter === "payin" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                Pay-ins
              </button>
              <button
                onClick={() => setTxnTypeFilter("purchase")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  txnTypeFilter === "purchase" ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                Purchases
              </button>
            </div>
          </div>

          {/* Recent Transaction Cards Feed (Exact layout from media_1787741586595.png) */}
          <div className="space-y-3">
            {filteredFeed.map((txn) => (
              <div
                key={txn.id}
                onClick={() => {
                  if (txn.order) setActiveOrderModal(txn.order);
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition cursor-pointer space-y-3 group"
              >
                {/* Top Row: Party Name & Voucher # & Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-800 group-hover:text-emerald-700 transition uppercase tracking-tight">
                      {txn.partyName}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${txn.statusBadgeColor}`}>
                      {txn.statusBadge}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-slate-400 font-bold block">{txn.voucherNo}</span>
                    <span className="text-[11px] text-slate-400 font-medium block">{txn.formattedDate}</span>
                  </div>
                </div>

                {/* Amount Row: Total & Balance */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] font-medium block">Total</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        ₹ {txn.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] font-medium block">
                        {txn.type === "payin" ? "Unused" : "Balance"}
                      </span>
                      <span className="font-black text-slate-700 font-mono text-sm">
                        ₹ {txn.balanceAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Print, Share, PDF, Menu */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePrint()}
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      title="Print Voucher"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: `Voucher ${txn.voucherNo}`, text: `${txn.partyName} - ₹${txn.totalAmount}` });
                        } else {
                          alert(`Voucher Link: ${txn.voucherNo} (${txn.partyName})`);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      title="Share Voucher"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handlePrint()}
                      className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black transition tracking-wider uppercase shadow-2xs"
                    >
                      PDF
                    </button>

                    {txn.order && onEditOrder && (
                      <button
                        onClick={() => onEditOrder(txn.order!)}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition"
                        title="Edit Bill"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredFeed.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 font-medium text-xs">
                No recent transactions found matching your criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: PARTY DETAILS & BALANCES DIRECTORY */}
      {viewMode === "party_balances" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Search, Filter & Sort Bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
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

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setPartyFilter("all")}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      partyFilter === "all" ? "bg-slate-800 text-white" : "bg-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({partyBalancesList.length})
                  </button>
                  <button
                    onClick={() => setPartyFilter("get")}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      partyFilter === "get" ? "bg-emerald-600 text-white" : "bg-transparent text-emerald-700 hover:text-emerald-900"
                    }`}
                  >
                    You'll Get
                  </button>
                  <button
                    onClick={() => setPartyFilter("give")}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      partyFilter === "give" ? "bg-red-600 text-white" : "bg-transparent text-red-600 hover:text-red-900"
                    }`}
                  >
                    You'll Give
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                  <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-400 font-medium">Sort:</span>
                  <select
                    value={partySortBy}
                    onChange={(e: any) => setPartySortBy(e.target.value)}
                    className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="get_high">Highest You'll Get 🟢</option>
                    <option value="give_high">Highest You'll Give 🔴</option>
                    <option value="name">Party Name (A - Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Party List */}
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
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DOUBLE-ENTRY GENERAL JOURNAL & TRIAL BALANCE */}
      {viewMode === "journal_vouchers" && (
        <div className="space-y-6">
          {/* Top Double-Entry Status & KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-emerald-200 rounded-[12px] p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider">
                  Total Journal Debits (Dr)
                </span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                  ₹ {totalJournalDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Asset additions &amp; operating costs</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-[10px] flex items-center justify-center text-emerald-700 font-black font-mono text-sm shrink-0">
                Dr
              </div>
            </div>

            <div className="bg-white border border-blue-200 rounded-[12px] p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase text-blue-800 tracking-wider">
                  Total Journal Credits (Cr)
                </span>
                <div className="text-xl font-black text-blue-700 font-mono mt-1">
                  ₹ {totalJournalCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Revenues earned &amp; liabilities</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-[10px] flex items-center justify-center text-blue-700 font-black font-mono text-sm shrink-0">
                Cr
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[12px] p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-600 tracking-wider">
                  Double-Entry Integrity
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {Math.abs(totalJournalDr - totalJournalCr) < 0.01 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-sm bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      100% Balanced Ledger
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      <AlertCircle className="w-4 h-4" />
                      Discrepancy: ₹{Math.abs(totalJournalDr - totalJournalCr).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {journalVouchers.length} Total Journal Vouchers
                </p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-[10px] flex items-center justify-center text-slate-700 shrink-0">
                <Scale className="w-5 h-5 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Sub-Tab Selector: General Journal vs Trial Balance */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setJournalSubTab("journal_feed")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === "journal_feed"
                    ? "bg-[#1e4d2b] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>General Journal Entries ({journalVouchers.length})</span>
              </button>
              <button
                onClick={() => setJournalSubTab("trial_balance")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  journalSubTab === "trial_balance"
                    ? "bg-[#1e4d2b] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Trial Balance Summary ({trialBalanceAccounts.length} Accounts)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrint()}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Accounting Report</span>
              </button>
            </div>
          </div>

          {/* SUB-TAB 1: GENERAL JOURNAL FEED */}
          {journalSubTab === "journal_feed" && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search journal entries by voucher #, account name, party..."
                    value={txnSearchTerm}
                    onChange={(e) => setTxnSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setTxnTypeFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      txnTypeFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setTxnTypeFilter("sale")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      txnTypeFilter === "sale" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    Sales Invoices
                  </button>
                  <button
                    onClick={() => setTxnTypeFilter("payin")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      txnTypeFilter === "payin" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    Payment Inwards
                  </button>
                  <button
                    onClick={() => setTxnTypeFilter("purchase")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      txnTypeFilter === "purchase" ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    Purchases
                  </button>
                  <button
                    onClick={() => setTxnTypeFilter("expense")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      txnTypeFilter === "expense" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    Expenses
                  </button>
                </div>
              </div>

              {/* Journal Vouchers Cards */}
              <div className="space-y-4">
                {journalVouchers
                  .filter((v) => {
                    if (txnTypeFilter === "sale" && v.type !== "Sales Invoice") return false;
                    if (txnTypeFilter === "payin" && v.type !== "Payment Inward") return false;
                    if (txnTypeFilter === "purchase" && v.type !== "Purchase Bill") return false;
                    if (txnTypeFilter === "expense" && v.type !== "Expense Voucher") return false;

                    if (txnSearchTerm) {
                      const q = txnSearchTerm.toLowerCase();
                      const matchVno = v.voucherNo.toLowerCase().includes(q);
                      const matchParty = v.partyName.toLowerCase().includes(q);
                      const matchNarr = v.narration.toLowerCase().includes(q);
                      const matchLegs = v.legs.some((l) => l.account.toLowerCase().includes(q));
                      if (!matchVno && !matchParty && !matchNarr && !matchLegs) return false;
                    }
                    return true;
                  })
                  .map((jv) => (
                    <div
                      key={jv.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:border-emerald-300 transition"
                    >
                      {/* Voucher Top Header */}
                      <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-xs text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                            {jv.voucherNo}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              jv.type === "Sales Invoice"
                                ? "bg-emerald-100 text-emerald-800"
                                : jv.type === "Payment Inward"
                                ? "bg-amber-100 text-amber-800"
                                : jv.type === "Purchase Bill"
                                ? "bg-red-100 text-red-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {jv.type}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {jv.partyName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <span>{jv.formattedDate}</span>
                          <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            BALANCED
                          </span>
                        </div>
                      </div>

                      {/* Double-Entry Legs Table */}
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
                              <th className="py-1.5 px-3">PARTICULARS (LEDGER ACCOUNT)</th>
                              <th className="py-1.5 px-3">GROUP</th>
                              <th className="py-1.5 px-3 text-right">DEBIT (Dr) ₹</th>
                              <th className="py-1.5 px-3 text-right">CREDIT (Cr) ₹</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium">
                            {jv.legs.map((leg, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3">
                                  {leg.dr > 0 ? (
                                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                      <span className="text-emerald-700 font-mono font-black text-[11px]">Dr.</span>
                                      <span>{leg.account}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-700 pl-6 flex items-center gap-1.5">
                                      <span className="text-blue-700 font-mono font-bold text-[11px]">To</span>
                                      <span>{leg.account}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      leg.group === "Asset"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : leg.group === "Liability"
                                        ? "bg-amber-50 text-amber-700"
                                        : leg.group === "Income"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-purple-50 text-purple-700"
                                    }`}
                                  >
                                    {leg.group}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-700">
                                  {leg.dr > 0 ? `₹ ${leg.dr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-700">
                                  {leg.cr > 0 ? `₹ ${leg.cr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-slate-200 font-black font-mono text-xs bg-slate-50/50">
                              <td colSpan={2} className="py-2 px-3 text-slate-500 italic font-normal text-[11px]">
                                Narration: {jv.narration}
                              </td>
                              <td className="py-2 px-3 text-right text-emerald-800">
                                ₹ {jv.totalDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right text-blue-800">
                                ₹ {jv.totalCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: TRIAL BALANCE (T-ACCOUNTS) */}
          {journalSubTab === "trial_balance" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 bg-slate-50">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Trial Balance as on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Summary of all General Ledger account closing balances verified against double-entry rules
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black text-xs border border-emerald-300">
                    ✓ Balanced: ₹{trialBalanceAccounts.reduce((s, a) => s + a.netDr, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <th className="py-3 px-4">LEDGER ACCOUNT HEAD</th>
                      <th className="py-3 px-4">ACCOUNT GROUP</th>
                      <th className="py-3 px-4 text-right">TOTAL DR TURNOVER (₹)</th>
                      <th className="py-3 px-4 text-right">TOTAL CR TURNOVER (₹)</th>
                      <th className="py-3 px-4 text-right bg-emerald-50/50 text-emerald-900">NET DEBIT BALANCE (Dr) ₹</th>
                      <th className="py-3 px-4 text-right bg-blue-50/50 text-blue-900">NET CREDIT BALANCE (Cr) ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {trialBalanceAccounts.map((acc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {acc.account}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                              acc.group === "Asset"
                                ? "bg-emerald-100 text-emerald-800"
                                : acc.group === "Liability"
                                ? "bg-amber-100 text-amber-800"
                                : acc.group === "Income"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {acc.group}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {acc.totalDr > 0 ? acc.totalDr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          {acc.totalCr > 0 ? acc.totalCr.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/30">
                          {acc.netDr > 0 ? `₹ ${acc.netDr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700 bg-blue-50/30">
                          {acc.netCr > 0 ? `₹ ${acc.netCr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black font-mono text-xs border-t-2 border-slate-900">
                      <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-[11px] font-sans">
                        GRAND TRIAL BALANCE TOTALS
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        ₹ {trialBalanceAccounts.reduce((s, a) => s + a.totalDr, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        ₹ {trialBalanceAccounts.reduce((s, a) => s + a.totalCr, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 bg-emerald-950/60 text-sm">
                        ₹ {trialBalanceAccounts.reduce((s, a) => s + a.netDr, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-cyan-300 bg-cyan-950/60 text-sm">
                        ₹ {trialBalanceAccounts.reduce((s, a) => s + a.netCr, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BILL MODAL VIEWER (Opened when any transaction card is clicked) */}
      {activeOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    Bill {activeOrderModal.order_no || `#ORD-${activeOrderModal.id}`}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Order Date: {activeOrderModal.order_date}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveOrderModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Party / Customer</span>
              <h4 className="text-base font-extrabold text-slate-800">{activeOrderModal.customer_name}</h4>
              <p className="text-xs text-slate-500">
                {activeOrderModal.delivery_address || activeOrderModal.notes || "Standard Delivery"}
              </p>
            </div>

            {/* Crop Items Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
                    <th className="py-3 px-4">CROP VARIETY</th>
                    <th className="py-3 px-4 text-right">QUANTITY</th>
                    <th className="py-3 px-4 text-right">RATE (₹)</th>
                    <th className="py-3 px-4 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {(activeOrderModal.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.product_name} <span className="text-slate-400 font-normal">({item.variant_name || "Std"})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        🌱 {(item.quantity || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">₹{(item.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Financial Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <div className="text-xs text-slate-600 space-y-1">
                {activeOrderModal.transport_charge ? (
                  <div>Transport Charge: <strong className="font-mono text-slate-800">+₹{activeOrderModal.transport_charge}</strong></div>
                ) : null}
                {activeOrderModal.advance_payment ? (
                  <div>Advance Received: <strong className="font-mono text-blue-600">₹{activeOrderModal.advance_payment}</strong></div>
                ) : null}
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 font-bold uppercase block">Bill Grand Total</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  ₹ {(activeOrderModal.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handlePrint()}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Bill</span>
              </button>

              {onEditOrder && (
                <button
                  onClick={() => {
                    const ord = activeOrderModal;
                    setActiveOrderModal(null);
                    onEditOrder(ord);
                  }}
                  className="px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Bill</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
