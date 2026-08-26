import React from "react";
import {
  LineChart,
  ShoppingCart,
  ClipboardList,
  Truck,
  FileText,
  MessageSquare,
  LayoutGrid,
  Users,
  Building2,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sprout,
  Leaf,
  Calendar,
  BookOpen,
  Receipt,
  Wallet,
} from "lucide-react";

export type MetricTab =
  | "dashboard"
  | "orders"
  | "purchase_bills"
  | "create_purchase_bill"
  | "ledger"
  | "party_balances"
  | "bank_accounts"
  | "expenses"
  | "create_order"
  | "production"
  | "sowing_plans"
  | "dispatch"
  | "drivers"
  | "dispatch_plans"
  | "quotes"
  | "campaign"
  | "inventory"
  | "crops"
  | "customers"
  | "employees";

interface SidebarProps {
  activeTab: MetricTab;
  setActiveTab: (tab: MetricTab) => void;
  onLogout?: () => void;
}

export const MetricSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  const [prodExpanded, setProdExpanded] = React.useState(true);
  const [dispatchExpanded, setDispatchExpanded] = React.useState(true);
  const [invExpanded, setInvExpanded] = React.useState(true);

  const navItems = [
    { id: "dashboard" as MetricTab, label: "Dashboard", icon: LineChart },
    { id: "orders" as MetricTab, label: "Sales Orders", icon: ShoppingCart },
    { id: "purchase_bills" as MetricTab, label: "Purchase Bills", icon: Receipt },
    { id: "ledger" as MetricTab, label: "Party Ledger", icon: BookOpen },
    { id: "bank_accounts" as MetricTab, label: "Bank Accounts", icon: Building2 },
    { id: "expenses" as MetricTab, label: "Expenses", icon: Receipt },
    {
      id: "production" as MetricTab,
      label: "Production",
      icon: ClipboardList,
      hasChildren: true,
      expanded: prodExpanded,
      toggle: () => setProdExpanded(!prodExpanded),
      children: [
        { id: "sowing_plans" as MetricTab, label: "Sowing Plans", icon: Sprout },
        { id: "production" as MetricTab, label: "Sowing Batches", icon: Leaf }, // Using production for Sowing Batches
      ],
    },
    {
      id: "dispatch_main" as any,
      label: "Dispatch",
      icon: Truck,
      hasChildren: true,
      expanded: dispatchExpanded,
      toggle: () => setDispatchExpanded(!dispatchExpanded),
      children: [
        { id: "drivers" as MetricTab, label: "Drivers", icon: Truck },
        { id: "dispatch_plans" as MetricTab, label: "Dispatch Plans", icon: Calendar },
        { id: "dispatch" as MetricTab, label: "Dispatched Orders", icon: Truck },
      ],
    },
    { id: "quotes" as MetricTab, label: "Quotes", icon: FileText },
    { id: "campaign" as MetricTab, label: "Campaign", icon: MessageSquare },
    {
      id: "inventory_main" as any,
      label: "Inventory",
      icon: LayoutGrid,
      hasChildren: true,
      expanded: invExpanded,
      toggle: () => setInvExpanded(!invExpanded),
      children: [
        { id: "inventory" as MetricTab, label: "Crops", icon: Sprout },
      ],
    },
    { id: "customers" as MetricTab, label: "Customers", icon: Users },
    { id: "employees" as MetricTab, label: "Employees", icon: Building2 },
  ];

  return (
    <aside className="w-[280px] bg-[#009b4d] text-white min-h-screen flex flex-col select-none shrink-0">
      {/* Brand Header */}
      <div className="pt-8 pb-6 px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
          Welcome,<br />RKK Nursery
        </h1>
        <div className="mt-6 border-b border-white/30"></div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 pb-4 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === "orders" && activeTab === "create_order");

          return (
            <div key={idx}>
              <button
                onClick={() => {
                  if (item.hasChildren && item.toggle) {
                    item.toggle();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all text-[15px] ${
                  isActive && !item.hasChildren
                    ? "bg-white text-[#009b4d] font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                  <span>{item.label}</span>
                </div>
                {item.hasChildren && (
                  <span>
                    {item.expanded ? (
                      <ChevronDown className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <ChevronRight className="w-4 h-4" strokeWidth={3} />
                    )}
                  </span>
                )}
              </button>

              {/* Sub-menu items */}
              {item.hasChildren && item.expanded && item.children && (
                <div className="mt-1 mb-2 space-y-1">
                  {item.children.map((child, cIdx) => {
                    const ChildIcon = child.icon;
                    const isChildActive = activeTab === child.id;
                    return (
                      <button
                        key={cIdx}
                        onClick={() => setActiveTab(child.id)}
                        className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-[15px] transition-colors ${
                          isChildActive
                            ? "bg-white text-[#009b4d] font-semibold"
                            : "text-white hover:bg-white/10"
                        }`}
                      >
                        <ChildIcon className="w-5 h-5" strokeWidth={2.5} />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Logout at bottom of nav list */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] font-medium text-white hover:bg-white/10 transition-colors mt-2"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};
