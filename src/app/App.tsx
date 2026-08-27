import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "@supabase/supabase-js";
import { getCurrentUser, onAuthStateChange, signOutUser } from "../lib/supabase";
import { MetricSidebar, MetricTab } from "./components/MetricSidebar";
import { MetricDashboardScreen } from "./screens/MetricDashboardScreen";
import { MetricSowingPlansScreen } from "./screens/MetricSowingPlansScreen";
import { MetricCreateOrderScreen } from "./screens/MetricCreateOrderScreen";
import { MetricOrdersListScreen } from "./screens/MetricOrdersListScreen";
import { MetricCustomersScreen } from "./screens/MetricCustomersScreen";
import { MetricInventoryScreen } from "./screens/MetricInventoryScreen";
import { MetricLedgerScreen } from "./screens/MetricLedgerScreen";
import { MetricLoginScreen } from "./screens/MetricLoginScreen";
import {
  MetricProductionScreen,
  MetricDispatchScreen,
  MetricQuotesScreen,
  MetricCampaignScreen,
  MetricEmployeesScreen,
} from "./screens/MetricModulesScreen";
import { MetricDispatchPlansScreen } from "./screens/MetricDispatchPlansScreen";
import { MetricDriversScreen } from "./screens/MetricDriversScreen";
import { CreateBatchModal } from "./components/CreateBatchModal";
import { ReceivePaymentModal } from "./components/ReceivePaymentModal";

import { MetricPurchaseBillsScreen } from "./screens/MetricPurchaseBillsScreen";
import { MetricCreatePurchaseBillScreen } from "./screens/MetricCreatePurchaseBillScreen";
import { MetricBankAccountsScreen } from "./screens/MetricBankAccountsScreen";
import { MetricExpensesScreen } from "./screens/MetricExpensesScreen";

import {
  Customer,
  Product,
  Order,
  ProductionBatch,
  DispatchRecord,
  Quote,
  Campaign,
  Employee,
  PaymentReceipt,
  PurchaseBill,
  Driver,
  SupabaseService,
} from "../db/supabaseService";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-700 min-h-screen">
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <pre className="text-xs bg-white p-4 rounded border border-red-200 overflow-auto">
            {String(this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded font-bold text-xs"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainAppContent />
    </ErrorBoundary>
  );
}

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<MetricTab>("dashboard");
  const [authUser, setAuthUser] = useState<User | null>(null);

  // State data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>([]);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // UI state
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [selectedLedgerCustomerId, setSelectedLedgerCustomerId] = useState<string>("");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingPurchaseBill, setEditingPurchaseBill] = useState<PurchaseBill | null>(null);
  const [isReceivePaymentOpen, setIsReceivePaymentOpen] = useState(false);
  const [receivePaymentCustId, setReceivePaymentCustId] = useState("");
  const [receivePaymentOrderId, setReceivePaymentOrderId] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshAppData = useCallback(async () => {
    try {
      const [c, p, o, b, d, q, cmp, emp, rec, pur, drv] = await Promise.all([
        SupabaseService.getCustomers().catch(() => []),
        SupabaseService.getProducts().catch(() => []),
        SupabaseService.getOrders().catch(() => []),
        SupabaseService.getBatches().catch(() => []),
        SupabaseService.getDispatches().catch(() => []),
        SupabaseService.getQuotes().catch(() => []),
        SupabaseService.getCampaigns().catch(() => []),
        SupabaseService.getEmployees().catch(() => []),
        SupabaseService.getPaymentReceipts().catch(() => []),
        SupabaseService.getPurchaseBills().catch(() => []),
        SupabaseService.getDrivers().catch(() => []),
      ]);
      if (c) setCustomers(c);
      if (p) setProducts(p);
      if (o) setOrders(o);
      if (b) setBatches(b);
      if (d) setDispatches(d);
      if (q) setQuotes(q);
      if (cmp) setCampaigns(cmp);
      if (emp) setEmployees(emp);
      if (rec) setPaymentReceipts(rec);
      if (pur) setPurchaseBills(pur);
      if (drv) setDrivers(drv);
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  }, []);

  const isInitialLoadDoneRef = React.useRef(false);
  const currentUserIdRef = React.useRef<string | null>(null);

  const loadAllData = useCallback(async () => {
    if (!isInitialLoadDoneRef.current) {
      setLoading(true);
    }
    try {
      await refreshAppData();
      isInitialLoadDoneRef.current = true;
    } catch (e) {
      console.error("Error loading app data:", e);
    } finally {
      setLoading(false);
    }
  }, [refreshAppData]);

  const handleSavePurchaseBill = (savedBill: PurchaseBill) => {
    setPurchaseBills((prev) => {
      const idx = prev.findIndex((b) => (b.id && b.id === savedBill.id) || (b.bill_no && b.bill_no === savedBill.bill_no));
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = savedBill;
        return updated;
      }
      return [savedBill, ...prev];
    });
    setEditingPurchaseBill(null);
    setActiveTab("purchase_bills");
  };

  const handleEditPurchaseBill = (bill: PurchaseBill) => {
    setEditingPurchaseBill(bill);
    setActiveTab("create_purchase_bill");
  };

  const handleDeletePurchaseBill = async (billId: string) => {
    await SupabaseService.deletePurchaseBill(billId);
    setPurchaseBills((prev) => prev.filter((b) => b.id !== billId && b.bill_no !== billId));
  };

  const handleSaveBatch = async (batch: Partial<ProductionBatch>) => {
    const saved = await SupabaseService.saveBatch(batch as ProductionBatch);
    setBatches([saved, ...batches]);
    setShowCreateBatch(false);
  };

  useEffect(() => {
    let isSubscribed = true;

    // Check Supabase Auth State
    getCurrentUser().then((u) => {
      if (isSubscribed && u) {
        setAuthUser(u);
        currentUserIdRef.current = u.id;
      }
    });

    const { data: authListener } = onAuthStateChange((u) => {
      if (!isSubscribed) return;

      const newUserId = u?.id || null;
      const previousUserId = currentUserIdRef.current;

      setAuthUser(u);
      currentUserIdRef.current = newUserId;

      // Only trigger full data load if user actually changed (e.g. login/logout)
      if (newUserId !== previousUserId) {
        if (newUserId) {
          isInitialLoadDoneRef.current = false;
          loadAllData();
        } else {
          setLoading(false);
        }
      } else {
        // Same user (e.g. token refreshed on tab switch / window focus) — sync silently without showing loading spinner!
        refreshAppData();
      }
    });

    loadAllData();

    // Disable 2-finger touchpad / mouse wheel gesture from changing number inputs
    const handleWheel = () => {
      const activeEl = document.activeElement as HTMLInputElement;
      if (activeEl && activeEl.type === "number") {
        activeEl.blur();
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      isSubscribed = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener("wheel", handleWheel);
    };
  }, [loadAllData, refreshAppData]);

  const handleLogout = async () => {
    await signOutUser();
    setAuthUser(null);
  };

  const handleOrderSaved = (savedOrd: Order) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => (o.id && o.id === savedOrd.id) || (o.order_no && o.order_no === savedOrd.order_no));
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = savedOrd;
        return updated;
      }
      return [savedOrd, ...prev];
    });
    setEditingOrder(null);
    setActiveTab("orders");
  };

  const handleEditOrder = (ord: Order) => {
    setEditingOrder(ord);
    setActiveTab("create_order");
  };

  const handleDeleteOrder = async (orderId: string) => {
    await SupabaseService.deleteOrder(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId && o.order_no !== orderId));
  };

  const handleOpenReceivePaymentModal = (custId?: string, orderId?: string) => {
    setReceivePaymentCustId(custId || "");
    setReceivePaymentOrderId(orderId || "");
    setIsReceivePaymentOpen(true);
  };

  const handlePaymentSaved = async (newRec: PaymentReceipt) => {
    setPaymentReceipts((prev) => [newRec, ...prev]);
    const updatedOrders = await SupabaseService.getOrders();
    setOrders(updatedOrders);
  };

  const handleCustomerAdded = (newCust: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === newCust.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newCust;
        return updated;
      }
      return [newCust, ...prev];
    });
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If user is not authenticated, show Login screen
  if (!authUser) {
    return (
      <MetricLoginScreen
        onLoginSuccess={() => loadAllData()}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f3faf7] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-emerald-100 flex items-center justify-between px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 text-slate-700 hover:bg-emerald-50 hover:text-[#00a651] rounded-lg transition"
            title="Toggle Menu"
            aria-label="Toggle Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
          <div>
            <h1 className="text-[26px] font-extrabold text-[#00a651] tracking-tight leading-none">
              RKK Nursery
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1 uppercase tracking-wider">
              {activeTab.replace('_', ' ')}
            </p>
          </div>
        </div>
      </header>

      {/* Mobile/Drawer Menu Overlay */}
      <div 
        className={`fixed inset-0 z-40 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Drawer */}
        <div 
          className={`absolute top-0 left-0 h-full shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <MetricSidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setIsMobileMenuOpen(false);
            }}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0 p-6 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-screen text-slate-400 font-medium">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading MetricAccounting...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === "dashboard" && (
                <MetricDashboardScreen
                  customers={customers}
                  orders={orders}
                  purchaseBills={purchaseBills}
                  onNavigateToTab={(tab) => setActiveTab(tab as any)}
                />
              )}

              {activeTab === "bank_accounts" && (
                <MetricBankAccountsScreen
                  onBack={() => setActiveTab("dashboard")}
                  onAccountsUpdated={refreshAppData}
                />
              )}

              {activeTab === "expenses" && (
                <MetricExpensesScreen
                  onBack={() => setActiveTab("dashboard")}
                  onExpensesUpdated={refreshAppData}
                />
              )}

              {activeTab === "sowing_plans" && (
                <MetricSowingPlansScreen
                  orders={orders}
                  batches={batches}
                  customers={customers}
                  onOpenCreateBatch={() => setShowCreateBatch(true)}
                />
              )}

              {activeTab === "orders" && (
                <MetricOrdersListScreen
                  orders={orders}
                  customers={customers}
                  onCreateOrder={() => {
                    setEditingOrder(null);
                    setActiveTab("create_order");
                  }}
                  onEditOrder={handleEditOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onViewLedger={(custId) => {
                    setSelectedLedgerCustomerId(custId);
                    setActiveTab("ledger");
                  }}
                  onOpenReceivePayment={handleOpenReceivePaymentModal}
                />
              )}

              {activeTab === "purchase_bills" && (
                <MetricPurchaseBillsScreen
                  bills={purchaseBills}
                  customers={customers}
                  onCreateBill={() => {
                    setEditingPurchaseBill(null);
                    setActiveTab("create_purchase_bill");
                  }}
                  onEditBill={handleEditPurchaseBill}
                  onDeleteBill={handleDeletePurchaseBill}
                  onViewLedger={(partyId) => {
                    setSelectedLedgerCustomerId(partyId);
                    setActiveTab("ledger");
                  }}
                />
              )}

              {activeTab === "create_purchase_bill" && (
                <MetricCreatePurchaseBillScreen
                  customers={customers}
                  products={products}
                  editingBill={editingPurchaseBill}
                  onBillSaved={handleSavePurchaseBill}
                  onCancel={() => {
                    setEditingPurchaseBill(null);
                    setActiveTab("purchase_bills");
                  }}
                />
              )}

              {activeTab === "create_order" && (
                <MetricCreateOrderScreen
                  customers={customers}
                  products={products}
                  batches={batches}
                  editingOrder={editingOrder}
                  onOrderSaved={handleOrderSaved}
                  onCancel={() => {
                    setEditingOrder(null);
                    setActiveTab("orders");
                  }}
                />
              )}

              {activeTab === "customers" && (
                <MetricCustomersScreen
                  customers={customers}
                  onCustomerAdded={handleCustomerAdded}
                  onViewLedger={(custId) => {
                    setSelectedLedgerCustomerId(custId);
                    setActiveTab("ledger");
                  }}
                />
              )}

              {activeTab === "ledger" && (
                <MetricLedgerScreen
                  customers={customers}
                  orders={orders}
                  dispatches={dispatches}
                  paymentReceipts={paymentReceipts}
                  purchaseBills={purchaseBills}
                  initialCustomerId={selectedLedgerCustomerId}
                  onBack={() => setActiveTab("dashboard")}
                  onEditOrder={handleEditOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onOpenReceivePayment={handleOpenReceivePaymentModal}
                  onNavigateToCreateOrder={() => {
                    setEditingOrder(null);
                    setActiveTab("create_order");
                  }}
                />
              )}

              {activeTab === "inventory" && (
                <MetricInventoryScreen
                  products={products}
                  batches={batches}
                  onProductsUpdated={loadAllData}
                />
              )}

              {activeTab === "production" && (
                <MetricProductionScreen 
                  batches={batches} 
                  orders={orders} 
                  onCreateBatch={() => setShowCreateBatch(true)} 
                />
              )}
              
              {activeTab === "dispatch_plans" && (
                <MetricDispatchPlansScreen
                  orders={orders}
                  dispatches={dispatches}
                  drivers={drivers}
                  customers={customers}
                  employees={employees}
                  onDispatchSaved={(newD) => setDispatches([newD, ...dispatches])}
                />
              )}
              {activeTab === "drivers" && (
                <MetricDriversScreen drivers={drivers} onDriversUpdated={loadAllData} />
              )}

              {activeTab === "dispatch" && (
                <MetricDispatchScreen
                  dispatches={dispatches}
                  customers={customers}
                  orders={orders}
                  employees={employees}
                  drivers={drivers}
                  onDispatchSaved={(newD) => setDispatches([newD, ...dispatches])}
                />
              )}
              {activeTab === "quotes" && <MetricQuotesScreen quotes={quotes} />}
              {activeTab === "campaign" && <MetricCampaignScreen campaigns={campaigns} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <CreateBatchModal 
        isOpen={showCreateBatch} 
        onClose={() => setShowCreateBatch(false)} 
        products={products} 
        orders={orders}
        onSave={handleSaveBatch} 
      />

      <ReceivePaymentModal
        isOpen={isReceivePaymentOpen}
        onClose={() => setIsReceivePaymentOpen(false)}
        customers={customers}
        orders={orders}
        initialCustomerId={receivePaymentCustId}
        initialOrderId={receivePaymentOrderId}
        onPaymentSaved={handlePaymentSaved}
      />
    </div>
  );
}
