import React, { useState, useEffect, useCallback } from "react";
import { MetricSidebar, MetricTab } from "./components/MetricSidebar";
import { MetricDashboardScreen } from "./screens/MetricDashboardScreen";
import { MetricCreateOrderScreen } from "./screens/MetricCreateOrderScreen";
import { MetricCustomersScreen } from "./screens/MetricCustomersScreen";
import { MetricInventoryScreen } from "./screens/MetricInventoryScreen";
import {
  MetricProductionScreen,
  MetricDispatchScreen,
  MetricQuotesScreen,
  MetricCampaignScreen,
  MetricEmployeesScreen,
} from "./screens/MetricModulesScreen";

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

export default function App() {
  const [activeTab, setActiveTab] = useState<MetricTab>("dashboard");

  // State data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleOrderSaved = (newOrd: Order) => {
    setOrders([newOrd, ...orders]);
    setActiveTab("dashboard");
  };

  const handleCustomerAdded = (newCust: Customer) => {
    setCustomers([newCust, ...customers]);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
      {/* Left Sidebar matching Greenza Solutions layout */}
      <MetricSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => alert("Logged out successfully.")}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
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

            {activeTab === "production" && <MetricProductionScreen batches={batches} />}
            {activeTab === "dispatch" && <MetricDispatchScreen dispatches={dispatches} />}
            {activeTab === "quotes" && <MetricQuotesScreen quotes={quotes} />}
            {activeTab === "campaign" && <MetricCampaignScreen campaigns={campaigns} />}
            {activeTab === "employees" && <MetricEmployeesScreen employees={employees} />}
          </>
        )}
      </main>
    </div>
  );
}
