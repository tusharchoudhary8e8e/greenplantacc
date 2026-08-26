import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Building2,
  Package,
  ArrowRight,
  Plus,
  Receipt,
  Tag,
  DollarSign,
  User,
} from "lucide-react";
import {
  Customer,
  Order,
  PurchaseBill,
  BankAccount,
  ExpenseRecord,
  SupabaseService,
} from "../../db/supabaseService";

interface DashboardProps {
  customers: Customer[];
  orders: Order[];
  purchaseBills?: PurchaseBill[];
  onNavigateToTab: (tab: string) => void;
}

export const MetricDashboardScreen: React.FC<DashboardProps> = ({
  customers = [],
  orders = [],
  purchaseBills = [],
  onNavigateToTab,
}) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safePurchaseBills = Array.isArray(purchaseBills) ? purchaseBills : [];

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const bList = await SupabaseService.getBankAccounts();
      const eList = await SupabaseService.getExpenses();
      setBankAccounts(bList);
      setExpenses(eList);
    };
    fetchData();
  }, []);

  // 1. Dynamic Receivables (You'll Get) Calculation
  const totalYoullGet = useMemo(() => {
    return safeCustomers.reduce((sum, cust) => {
      const cOrders = safeOrders.filter(
        (o) =>
          o.customer_id === cust.id ||
          (o.customer_name && o.customer_name.trim().toLowerCase() === cust.name.trim().toLowerCase())
      );
      const totalSales = cOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const totalAdvance = cOrders.reduce((s, o) => s + (o.advance_payment || 0), 0);
      const opening = cust.opening_balance || 0;
      const net = opening + totalSales - totalAdvance;
      return net > 0 ? sum + net : sum;
    }, 0);
  }, [safeCustomers, safeOrders]);

  // 2. Dynamic Payables (You'll Give) Calculation
  const totalYoullGive = useMemo(() => {
    return safePurchaseBills.reduce((sum, b) => {
      const due = (b.total_amount || 0) - (b.paid_amount || 0);
      return due > 0 ? sum + due : sum;
    }, 0);
  }, [safePurchaseBills]);

  // 3. Current Month & Previous Month Sales Calculations
  const { salesThisMonth, salesLastMonth, salesTrendPct, monthlySalesChartData } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthTotalsMap: Record<string, number> = {};

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${monthNames[d.getMonth()]}`;
      monthTotalsMap[key] = 0;
    }

    safeOrders.forEach((ord) => {
      if (!ord.order_date) return;
      const d = new Date(ord.order_date);
      if (isNaN(d.getTime())) return;

      const amt = ord.total_amount || 0;
      const oYear = d.getFullYear();
      const oMonth = d.getMonth();

      if (oYear === currentYear && oMonth === currentMonth) {
        thisMonthTotal += amt;
      } else if (
        (currentMonth === 0 && oYear === currentYear - 1 && oMonth === 11) ||
        (oYear === currentYear && oMonth === currentMonth - 1)
      ) {
        lastMonthTotal += amt;
      }

      const key = `${monthNames[oMonth]}`;
      if (monthTotalsMap[key] !== undefined) {
        monthTotalsMap[key] += amt;
      }
    });

    // Trend %
    let trend = 0;
    if (lastMonthTotal > 0) {
      trend = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (thisMonthTotal > 0) {
      trend = 100;
    }

    const chartData = Object.entries(monthTotalsMap).map(([name, sale]) => ({
      name,
      sale,
    }));

    return {
      salesThisMonth: thisMonthTotal,
      salesLastMonth: lastMonthTotal,
      salesTrendPct: trend,
      monthlySalesChartData: chartData,
    };
  }, [safeOrders]);

  // 4. Purchases & Expenses This Month
  const purchasesThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return safePurchaseBills.reduce((sum, b) => {
      if (!b.bill_date) return sum;
      const d = new Date(b.bill_date);
      if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return sum + (b.total_amount || 0);
      }
      return sum;
    }, 0);
  }, [safePurchaseBills]);

  const expensesThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return expenses.reduce((sum, e) => {
      if (!e.expense_date) return sum;
      const d = new Date(e.expense_date);
      if (!isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        return sum + (e.total_amount || 0);
      }
      return sum;
    }, 0);
  }, [expenses]);

  // 5. Live Bank & Cash Balances
  const totalBankBalance = useMemo(() => {
    return bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
  }, [bankAccounts]);

  const totalCashInHand = useMemo(() => {
    // Computed dynamically from real user receipts & expenses
    const cashAdvances = safeOrders.reduce((sum, o) => sum + (o.advance_payment || 0), 0);
    const cashExpenses = expenses
      .filter((e) => e.payment_type === "Cash")
      .reduce((sum, e) => sum + (e.total_amount || 0), 0);
    return Math.max(0, cashAdvances - cashExpenses);
  }, [safeOrders, expenses]);

  // 6. Dynamic Inventory Stock Value
  const { totalStockValue, itemCount } = useMemo(() => {
    let val = 0;
    let count = 0;
    safeOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        val += (item.quantity || 0) * (item.price || 0);
        count++;
      });
    });
    return { totalStockValue: val, itemCount: count };
  }, [safeOrders]);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "short" });
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Receivables (You'll Get) & Payables (You'll Give) Cards (Matching media_1787752474489.png) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateToTab("ledger")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-extrabold uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span>You'll Get</span>
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1 group-hover:text-emerald-700 transition">
              ₹ {totalYoullGet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
        </div>

        <div
          onClick={() => onNavigateToTab("ledger")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-extrabold uppercase text-red-500 tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
              </span>
              <span>You'll Give</span>
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-1 group-hover:text-red-600 transition">
              ₹ {totalYoullGive.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition" />
        </div>
      </div>

      {/* Your Sale Overview Card (Matching media_1787752474489.png) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
            Your Sale Overview ({currentMonthName})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Dynamically computed from sales bills</span>
        </div>

        <div className="text-center space-y-1 pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Sale</span>
          <div className="text-3xl font-black text-red-500 font-mono">
            ₹ {salesThisMonth.toLocaleString("en-IN")}
          </div>

          {/* Dynamic Trend Badge */}
          <div className="pt-1 flex items-center justify-center">
            {salesTrendPct < 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{Math.abs(salesTrendPct).toFixed(0)}% Decline This Month</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{salesTrendPct.toFixed(0)}% Growth This Month</span>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Sales Chart */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlySalesChartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, "Sales"]} />
              <Area type="monotone" dataKey="sale" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Summary: Purchases & Expenses (Matching media_1787752474489.png) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateToTab("purchase_bills")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Purchases ({currentMonthName})
            </span>
            <div className="text-xl font-black text-slate-800 font-mono mt-1">
              ₹ {purchasesThisMonth.toLocaleString("en-IN")}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition" />
        </div>

        <div
          onClick={() => onNavigateToTab("expenses")}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
              Expenses ({currentMonthName})
            </span>
            <div className="text-xl font-black text-slate-800 font-mono mt-1">
              ₹ {expensesThisMonth.toLocaleString("en-IN")}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 group-hover:translate-x-1 transition" />
        </div>
      </div>

      {/* Cash & Bank Card (Matching media_1787752474489.png & media_1787752474491.png) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Cash & Bank</span>
          </h3>
          <button
            onClick={() => onNavigateToTab("bank_accounts")}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Manage Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Bank Balance</span>
            <div className="text-xl font-black text-emerald-600 font-mono">
              ₹ {totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Cash In Hand</span>
            <div className="text-xl font-black text-emerald-600 font-mono">
              ₹ {totalCashInHand.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* List of Banks */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">List of Banks</span>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => onNavigateToTab("bank_accounts")}
                className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
              >
                <span className="font-extrabold text-xs text-slate-800">{acc.account_name}</span>
                <span className="font-mono text-xs font-extrabold text-slate-900">
                  ₹ {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Card (Matching media_1787752474491.png) */}
      <div
        onClick={() => onNavigateToTab("inventory")}
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition cursor-pointer space-y-4 group"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Inventory</span>
          </h3>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">Stock Value</span>
            <div className="text-xl font-black text-emerald-600 font-mono">
              ₹ {totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">No. of Items</span>
            <div className="text-xl font-black text-slate-800 font-mono">
              {itemCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
