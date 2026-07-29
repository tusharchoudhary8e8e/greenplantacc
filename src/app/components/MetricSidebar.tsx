import React from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Truck,
  FileText,
  Megaphone,
  Package,
  Users,
  UserCheck,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export type MetricTab =
  | "dashboard"
  | "orders"
  | "create_order"
  | "production"
  | "dispatch"
  | "quotes"
  | "campaign"
  | "inventory"
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
  const [prodExpanded, setProdExpanded] = React.useState(false);
  const [dispatchExpanded, setDispatchExpanded] = React.useState(false);
  const [invExpanded, setInvExpanded] = React.useState(false);

  const navItems = [
    { id: "dashboard" as MetricTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "orders" as MetricTab, label: "Orders", icon: ShoppingCart },
    {
      id: "production" as MetricTab,
      label: "Production",
      icon: ClipboardList,
      hasChildren: true,
      expanded: prodExpanded,
      toggle: () => setProdExpanded(!prodExpanded),
    },
    {
      id: "dispatch" as MetricTab,
      label: "Dispatch",
      icon: Truck,
      hasChildren: true,
      expanded: dispatchExpanded,
      toggle: () => setDispatchExpanded(!dispatchExpanded),
    },
    { id: "quotes" as MetricTab, label: "Quotes", icon: FileText },
    { id: "campaign" as MetricTab, label: "Campaign", icon: Megaphone },
    {
      id: "inventory" as MetricTab,
      label: "Inventory",
      icon: Package,
      hasChildren: true,
      expanded: invExpanded,
      toggle: () => setInvExpanded(!invExpanded),
    },
    { id: "customers" as MetricTab, label: "Customers", icon: Users },
    { id: "employees" as MetricTab, label: "Employees", icon: UserCheck },
  ];

  return (
    <aside className="w-64 bg-[#00a651] text-white min-h-screen flex flex-col justify-between select-none shrink-0 shadow-lg">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-emerald-600/60">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome,
          </h1>
          <h2 className="text-xl font-extrabold text-emerald-100">
            MetricAccounting
          </h2>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === "orders" && activeTab === "create_order");

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.hasChildren && item.toggle) {
                      item.toggle();
                    }
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all text-sm ${
                    isActive
                      ? "bg-white text-[#00a651] shadow-sm font-semibold"
                      : "text-emerald-50 hover:bg-emerald-600/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? "text-[#00a651]" : "text-emerald-100"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.hasChildren && (
                    <span>
                      {item.expanded ? (
                        <ChevronDown className="w-4 h-4 opacity-80" />
                      ) : (
                        <ChevronRight className="w-4 h-4 opacity-80" />
                      )}
                    </span>
                  )}
                </button>

                {/* Sub-menu items */}
                {item.hasChildren && item.expanded && (
                  <div className="ml-8 mt-1 space-y-1 text-xs border-l-2 border-emerald-400/40 pl-3">
                    {item.id === "production" && (
                      <>
                        <button
                          onClick={() => setActiveTab("production")}
                          className="w-full text-left py-1.5 px-2 rounded text-emerald-100 hover:text-white hover:bg-emerald-600/40"
                        >
                          Batches & Sowing
                        </button>
                      </>
                    )}
                    {item.id === "dispatch" && (
                      <>
                        <button
                          onClick={() => setActiveTab("dispatch")}
                          className="w-full text-left py-1.5 px-2 rounded text-emerald-100 hover:text-white hover:bg-emerald-600/40"
                        >
                          Dispatch Schedule
                        </button>
                      </>
                    )}
                    {item.id === "inventory" && (
                      <>
                        <button
                          onClick={() => setActiveTab("inventory")}
                          className="w-full text-left py-1.5 px-2 rounded text-emerald-100 hover:text-white hover:bg-emerald-600/40"
                        >
                          Stock & Crops
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer & Logout */}
      <div className="p-4 border-t border-emerald-600/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-emerald-100 hover:bg-emerald-600/60 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
        <p className="text-[11px] text-emerald-200/80 text-center mt-3 font-mono">
          Agri Saas powered by Bizgrowguru
        </p>
      </div>
    </aside>
  );
};
