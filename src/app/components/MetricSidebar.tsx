import React from "react";
import { motion } from "motion/react";
import {
  LineChart,
  ShoppingCart,
  Receipt,
  BookOpen,
  Building2,
  Wallet,
  Sprout,
  Leaf,
  Truck,
  Calendar,
  Users,
  LogOut,
  ShieldCheck,
  History,
  X,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { hasScreenAccess, getCurrentUserRole, UserRole } from "../utils/rbac";

export type MetricTab =
  | "dashboard"
  | "orders"
  | "sales_invoicing"
  | "returns_notes"
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
  | "employees"
  | "audit_logs"
  | "role_permissions";

interface SidebarProps {
  activeTab: MetricTab;
  setActiveTab: (tab: MetricTab) => void;
  onLogout?: () => void;
  userRole?: UserRole;
  onClose?: () => void;
}

export const MetricSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  userRole,
  onClose,
}) => {
  const currentRole = userRole || getCurrentUserRole();
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
        { id: "sales_invoicing" as MetricTab, label: "Post to Sales", icon: FileCheck },
        { id: "returns_notes" as MetricTab, label: "Returns (CN / DN)", icon: RotateCcw },
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
        { id: "audit_logs" as MetricTab, label: "Audit Trail & Logs", icon: History },
        { id: "role_permissions" as MetricTab, label: "Roles & Permissions", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside className="w-[260px] bg-[#1a2e1a] text-white min-h-screen h-full flex flex-col select-none shrink-0 font-sans border-r border-[#264226]">
      {/* Brand Header */}
      <div className="pt-5 pb-3.5 px-4 flex items-center justify-between border-b border-[#264226]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#2d5c36] rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
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

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7cad7c] hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close menu"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role Badge Indicator */}
      <div className="px-4 py-2.5">
        <div className="px-2.5 py-1.5 bg-[#243d24] border border-[#315231] rounded-lg flex items-center justify-between text-[11px]">
          <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">Active Role:</span>
          <span className="font-bold text-white capitalize bg-[#2d5c36] px-2 py-0.5 rounded text-[10px]">{currentRole}</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-3 pb-6 flex-1 overflow-y-auto space-y-4">
        {groups.map((group, gIdx) => {
          // Filter items based on current role's permissions
          const visibleItems = group.items.filter((item) =>
            hasScreenAccess(currentRole, item.id)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-0.5">
              <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7cad7c]">
                {group.title}
              </div>
              {visibleItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === "orders" && activeTab === "create_order") ||
                  (item.id === "purchase_bills" && activeTab === "create_purchase_bill");

                return (
                  <motion.button
                    key={idx}
                    onClick={() => setActiveTab(item.id)}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium transition-colors text-[13px] cursor-pointer ${
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
                      <motion.span
                        layoutId="activeTabDot"
                        className="w-1.5 h-1.5 rounded-full bg-[#1a2e1a]"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          );
        })}

        {/* Logout at bottom of nav list */}
        <div className="pt-4 border-t border-[#264226]">
          <motion.button
            onClick={onLogout}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-[#c8e0c8] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#7cad7c]" strokeWidth={2} />
            <span>Logout</span>
          </motion.button>
        </div>
      </nav>
    </aside>
  );
};
