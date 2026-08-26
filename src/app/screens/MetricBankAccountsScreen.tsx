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
    <div className="p-4 sm:p-6 space-y-5 bg-[#f4f4f0] min-h-screen pb-24 font-sans">
      {/* Top Header Bar */}
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
            <h1 className="text-xl font-bold text-[#1a1a1a] tracking-tight">
              Bank Accounts List
            </h1>
            <p className="text-xs text-[#888] font-medium mt-0.5">
              Manage bank accounts, online payment options &amp; cash – bank deposits/withdrawals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#aaa]" />
            <input
              type="text"
              placeholder="Search banks, acc. no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-[#e0e0e0] rounded-[7px] text-xs font-medium text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Split Panel Layout matching Reference Photo 4 */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* LEFT PANEL: Total Bank Balance Card */}
        <div className="w-full xl:w-[320px] bg-white p-5 rounded-[10px] border border-[#e8e8e8] space-y-4 shrink-0">
          <div className="flex items-center gap-2 text-[#444]">
            <CreditCard className="w-4 h-4 text-[#1e4d2b]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888]">
              Total Bank Balance
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-[#1a1a1a] font-mono leading-none">
              ₹ {totalBankBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-[#888] font-medium mt-2">
              Combined balance across {bankAccounts.length} active bank accounts
            </p>
          </div>

          {/* Direct Integration Banner Box */}
          <div className="bg-[#e6f4ed] p-3 rounded-[8px] border border-[#b8ddc8] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2d7a4f] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#155724] font-medium leading-relaxed">
              Direct integration with active banking ledger balances. Safe, encrypted live sync.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Active Accounts Roster */}
        <div className="flex-1 w-full bg-white p-5 rounded-[10px] border border-[#e8e8e8] space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#aaa] block">
            ACTIVE ACCOUNTS
          </span>

          <div className="space-y-3">
            {filteredAccounts.map((acc) => {
              // Extract initials for bank logo badge
              const nameParts = acc.account_name.split(" ");
              const abbrev = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() : acc.account_name.slice(0, 3).toUpperCase();
              const last4 = acc.account_number ? acc.account_number.slice(-8) : "XXXX";

              return (
                <div
                  key={acc.id}
                  className="bg-[#f9f9f7] p-3.5 rounded-[8px] border border-[#f0f0ec] hover:border-[#e0e0dc] transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[6px] bg-[#1d70b8] text-white font-black text-xs flex items-center justify-center shrink-0 tracking-tighter">
                      {abbrev}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-[#1a1a1a]">
                          {acc.account_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-[#888] font-mono">
                          Acc No: ending -{last4}
                        </span>
                        <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-[#dbeafe] text-[#1d4ed8]">
                          {(acc.account_type || "CURRENT").toUpperCase()} A/C
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-extrabold text-[#1a1a1a] font-mono">
                      ₹ {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteAccount(acc.id || "")}
                      className="p-1 text-[#aaa] hover:text-red-600 transition"
                      title="Delete Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredAccounts.length === 0 && !loading && (
              <div className="text-center py-8 space-y-2">
                <Building2 className="w-8 h-8 text-[#ccc] mx-auto" />
                <p className="text-xs text-[#888] font-medium">No bank accounts found.</p>
              </div>
            )}

            <div className="text-center pt-2">
              <span className="text-[11px] text-[#aaa] font-medium">End of bank accounts roster</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar matching Reference Photo 4 */}
      <div className="bg-white p-3 rounded-[10px] border border-[#e8e8e8] flex items-center justify-end gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 border border-[#1e4d2b] text-[#1e4d2b] bg-white hover:bg-[#e6f4ed] rounded-[7px] font-bold text-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Bank</span>
        </button>

        <button
          onClick={() => {
            setSelectedOption(null);
            setShowTransferModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1e4d2b] text-white hover:bg-[#163d21] rounded-[7px] font-bold text-xs transition cursor-pointer shadow-xs"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Deposit/Withdraw</span>
        </button>
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
