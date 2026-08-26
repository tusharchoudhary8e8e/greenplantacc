import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Search,
  ArrowLeft,
  CreditCard,
  Printer,
  DollarSign,
  X,
  Trash2,
  Pencil,
  ArrowRightLeft,
  Coins,
  SlidersHorizontal,
} from "lucide-react";
import { BankAccount, BankTransaction, SupabaseService } from "../../db/supabaseService";

interface MetricBankAccountsScreenProps {
  onBack?: () => void;
  onAccountsUpdated?: () => void;
}

type DepositOption = "bank_to_cash" | "cash_to_bank" | "bank_to_bank" | "adjust_balance" | null;

export const MetricBankAccountsScreen: React.FC<MetricBankAccountsScreenProps> = ({
  onBack,
  onAccountsUpdated,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DepositOption>(null);

  // New Bank Form
  const [newAccName, setNewAccName] = useState("");
  const [newAccNum, setNewAccNum] = useState("");
  const [newAccIfsc, setNewAccIfsc] = useState("");
  const [newAccType, setNewAccType] = useState<"Current" | "Savings" | "Overdraft">("Current");
  const [newAccBalance, setNewAccBalance] = useState("");
  const [isOnlinePay, setIsOnlinePay] = useState(true);
  const [isPrintDefault, setIsPrintDefault] = useState(true);

  // Transfer Form State
  const [fromBankId, setFromBankId] = useState("");
  const [toBankId, setToBankId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "reduce">("add");

  const loadAccounts = async () => {
    setLoading(true);
    const list = await SupabaseService.getBankAccounts();
    setBankAccounts(list);
    if (list.length > 0) {
      if (!fromBankId) setFromBankId(list[0].id || "");
      if (!toBankId) setToBankId(list[0].id || "");
    }
    setLoading(false);
    if (onAccountsUpdated) onAccountsUpdated();
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);

  const filteredAccounts = bankAccounts.filter((b) => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      b.account_name.toLowerCase().includes(query) ||
      (b.account_number || "").toLowerCase().includes(query) ||
      (b.bank_name || "").toLowerCase().includes(query)
    );
  });

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    await SupabaseService.saveBankAccount({
      account_name: newAccName,
      account_number: newAccNum,
      ifsc_code: newAccIfsc,
      account_type: newAccType,
      balance: Number(newAccBalance) || 0,
      is_online_payment: isOnlinePay,
      is_printing_default: isPrintDefault,
    });

    setNewAccName("");
    setNewAccNum("");
    setNewAccIfsc("");
    setNewAccBalance("");
    setShowAddModal(false);
    loadAccounts();
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) return;

    let txnType: "deposit" | "withdraw" | "transfer" | "adjust" = "deposit";
    let fromAcc = "Cash";
    let toAcc = "Cash";

    if (selectedOption === "bank_to_cash") {
      txnType = "withdraw";
      fromAcc = fromBankId;
    } else if (selectedOption === "cash_to_bank") {
      txnType = "deposit";
      toAcc = toBankId;
    } else if (selectedOption === "bank_to_bank") {
      txnType = "transfer";
      fromAcc = fromBankId;
      toAcc = toBankId;
    } else if (selectedOption === "adjust_balance") {
      txnType = "adjust";
      toAcc = toBankId;
    }

    await SupabaseService.recordDepositWithdraw({
      transaction_date: new Date().toISOString().split("T")[0],
      type: txnType as any,
      from_account: fromAcc,
      to_account: toAcc,
      amount: amt,
      notes: transferNotes,
      adjust_type: adjustType,
    });

    setTransferAmount("");
    setTransferNotes("");
    setSelectedOption(null);
    setShowTransferModal(false);
    loadAccounts();
  };

  const handleDeleteAccount = async (accId: string) => {
    if (window.confirm("Are you sure you want to delete this Bank Account?")) {
      await SupabaseService.deleteBankAccount(accId);
      loadAccounts();
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen pb-24">
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
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Bank Accounts List</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage bank accounts, online payment options & cash ↔ bank deposits/withdrawals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search bank name, A/C..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Total Card */}
      <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase text-emerald-100 tracking-wider">Total Bank Balance</span>
          <div className="text-3xl font-black font-mono mt-1">
            ₹ {totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            Combined balance across {bankAccounts.length} active bank accounts
          </p>
        </div>
        <div className="w-14 h-14 bg-emerald-500/50 rounded-2xl flex items-center justify-center text-white shrink-0">
          <CreditCard className="w-7 h-7" />
        </div>
      </div>

      {/* Accounts Directory */}
      <div className="space-y-4">
        {filteredAccounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-tight">
                  {acc.account_name}
                </h3>
                {acc.account_number && (
                  <span className="text-xs font-mono text-slate-500 block mt-0.5">
                    {acc.account_number}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-emerald-600 font-mono block">
                  ₹ {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                {acc.account_type && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {acc.account_type} A/C
                  </span>
                )}
              </div>
            </div>

            {/* Badges & Actions Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {acc.is_online_payment && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>ONLINE PAYMENT</span>
                  </span>
                )}
                {acc.is_printing_default && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>PRINTING</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => handleDeleteAccount(acc.id || "")}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                title="Delete Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredAccounts.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-xs font-semibold text-slate-500">
              No bank accounts found. Click "+ Add Bank" to add your bank details!
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-xl font-extrabold text-xs hover:bg-red-600 shadow-xs"
            >
              + Add First Bank Account
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar (Matching media_1787761210923.png) */}
      <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-4 flex items-center gap-3 z-30">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 py-3 px-4 bg-white text-red-600 border-2 border-red-500 hover:bg-red-50 font-extrabold rounded-2xl text-xs shadow-lg transition text-center cursor-pointer"
        >
          Add Bank
        </button>

        <button
          onClick={() => {
            setSelectedOption(null);
            setShowTransferModal(true);
          }}
          className="flex-1 py-3 px-4 bg-[#ff4d4d] text-white hover:bg-red-600 font-extrabold rounded-2xl text-xs shadow-lg transition text-center cursor-pointer"
        >
          Deposit/Withdraw
        </button>
      </div>

      {/* DEPOSIT / WITHDRAW ACTION MODAL SHEET (Matching media_1787761210923.png) */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800">Deposit/Withdraw</h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedOption(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Option Selector Grid (Exact 4 Options matching media_1787761210923.png) */}
            {!selectedOption && (
              <div className="grid grid-cols-2 gap-4 py-2">
                {/* 1. Bank to Cash Transfer */}
                <button
                  onClick={() => setSelectedOption("bank_to_cash")}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 transition text-center group cursor-pointer space-y-2"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition">
                    <ArrowDownLeft className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight">
                    Bank to Cash Transfer
                  </span>
                </button>

                {/* 2. Cash to Bank Transfer */}
                <button
                  onClick={() => setSelectedOption("cash_to_bank")}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-300 transition text-center group cursor-pointer space-y-2"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition">
                    <ArrowUpRight className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight">
                    Cash to Bank Transfer
                  </span>
                </button>

                {/* 3. Bank to Bank Transfer */}
                <button
                  onClick={() => setSelectedOption("bank_to_bank")}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100 hover:border-purple-300 transition text-center group cursor-pointer space-y-2"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition">
                    <ArrowRightLeft className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight">
                    Bank to Bank Transfer
                  </span>
                </button>

                {/* 4. Adjust Bank Balance */}
                <button
                  onClick={() => setSelectedOption("adjust_balance")}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100 hover:border-amber-300 transition text-center group cursor-pointer space-y-2"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition">
                    <SlidersHorizontal className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight">
                    Adjust Bank Balance
                  </span>
                </button>
              </div>
            )}

            {/* Step 2: Form for Selected Option */}
            {selectedOption && (
              <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs font-medium">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-extrabold text-slate-800 text-xs">
                    {selectedOption === "bank_to_cash" && "🏦 ➔ 💵 Bank to Cash Transfer (Withdraw)"}
                    {selectedOption === "cash_to_bank" && "💵 ➔ 🏦 Cash to Bank Transfer (Deposit)"}
                    {selectedOption === "bank_to_bank" && "🏦 ➔ 🏦 Bank to Bank Transfer"}
                    {selectedOption === "adjust_balance" && "🏦 ➔ 💸 Adjust Bank Balance"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedOption(null)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* From / To Bank Selectors */}
                {(selectedOption === "bank_to_cash" || selectedOption === "bank_to_bank") && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">From Bank Account (Source) *</label>
                    <select
                      value={fromBankId}
                      onChange={(e) => setFromBankId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      {bankAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_name} (Bal: ₹{a.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(selectedOption === "cash_to_bank" || selectedOption === "bank_to_bank" || selectedOption === "adjust_balance") && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">
                      {selectedOption === "adjust_balance" ? "Select Bank Account to Adjust *" : "To Bank Account (Destination) *"}
                    </label>
                    <select
                      value={toBankId}
                      onChange={(e) => setToBankId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      {bankAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_name} (Bal: ₹{a.balance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedOption === "adjust_balance" && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Adjustment Action *</label>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setAdjustType("add")}
                        className={`flex-1 py-2 rounded-lg font-bold transition text-center ${
                          adjustType === "add" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600"
                        }`}
                      >
                        + Credit / Add Balance
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType("reduce")}
                        className={`flex-1 py-2 rounded-lg font-bold transition text-center ${
                          adjustType === "reduce" ? "bg-red-600 text-white shadow-xs" : "text-slate-600"
                        }`}
                      >
                        - Debit / Reduce Balance
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-base font-black text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Remarks / Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ATM withdrawal, counter deposit receipt, bank interest"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOption(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#ff4d4d] text-white rounded-xl font-bold hover:bg-red-600 shadow-xs cursor-pointer"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD BANK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Add Bank Account</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Account Display Name *</label>
                <input
                  type="text"
                  placeholder="e.g. SBI Current A/C"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 43025939805"
                  value={newAccNum}
                  onChange={(e) => setNewAccNum(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={newAccIfsc}
                    onChange={(e) => setNewAccIfsc(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-slate-800 uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={(e: any) => setNewAccType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Current">Current A/C</option>
                    <option value="Savings">Savings A/C</option>
                    <option value="Overdraft">Overdraft (OD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnlinePay}
                    onChange={(e) => setIsOnlinePay(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-slate-700 font-semibold">Enable for Online Payments</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrintDefault}
                    onChange={(e) => setIsPrintDefault(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-slate-700 font-semibold">Show on Printed Bills & Invoices</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 shadow-xs"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
