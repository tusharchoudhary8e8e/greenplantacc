import React, { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { getCurrentUser, onAuthStateChange, signOutUser } from "../lib/supabase";
import { MetricSidebar, MetricTab } from "./components/MetricSidebar";
import { MetricDashboardScreen } from "./screens/MetricDashboardScreen";
import { MetricSowingPlansScreen } from "./screens/MetricSowingPlansScreen";
import { MetricCreateOrderScreen } from "./screens/MetricCreateOrderScreen";
import { MetricCustomersScreen } from "./screens/MetricCustomersScreen";
import { MetricInventoryScreen } from "./screens/MetricInventoryScreen";
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

import {
  Customer,
  Product,
  Order,
  ProductionBatch,
  DispatchRecord,
  Quote,
  Campaign,
  Employee,
  SupabaseService,
} from "../db/supabaseService";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-slate-800">Something went wrong</h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-[#00a651] text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition"
            >
              Reload Application
            </button>
          </div>
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

  // UI state
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const [c, p, o, b, d, q, cmp, emp] = await Promise.all([
      SupabaseService.getCustomers(),
      SupabaseService.getProducts(),
      SupabaseService.getOrders(),
      SupabaseService.getBatches(),
      SupabaseService.getDispatches(),
      SupabaseService.getQuotes(),
      SupabaseService.getCampaigns(),
      SupabaseService.getEmployees(),
    ]);

    setCustomers(c);
    setProducts(p);
    setOrders(o);
    setBatches(b);
    setDispatches(d);
    setQuotes(q);
    setCampaigns(cmp);
    setEmployees(emp);
    setLoading(false);
  }, []);

  const handleSaveBatch = async (batch: Partial<ProductionBatch>) => {
    const saved = await SupabaseService.saveBatch(batch as ProductionBatch);
    setBatches([saved, ...batches]);
    setShowCreateBatch(false);
  };

  useEffect(() => {
    // Check Supabase Auth State
    getCurrentUser().then((u) => {
      if (u) {
        setAuthUser(u);
      }
    });

    const { data: authListener } = onAuthStateChange((u) => {
      setAuthUser(u);
      loadAllData();
    });

    loadAllData();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadAllData]);

  const handleLogout = async () => {
    await signOutUser();
    setAuthUser(null);
  };

  const handleOrderSaved = (newOrd: Order) => {
    setOrders([newOrd, ...orders]);
    setActiveTab("dashboard");
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
              Greenza Solutions Demo
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
          <>
            {activeTab === "dashboard" && (
              <MetricDashboardScreen
                customers={customers}
                orders={orders}
                onNavigateToOrder={() => setActiveTab("create_order")}
              />
            )}

            {activeTab === "sowing_plans" && (
              <MetricSowingPlansScreen orders={orders} />
            )}

            {(activeTab === "orders" || activeTab === "create_order") && (
              <MetricCreateOrderScreen
                customers={customers}
                products={products}
                onOrderSaved={handleOrderSaved}
                onCancel={() => setActiveTab("dashboard")}
              />
            )}

            {activeTab === "customers" && (
              <MetricCustomersScreen
                customers={customers}
                onCustomerAdded={handleCustomerAdded}
              />
            )}

            {activeTab === "inventory" && (
              <MetricInventoryScreen
                products={products}
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
              <MetricDispatchPlansScreen orders={orders} />
            )}
            
            {activeTab === "drivers" && (
              <MetricDriversScreen />
            )}

            {activeTab === "dispatch" && <MetricDispatchScreen dispatches={dispatches} />}
            {activeTab === "quotes" && <MetricQuotesScreen quotes={quotes} />}
            {activeTab === "campaign" && <MetricCampaignScreen campaigns={campaigns} />}
            {activeTab === "employees" && <MetricEmployeesScreen employees={employees} />}
          </>
        )}
      </main>

      <CreateBatchModal 
        isOpen={showCreateBatch} 
        onClose={() => setShowCreateBatch(false)} 
        products={products} 
        onSave={handleSaveBatch} 
      />
    </div>
  );
}
