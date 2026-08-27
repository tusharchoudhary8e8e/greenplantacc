import React, { useState, useEffect, useMemo } from "react";
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
  Eye,
  Calendar,
  Tag,
  FileText,
  Filter,
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

  // Bank Account Transactions Statement Modal State
  const [selectedBankForTxns, setSelectedBankForTxns] = useState<BankAccount | null>(null);
  const [bankTxns, setBankTxns] = useState<BankTransaction[]>([]);
  const [txnsSearchTerm, setTxnsSearchTerm] = useState("");
  const [txnsFilterType, setTxnsFilterType] = useState<"all" | "in" | "out">("all");

  // Edit Bank Transaction Modal State
  const [editingTxn, setEditingTxn] = useState<BankTransaction | null>(null);
  const [editTxnDate, setEditTxnDate] = useState("");
  const [editTxnAmount, setEditTxnAmount] = useState("");
  const [editTxnType, setEditTxnType] = useState<string>("deposit");
  const [editTxnAdjustType, setEditTxnAdjustType] = useState<"add" | "reduce">("add");
  const [editTxnNotes, setEditTxnNotes] = useState("");
  const [editTxnFrom, setEditTxnFrom] = useState("");
  const [editTxnTo, setEditTxnTo] = useState("");

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

  const loadBankTxns = async (acc: BankAccount) => {
    const directList = await SupabaseService.getBankTransactions(acc.id);
    const byNameList = await SupabaseService.getBankTransactions(acc.account_name);

    // Also load expenses paid with this bank account
    const allExpenses = await SupabaseService.getExpenses();
    const expTxns: BankTransaction[] = allExpenses
      .filter((e) => (e.payment_type === acc.id || e.payment_type === acc.account_name) && e.payment_status === "paid")
      .map((e) => ({
        id: `exp-${e.id}`,
        transaction_date: e.expense_date,
        type: "withdraw",
        from_account: acc.account_name,
        to_account: e.category_name,
        amount: e.total_amount,
        notes: `Expense: ${e.category_name} (${e.expense_no})`,
        party_name: e.category_name,
        created_at: e.created_at,
      }));

    const combined = [...directList];
    byNameList.forEach((t) => {
      if (!combined.some((item) => item.id === t.id)) {
        combined.push(t);
      }
    });
    expTxns.forEach((t) => {
      if (!combined.some((item) => item.id === t.id)) {
        combined.push(t);
      }
    });

    combined.sort(
      (a, b) => new Date(b.transaction_date || b.created_at || 0).getTime() - new Date(a.transaction_date || a.created_at || 0).getTime()
    );
    setBankTxns(combined);
  };

  const handleOpenAccountStatement = (acc: BankAccount) => {
    setSelectedBankForTxns(acc);
    setTxnsSearchTerm("");
    setTxnsFilterType("all");
    loadBankTxns(acc);
  };

  const filteredBankTxns = useMemo(() => {
    if (!selectedBankForTxns) return [];
    return bankTxns.filter((t) => {
      // Type Filter (Inflow vs Outflow)
      const bankId = selectedBankForTxns.id;
      const bankName = selectedBankForTxns.account_name;
      const isTarget = t.to_account === bankId || t.to_account === bankName;
      const isSource = t.from_account === bankId || t.from_account === bankName;

      let isInflow = false;
      let isOutflow = false;

      if (t.type === "deposit" && isTarget) isInflow = true;
      else if (t.type === "withdraw" && isSource) isOutflow = true;
      else if (t.type === "transfer") {
        if (isTarget) isInflow = true;
        if (isSource) isOutflow = true;
      } else if (t.type === "adjust") {
        if (t.adjust_type === "reduce") isOutflow = true;
        else isInflow = true;
      } else {
        if (isTarget) isInflow = true;
        else isOutflow = true;
      }

      if (txnsFilterType === "in" && !isInflow) return false;
      if (txnsFilterType === "out" && !isOutflow) return false;

      // Search Filter
      if (txnsSearchTerm.trim()) {
        const q = txnsSearchTerm.trim().toLowerCase();
        const matchNotes = (t.notes || "").toLowerCase().includes(q);
        const matchType = (t.type || "").toLowerCase().includes(q);
        const matchFrom = (t.from_account || "").toLowerCase().includes(q);
        const matchTo = (t.to_account || "").toLowerCase().includes(q);
        const matchParty = (t.party_name || "").toLowerCase().includes(q);
        if (!matchNotes && !matchType && !matchFrom && !matchTo && !matchParty) return false;
      }

      return true;
    });
  }, [bankTxns, selectedBankForTxns, txnsFilterType, txnsSearchTerm]);

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
      notes: transferNotes || `Deposit/Withdraw (${selectedOption})`,
      adjust_type: adjustType,
    });

    setTransferAmount("");
    setTransferNotes("");
    setSelectedOption(null);
    setShowTransferModal(false);
    await loadAccounts();

    if (selectedBankForTxns) {
      const updatedList = await SupabaseService.getBankAccounts();
      const updatedBank = updatedList.find((a) => a.id === selectedBankForTxns.id) || selectedBankForTxns;
      setSelectedBankForTxns(updatedBank);
      loadBankTxns(updatedBank);
    }
  };

  const handleStartEditTxn = (txn: BankTransaction) => {
    setEditingTxn(txn);
    setEditTxnDate(txn.transaction_date || new Date().toISOString().split("T")[0]);
    setEditTxnAmount(String(txn.amount || ""));
    setEditTxnType(txn.type || "deposit");
    setEditTxnAdjustType(txn.adjust_type || "add");
    setEditTxnNotes(txn.notes || "");
    setEditTxnFrom(txn.from_account || "Cash");
    setEditTxnTo(txn.to_account || (selectedBankForTxns?.id || "Cash"));
  };

  const handleSaveEditedTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;
    const amt = Number(editTxnAmount);
    if (!amt || amt <= 0) return;

    await SupabaseService.saveBankTransaction({
      id: editingTxn.id,
      transaction_date: editTxnDate,
      type: editTxnType,
      adjust_type: editTxnAdjustType,
      amount: amt,
      from_account: editTxnFrom,
      to_account: editTxnTo,
      notes: editTxnNotes,
    });

    setEditingTxn(null);
    await loadAccounts();

    if (selectedBankForTxns) {
      const updatedList = await SupabaseService.getBankAccounts();
      const updatedBank = updatedList.find((a) => a.id === selectedBankForTxns.id) || selectedBankForTxns;
      setSelectedBankForTxns(updatedBank);
      loadBankTxns(updatedBank);
    }
  };

  const handleDeleteTxn = async (txnId: string) => {
    if (window.confirm("Are you sure you want to delete this bank transaction? Balance will be automatically recalculated.")) {
      await SupabaseService.deleteBankTransaction(txnId);
      await loadAccounts();

      if (selectedBankForTxns) {
        const updatedList = await SupabaseService.getBankAccounts();
        const updatedBank = updatedList.find((a) => a.id === selectedBankForTxns.id) || selectedBankForTxns;
        setSelectedBankForTxns(updatedBank);
        loadBankTxns(updatedBank);
      }
    }
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
                  onClick={() => handleOpenAccountStatement(acc)}
                  className="bg-[#f9f9f7] p-3.5 rounded-[8px] border border-[#f0f0ec] hover:border-[#1e4d2b]/40 transition flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[6px] bg-[#1d70b8] text-white font-black text-xs flex items-center justify-center shrink-0 tracking-tighter shadow-xs">
                      {abbrev}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-[#1a1a1a] group-hover:text-[#1e4d2b] transition">
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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAccountStatement(acc);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#1e4d2b] bg-[#e6f4ed] border border-[#b8ddc8] rounded-[6px] hover:bg-[#d4edda] transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1e4d2b]" />
                      <span>Transactions</span>
                    </button>

                    <span className="text-sm font-extrabold text-[#1a1a1a] font-mono">
                      ₹ {acc.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAccount(acc.id || "");
                      }}
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
              <span className="text-[11px] text-[#aaa] font-medium">Click on any account (e.g. SBI) to view &amp; edit its transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
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

      {/* ─── BANK ACCOUNT TRANSACTIONS STATEMENT MODAL ─────────────────── */}
      {selectedBankForTxns && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-[12px] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e8e8e8] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e8e8e8] bg-[#f9f9f7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#1d70b8] text-white font-black text-xs flex items-center justify-center shrink-0">
                  {selectedBankForTxns.account_name.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#1a1a1a]">
                      {selectedBankForTxns.account_name} — Account Statement
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#dbeafe] text-[#1d4ed8]">
                      {(selectedBankForTxns.account_type || "CURRENT").toUpperCase()} A/C
                    </span>
                  </div>
                  <p className="text-xs text-[#888] font-mono mt-0.5">
                    Acc No: {selectedBankForTxns.account_number || "N/A"} • IFSC: {selectedBankForTxns.ifsc_code || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right bg-white px-3.5 py-1.5 rounded-[8px] border border-[#e0e0dc]">
                  <span className="text-[10px] font-bold text-[#888] uppercase block">Current Balance</span>
                  <span className="text-base font-extrabold text-[#155724] font-mono">
                    ₹ {selectedBankForTxns.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedBankForTxns(null)}
                  className="p-2 text-[#888] hover:text-[#1a1a1a] rounded-lg hover:bg-slate-200/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions & Filter Bar */}
            <div className="p-4 border-b border-[#e8e8e8] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search & Type Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-[#aaa] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by notes, party..."
                    value={txnsSearchTerm}
                    onChange={(e) => setTxnsSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-[#e0e0e0] rounded-[7px] text-xs text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-[#f9f9f7]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#f4f4f0] p-1 rounded-[7px] text-xs font-semibold">
                  <button
                    onClick={() => setTxnsFilterType("all")}
                    className={`px-3 py-1 rounded-[5px] transition ${
                      txnsFilterType === "all" ? "bg-white text-[#1a1a1a] font-bold shadow-xs" : "text-[#666]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTxnsFilterType("in")}
                    className={`px-3 py-1 rounded-[5px] transition ${
                      txnsFilterType === "in" ? "bg-[#d4edda] text-[#155724] font-bold shadow-xs" : "text-[#666]"
                    }`}
                  >
                    Money In (+)
                  </button>
                  <button
                    onClick={() => setTxnsFilterType("out")}
                    className={`px-3 py-1 rounded-[5px] transition ${
                      txnsFilterType === "out" ? "bg-red-100 text-red-800 font-bold shadow-xs" : "text-[#666]"
                    }`}
                  >
                    Money Out (-)
                  </button>
                </div>
              </div>

              {/* Quick Deposit/Withdraw Action Button */}
              <button
                onClick={() => {
                  setFromBankId(selectedBankForTxns.id || "");
                  setToBankId(selectedBankForTxns.id || "");
                  setSelectedOption("cash_to_bank");
                  setShowTransferModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1e4d2b] text-white hover:bg-[#163d21] rounded-[7px] font-bold text-xs transition cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Deposit / Withdrawal</span>
              </button>
            </div>

            {/* Transactions List Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f9f9f7] text-[10px] font-bold uppercase tracking-wider text-[#888] border-b border-[#f0f0ec]">
                    <th className="py-2.5 px-3">DATE</th>
                    <th className="py-2.5 px-3">TRANSACTION TYPE / REMARKS</th>
                    <th className="py-2.5 px-3">SOURCE / TARGET</th>
                    <th className="py-2.5 px-3 text-right">AMOUNT (₹)</th>
                    <th className="py-2.5 px-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec] text-[#333]">
                  {filteredBankTxns.map((t) => {
                    const bankId = selectedBankForTxns.id;
                    const bankName = selectedBankForTxns.account_name;
                    const isTarget = t.to_account === bankId || t.to_account === bankName;

                    let isInflow = false;
                    if (t.type === "deposit" && isTarget) isInflow = true;
                    else if (t.type === "transfer" && isTarget) isInflow = true;
                    else if (t.type === "adjust" && t.adjust_type !== "reduce") isInflow = true;

                    return (
                      <tr key={t.id} className="hover:bg-[#f9f9f7] transition">
                        <td className="py-3 px-3 font-mono text-[#666] whitespace-nowrap">
                          {t.transaction_date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                isInflow ? "bg-[#d4edda] text-[#155724]" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isInflow ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <span className="font-bold text-[#1a1a1a] block">
                                {t.type === "deposit" && "Cash Deposit"}
                                {t.type === "withdraw" && "Cash Withdrawal"}
                                {t.type === "transfer" && "Inter-Bank Transfer"}
                                {t.type === "adjust" && `Balance Adjustment (${t.adjust_type === "reduce" ? "Debit" : "Credit"})`}
                                {t.type === "expense_payment" && "Expense Payment"}
                              </span>
                              {t.notes && <span className="text-[11px] text-[#777] block">{t.notes}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#555]">
                          {t.from_account === bankId || t.from_account === bankName ? (
                            <span>To: <strong className="text-[#1a1a1a]">{t.to_account}</strong></span>
                          ) : (
                            <span>From: <strong className="text-[#1a1a1a]">{t.from_account}</strong></span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold whitespace-nowrap">
                          <span className={isInflow ? "text-[#155724]" : "text-red-700"}>
                            {isInflow ? "+" : "-"} ₹ {Number(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEditTxn(t)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                              title="Edit Transaction"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTxn(t.id || "")}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBankTxns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#aaa] font-medium">
                        No transactions found for this bank account. Use "+ Add Deposit / Withdrawal" to record transactions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Statement Footer */}
            <div className="p-3 border-t border-[#e8e8e8] bg-[#f9f9f7] flex items-center justify-between text-xs text-[#666]">
              <span>Total Recorded Transactions: {filteredBankTxns.length}</span>
              <button
                onClick={() => setSelectedBankForTxns(null)}
                className="px-4 py-1.5 border border-[#ccc] bg-white text-[#444] rounded-[6px] font-bold hover:bg-slate-100 cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT BANK TRANSACTION MODAL ──────────────────────────────── */}
      {editingTxn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl border border-[#e8e8e8]">
            <div className="flex items-center justify-between border-b border-[#e8e8e8] pb-3">
              <h3 className="text-base font-bold text-[#1a1a1a] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#1e4d2b]" />
                <span>Edit Bank Transaction</span>
              </h3>
              <button onClick={() => setEditingTxn(null)} className="p-1 text-[#888] hover:text-[#1a1a1a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTxn} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-[#555] font-bold mb-1">Transaction Date *</label>
                <input
                  type="date"
                  value={editTxnDate}
                  onChange={(e) => setEditTxnDate(e.target.value)}
                  className="w-full p-2 border border-[#e0e0e0] rounded-[7px] text-xs text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[#555] font-bold mb-1">Transaction Type *</label>
                <select
                  value={editTxnType}
                  onChange={(e) => setEditTxnType(e.target.value)}
                  className="w-full p-2 border border-[#e0e0e0] rounded-[7px] text-xs text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-white"
                >
                  <option value="deposit">Deposit (Cash ➔ Bank)</option>
                  <option value="withdraw">Withdrawal (Bank ➔ Cash)</option>
                  <option value="transfer">Bank to Bank Transfer</option>
                  <option value="adjust">Direct Balance Adjustment</option>
                </select>
              </div>

              {editTxnType === "adjust" && (
                <div>
                  <label className="block text-[#555] font-bold mb-1">Adjustment Action *</label>
                  <div className="flex items-center gap-2 p-1 bg-[#f4f4f0] rounded-[7px]">
                    <button
                      type="button"
                      onClick={() => setEditTxnAdjustType("add")}
                      className={`flex-1 py-1.5 rounded-[5px] font-bold transition text-center ${
                        editTxnAdjustType === "add" ? "bg-[#d4edda] text-[#155724] shadow-xs" : "text-[#555]"
                      }`}
                    >
                      + Credit / Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTxnAdjustType("reduce")}
                      className={`flex-1 py-1.5 rounded-[5px] font-bold transition text-center ${
                        editTxnAdjustType === "reduce" ? "bg-red-100 text-red-800 shadow-xs" : "text-[#555]"
                      }`}
                    >
                      - Debit / Reduce
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#555] font-bold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={editTxnAmount}
                  onChange={(e) => setEditTxnAmount(e.target.value)}
                  className="w-full p-2 border border-[#e0e0e0] rounded-[7px] font-mono text-sm font-bold text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[#555] font-bold mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Notes or reference description"
                  value={editTxnNotes}
                  onChange={(e) => setEditTxnNotes(e.target.value)}
                  className="w-full p-2 border border-[#e0e0e0] rounded-[7px] text-xs text-[#1a1a1a] focus:ring-1 focus:ring-[#1e4d2b] bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="px-3.5 py-1.5 bg-slate-100 text-[#555] rounded-[7px] font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1e4d2b] text-white rounded-[7px] font-bold hover:bg-[#163d21] shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT / WITHDRAW ACTION MODAL SHEET */}
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

            {/* Step 1: Option Selector Grid */}
            {!selectedOption && (
              <div className="grid grid-cols-2 gap-4 py-2">
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
