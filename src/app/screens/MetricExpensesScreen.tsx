import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Plus,
  Search,
  ArrowLeft,
  Calendar,
  DollarSign,
  Tag,
  X,
  Trash2,
  Building2,
  CheckCircle2,
  Printer,
  ChevronRight,
} from "lucide-react";
import { ExpenseRecord, BankAccount, SupabaseService } from "../../db/supabaseService";

interface MetricExpensesScreenProps {
  onBack?: () => void;
  onExpensesUpdated?: () => void;
}

const PRESET_CATEGORIES = [
  "Transport",
  "Salary",
  "Manufacturing Expense",
  "Personal expenses",
  "Payment-in Discount",
  "Petrol",
  "Rent",
  "Tea",
  "College fee",
  "Bank communication and interest",
];

export const MetricExpensesScreen: React.FC<MetricExpensesScreenProps> = ({
  onBack,
  onExpensesUpdated,
}) => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "history">("categories");
  const [searchTerm, setSearchTerm] = useState("");

  // Add Expense Modal Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [expCategory, setExpCategory] = useState("Transport");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expAmount, setExpAmount] = useState("");
  const [expShipping, setExpShipping] = useState("");
  const [expRoundOff, setExpRoundOff] = useState(false);
  const [expPaymentType, setExpPaymentType] = useState("Cash");
  const [expNotes, setExpNotes] = useState("");

  // Items
  const [expItems, setExpItems] = useState<{ name: string; amount: number }[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  const loadData = async () => {
    setLoading(true);
    const expList = await SupabaseService.getExpenses();
    const bList = await SupabaseService.getBankAccounts();
    setExpenses(expList);
    setBankAccounts(bList);
    setLoading(false);
    if (onExpensesUpdated) onExpensesUpdated();
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aggregated Category Totals
  const categoryTotals = useMemo(() => {
    const categoriesMap: Record<string, number> = {};

    PRESET_CATEGORIES.forEach((cat) => {
      categoriesMap[cat] = 0;
    });

    expenses.forEach((e) => {
      const cat = e.category_name.trim();
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (e.total_amount || 0);
    });

    return Object.entries(categoriesMap).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [expenses]);

  const filteredCategories = useMemo(() => {
    return categoryTotals.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categoryTotals, searchTerm]);

  const overallTotalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  }, [expenses]);

  const handleAddItem = () => {
    if (!newItemName || !newItemAmount) return;
    setExpItems([...expItems, { name: newItemName, amount: Number(newItemAmount) || 0 }]);
    setNewItemName("");
    setNewItemAmount("");
  };

  const calculatedFormTotal = useMemo(() => {
    const itemsSum = expItems.reduce((sum, i) => sum + i.amount, 0);
    const directAmt = Number(expAmount) || 0;
    const shipping = Number(expShipping) || 0;
    let tot = (itemsSum > 0 ? itemsSum : directAmt) + shipping;
    if (expRoundOff) tot = Math.round(tot);
    return tot;
  }, [expItems, expAmount, expShipping, expRoundOff]);

  const handleSaveExpense = async (saveAndNew = false) => {
    const categoryToSave = expCategory.trim() || "General Expense";
    const totalToSave = calculatedFormTotal;

    if (!totalToSave || totalToSave <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    await SupabaseService.saveExpense({
      category_name: categoryToSave,
      expense_date: expDate,
      items: expItems,
      shipping_charge: Number(expShipping) || 0,
      round_off: expRoundOff ? 1 : 0,
      total_amount: totalToSave,
      payment_type: expPaymentType,
      payment_status: "paid",
      notes: expNotes,
    });

    setExpAmount("");
    setExpShipping("");
    setExpNotes("");
    setExpItems([]);

    if (!saveAndNew) {
      setShowAddModal(false);
    }
    loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm("Delete this expense record?")) {
      await SupabaseService.deleteExpense(id);
      loadData();
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 font-bold text-xs shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Back</span>
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Tag className="w-5 h-5 text-red-500" />
              <span>Expense Categories & Vouchers</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Record nursery operating expenses, salaries, transport, tea & manufacturing bills
            </p>
          </div>
        </div>

        {/* View Tabs & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "categories" ? "bg-red-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "history" ? "bg-red-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Voucher History ({expenses.length})
            </button>
          </div>

          <button
            onClick={() => {
              setExpCategory("Transport");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-[#ff4d4d] text-white px-4 py-2 rounded-xl font-extrabold text-xs hover:bg-red-600 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* CATEGORIES VIEW */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500 bg-white"
            />
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
            {filteredCategories.map((c) => (
              <div
                key={c.name}
                onClick={() => {
                  setExpCategory(c.name);
                  setShowAddModal(true);
                }}
                className="p-4 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs">
                    {c.name.charAt(0)}
                  </div>
                  <span className="font-extrabold text-slate-800 text-sm group-hover:text-red-600 transition">
                    {c.name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-slate-900 font-mono text-sm">
                    ₹ {c.amount.toLocaleString("en-IN", { minimumFractionDigits: c.amount % 1 === 0 ? 0 : 2 })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Total Footer */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between font-mono text-sm font-black shadow-md">
            <span className="text-xs uppercase text-slate-300 font-extrabold font-sans">Total Overall Expenses</span>
            <span className="text-xl text-red-400">
              ₹ {overallTotalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* VOUCHER HISTORY VIEW */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-4">DATE</th>
                  <th className="py-3.5 px-4">EXPENSE NO</th>
                  <th className="py-3.5 px-4">CATEGORY</th>
                  <th className="py-3.5 px-4">PAYMENT METHOD</th>
                  <th className="py-3.5 px-4 text-right">TOTAL (₹)</th>
                  <th className="py-3.5 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-slate-600">{e.expense_date}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600">{e.expense_no}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-800">{e.category_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {e.payment_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">
                      ₹ {e.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(e.id || "")}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No expense vouchers recorded yet. Click "+ Record Expense" to add your first expense!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE EXPENSE FORM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-500" />
                <span>Record Expense Voucher</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              {/* Category Picker with Quick Presets */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Expense Category *</label>
                <input
                  type="text"
                  placeholder="Type or select category below..."
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-red-500 mb-2"
                />

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setExpCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        expCategory === cat
                          ? "bg-red-500 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-base font-black text-slate-800 focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-slate-100 p-3.5 rounded-2xl bg-slate-50 space-y-2">
                <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block">
                  + Add Line Items (Optional)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Item description..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs bg-white"
                  />
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="w-24 p-2 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                {expItems.length > 0 && (
                  <div className="divide-y divide-slate-200 pt-1">
                    {expItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between py-1 text-xs">
                        <span>{it.name}</span>
                        <span className="font-mono font-bold">₹{it.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-slate-500 font-bold mb-1">Payment Method</label>
                <select
                  value={expPaymentType}
                  onChange={(e) => setExpPaymentType(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-red-500"
                >
                  <option value="Cash">💵 Cash In Hand</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id || b.account_name}>
                      🏛️ {b.account_name} (Bal: ₹{b.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Net Grand Total */}
              <div className="p-3 bg-red-50 rounded-2xl border border-red-100 flex justify-between items-center">
                <span className="text-xs text-red-700 font-extrabold uppercase">Total Amount</span>
                <span className="text-xl font-black font-mono text-red-600">
                  ₹ {calculatedFormTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveExpense(true)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-extrabold hover:bg-slate-200"
                >
                  Save & New
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveExpense(false)}
                  className="px-5 py-2 bg-[#ff4d4d] text-white rounded-xl font-extrabold hover:bg-red-600 shadow-xs cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
