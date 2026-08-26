import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
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
  Building2,
  Package,
  ArrowRight,
  Landmark,
  Wallet,
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
    <div className="space-y-5 font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between bg-white border border-[#e8e8e8] px-5 py-3 rounded-[10px]">
        <h2 className="text-xs font-bold text-[#444] uppercase tracking-wider">
          RKK Nursery Management — <span className="text-[#1a2e1a]">Live Dashboard</span>
        </h2>
        <div className="flex items-center gap-2 bg-[#f4f4f0] px-3 py-1 rounded-full border border-[#e0e0dc]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-[#1a2e1a]">RKK Nursery Admin</span>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="flex flex-col xl:flex-row gap-5">
        {/* Left Column (Main Metrics & Charts) */}
        <div className="flex-1 space-y-5">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* You'll Get Card */}
            <div
              onClick={() => onNavigateToTab("ledger")}
              className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] hover:border-[#1e4d2b]/30 transition cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-[8px] bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#888] tracking-wider block">
                  You'll Get
                </span>
                <div className="text-[19px] font-extrabold text-[#1a1a1a] font-mono leading-tight mt-0.5">
                  ₹ {totalYoullGet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* You'll Give Card */}
            <div
              onClick={() => onNavigateToTab("ledger")}
              className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] hover:border-amber-500/30 transition cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-[8px] bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#888] tracking-wider block">
                  You'll Give
                </span>
                <div className="text-[19px] font-extrabold text-[#1a1a1a] font-mono leading-tight mt-0.5">
                  ₹ {totalYoullGive.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Total Sales Card */}
            <div
              onClick={() => onNavigateToTab("orders")}
              className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] hover:border-[#1e4d2b]/30 transition cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-[8px] bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-[#888] tracking-wider block">
                  Total Sales Value ({currentMonthName})
                </span>
                <div className="text-[19px] font-extrabold text-[#1a1a1a] font-mono leading-tight mt-0.5">
                  ₹ {salesThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Sales Performance Card with Green Bar Chart */}
          <div className="bg-white p-5 rounded-[10px] border border-[#e8e8e8] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0f0ec] pb-3">
              <h3 className="text-sm font-bold text-[#1a1a1a]">
                Sales Performance &amp; Overview ({currentMonthName})
              </h3>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider block">
                  TOTAL RECORDED SALE
                </span>
                <div className="text-2xl font-black text-[#1a1a1a] font-mono mt-0.5">
                  ₹ {salesThisMonth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {salesTrendPct < 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>{Math.abs(salesTrendPct).toFixed(0)}% Decline This Month</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ed] text-[#2d7a4f] border border-[#b8ddc8] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{salesTrendPct.toFixed(0)}% Growth This Month</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#888] mt-2 max-w-xs leading-snug">
                  Stable harvest dispatch velocity and high seedling fulfillment rate tracked across all lots.
                </p>
              </div>

              {/* Bar Chart */}
              <div className="h-40 w-full md:w-3/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySalesChartData} barSize={24}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, "Sales"]} />
                    <Bar dataKey="sale" fill="#2d7a4f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Purchase Bills & Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Purchase Bills */}
            <div
              onClick={() => onNavigateToTab("purchase_bills")}
              className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] space-y-3 cursor-pointer hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between border-b border-[#f0f0ec] pb-2">
                <h4 className="text-xs font-bold text-[#1a1a1a]">Recent Purchase Bills</h4>
                <ArrowRight className="w-3.5 h-3.5 text-[#888]" />
              </div>
              <div className="space-y-2">
                {safePurchaseBills.slice(0, 2).map((bill, idx) => (
                  <div key={idx} className="bg-[#f9f9f7] p-2.5 rounded-[6px] flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-[#1a1a1a]">
                        {bill.vendor_name || `Bill #${bill.id}`}
                      </div>
                      <div className="text-[10px] text-[#888]">{bill.bill_date || "Recent"}</div>
                    </div>
                    <div className="font-mono text-[12px] font-bold text-[#1a1a1a]">
                      ₹ {(bill.total_amount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
                {safePurchaseBills.length === 0 && (
                  <div className="text-[12px] text-[#888] text-center py-2">No purchase bills recorded yet</div>
                )}
              </div>
            </div>

            {/* Operating Expenses */}
            <div
              onClick={() => onNavigateToTab("expenses")}
              className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] space-y-3 cursor-pointer hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between border-b border-[#f0f0ec] pb-2">
                <h4 className="text-xs font-bold text-[#1a1a1a]">Recent Operating Expenses</h4>
                <ArrowRight className="w-3.5 h-3.5 text-[#888]" />
              </div>
              <div className="space-y-2">
                {expenses.slice(0, 2).map((exp, idx) => (
                  <div key={idx} className="bg-[#f9f9f7] p-2.5 rounded-[6px] flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-semibold text-[#1a1a1a]">
                        {exp.category_name || "Expense"}
                      </div>
                      <div className="text-[10px] text-[#888]">{exp.expense_date || "Recent"}</div>
                    </div>
                    <div className="font-mono text-[12px] font-bold text-[#1a1a1a]">
                      ₹ {(exp.total_amount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-[12px] text-[#888] text-center py-2">No expenses recorded yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (Cash & Bank Telemetry + Inventory) */}
        <div className="w-full xl:w-[290px] shrink-0 space-y-5">
          {/* Cash & Bank Telemetry */}
          <div className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] space-y-3">
            <h4 className="text-xs font-bold text-[#1a1a1a] flex items-center justify-between">
              <span>Cash &amp; Bank Telemetry</span>
            </h4>

            {/* Bank Account Balance Box */}
            <div
              onClick={() => onNavigateToTab("bank_accounts")}
              className="bg-[#e6f4ed] p-3 rounded-[8px] border border-[#b8ddc8] cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#2d7a4f]" />
                <span className="text-[12px] font-semibold text-[#155724]">Bank Account Balance</span>
              </div>
              <span className="font-mono text-[13px] font-extrabold text-[#155724]">
                ₹ {totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Cash In Hand Box */}
            <div
              onClick={() => onNavigateToTab("bank_accounts")}
              className="bg-[#f9f9f7] p-3 rounded-[8px] border border-[#e0e0dc] cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#555]" />
                <span className="text-[12px] font-semibold text-[#333]">Cash In Hand</span>
              </div>
              <span className="font-mono text-[13px] font-extrabold text-[#1a1a1a]">
                ₹ {totalCashInHand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Connected Institutions List */}
            <div className="pt-2 border-t border-[#f0f0ec]">
              <span className="text-[10px] font-semibold uppercase text-[#aaa] tracking-wider block mb-2">
                CONNECTED INSTITUTIONS
              </span>
              <div className="space-y-2">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => onNavigateToTab("bank_accounts")}
                    className="flex items-center justify-between text-[12px] py-1 border-b border-[#f5f5f2] last:border-none cursor-pointer hover:bg-[#f9f9f7] px-1 rounded"
                  >
                    <span className="font-semibold text-[#333]">{acc.account_name}</span>
                    <span className="font-mono font-bold text-[#1a1a1a]">
                      ₹ {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                {bankAccounts.length === 0 && (
                  <div className="text-[11px] text-[#aaa] text-center py-1">No active bank accounts</div>
                )}
              </div>
            </div>
          </div>

          {/* Live Crop Inventory Summary */}
          <div
            onClick={() => onNavigateToTab("inventory")}
            className="bg-white p-4 rounded-[10px] border border-[#e8e8e8] space-y-3 cursor-pointer hover:border-slate-300 transition"
          >
            <h4 className="text-xs font-bold text-[#1a1a1a]">Live Crop Inventory Summary</h4>

            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#f0f0ec]">
                <span className="text-[#666]">Total Stock Value</span>
                <span className="font-mono font-extrabold text-[#1a1a1a]">
                  ₹ {totalStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#666]">Total Tracked Item Count</span>
                <span className="font-bold text-[#1a1a1a] bg-[#f4f4f0] px-2 py-0.5 rounded text-[11px]">
                  {itemCount} {itemCount === 1 ? "Item" : "Items"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
