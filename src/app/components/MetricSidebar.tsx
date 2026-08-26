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

  // Grouped Navigation Structure matching reference photo UI
  const groups = [
    {
      title: "CORE",
      items: [
        { id: "dashboard" as MetricTab, label: "Dashboard", icon: LineChart },
        { id: "orders" as MetricTab, label: "Sales Orders", icon: ShoppingCart },
        { id: "purchase_bills" as MetricTab, label: "Purchase Bills", icon: Receipt },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { id: "ledger" as MetricTab, label: "Party Ledger", icon: BookOpen },
        { id: "bank_accounts" as MetricTab, label: "Bank Accounts", icon: Building2 },
        { id: "expenses" as MetricTab, label: "Expenses", icon: Wallet },
      ],
    },
    {
      title: "PRODUCTION",
      items: [
        { id: "sowing_plans" as MetricTab, label: "Sowing Plans", icon: Sprout },
        { id: "production" as MetricTab, label: "Sowing Batches", icon: Leaf },
      ],
    },
    {
      title: "DISPATCH",
      items: [
        { id: "drivers" as MetricTab, label: "Drivers", icon: Truck },
        { id: "dispatch_plans" as MetricTab, label: "Dispatch Plans", icon: Calendar },
        { id: "dispatch" as MetricTab, label: "Dispatched Orders", icon: Truck },
      ],
    },
    {
      title: "MANAGEMENT",
      items: [
        { id: "inventory" as MetricTab, label: "Crops", icon: Sprout },
        { id: "customers" as MetricTab, label: "Customers", icon: Users },
        { id: "employees" as MetricTab, label: "Employees", icon: Building2 },
      ],
    },
  ];

  return (
    <aside className="w-[230px] bg-[#1a2e1a] text-white min-h-screen flex flex-col select-none shrink-0 font-sans border-r border-[#264226]">
      {/* Brand Header */}
      <div className="pt-6 pb-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2d5c36] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <Sprout className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              RKK Nursery
            </h1>
            <span className="text-[9px] font-semibold text-[#7cad7c] tracking-wider uppercase block -mt-0.5">
              MANAGEMENT
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-3 pb-6 flex-1 overflow-y-auto space-y-4">
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-0.5">
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7cad7c]">
              {group.title}
            </div>
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === "orders" && activeTab === "create_order") ||
                (item.id === "purchase_bills" && activeTab === "create_purchase_bill");

              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-all text-[13px] ${
                    isActive
                      ? "bg-white text-[#1a2e1a] font-bold shadow-xs"
                      : "text-[#c8e0c8] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#1a2e1a]" : "text-[#7cad7c]"}`} strokeWidth={2} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a2e1a]"></span>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Logout at bottom of nav list */}
        <div className="pt-4 border-t border-[#264226]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-[#c8e0c8] hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#7cad7c]" strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
