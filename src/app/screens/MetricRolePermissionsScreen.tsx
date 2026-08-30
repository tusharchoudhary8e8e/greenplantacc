import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  CheckSquare,
  Square,
  Save,
  RotateCcw,
  UserCheck,
  Eye,
  Lock,
  DollarSign,
  Trash2,
  Building,
  Users,
  Sprout,
  Truck,
  BookOpen,
  Receipt,
  ShoppingCart,
  LineChart,
} from "lucide-react";
import {
  UserRole,
  RoleMatrix,
  DEFAULT_ROLE_MATRIX,
  ALL_SCREENS,
  loadRoleMatrix,
  saveRoleMatrix,
  resetRoleMatrix,
  getCurrentUserRole,
  setCurrentUserRole,
} from "../utils/rbac";

interface RolePermissionsScreenProps {
  onRoleChanged?: (newRole: UserRole) => void;
  onPermissionsUpdated?: () => void;
}

export const MetricRolePermissionsScreen: React.FC<RolePermissionsScreenProps> = ({
  onRoleChanged,
  onPermissionsUpdated,
}) => {
  const [matrix, setMatrix] = useState<RoleMatrix>(DEFAULT_ROLE_MATRIX);
  const [selectedRole, setSelectedRole] = useState<UserRole>("sales");
  const [activeUserRole, setActiveUserRoleState] = useState<UserRole>("admin");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadRoleMatrix().then((m) => {
      setMatrix(m);
      setActiveUserRoleState(getCurrentUserRole());
    });
  }, []);

  const currentConfig = matrix[selectedRole] || DEFAULT_ROLE_MATRIX[selectedRole];

  // Toggle Screen Access
  const toggleScreen = (screenId: string) => {
    if (selectedRole === "admin") return; // Admin always has full access

    setMatrix((prev) => {
      const roleConfig = prev[selectedRole];
      let newScreens = [...roleConfig.allowedScreens];

      if (newScreens.includes(screenId)) {
        newScreens = newScreens.filter((s) => s !== screenId);
      } else {
        newScreens.push(screenId);
      }

      return {
        ...prev,
        [selectedRole]: {
          ...roleConfig,
          allowedScreens: newScreens,
        },
      };
    });
  };

  // Toggle Action Permission
  const toggleAction = (actionKey: keyof typeof currentConfig.actions) => {
    if (selectedRole === "admin") return; // Admin actions cannot be disabled

    setMatrix((prev) => {
      const roleConfig = prev[selectedRole];
      return {
        ...prev,
        [selectedRole]: {
          ...roleConfig,
          actions: {
            ...roleConfig.actions,
            [actionKey]: !roleConfig.actions[actionKey],
          },
        },
      };
    });
  };

  // Save to Supabase Cloud
  const handleSave = async () => {
    setSaving(true);
    const ok = await saveRoleMatrix(matrix);
    setSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onPermissionsUpdated) onPermissionsUpdated();
    }
  };

  // Reset to Defaults
  const handleReset = async () => {
    if (window.confirm("Reset all roles & permissions to standard nursery defaults?")) {
      const def = await resetRoleMatrix();
      setMatrix(def);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onPermissionsUpdated) onPermissionsUpdated();
    }
  };

  // Switch Active Role for live testing
  const handleSwitchActiveRole = (role: UserRole) => {
    setCurrentUserRole(role);
    setActiveUserRoleState(role);
    if (onRoleChanged) onRoleChanged(role);
  };

  const categories = ["Core", "Finance", "Production", "Dispatch", "Management"];

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Roles & Permissions Matrix</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Method 1: Visual permission controls. Define permitted screens and restricted actions for each staff role.
              </p>
            </div>
          </div>
        </div>

        {/* Live Active Role Tester */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-600 pl-2">Active Test Role:</span>
          <select
            value={activeUserRole}
            onChange={(e) => handleSwitchActiveRole(e.target.value as UserRole)}
            className="bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="admin">👑 Admin (Owner)</option>
            <option value="accountant">💼 Accountant</option>
            <option value="sales">🌱 Sales & Dispatch</option>
            <option value="worker">🧤 Greenhouse Worker</option>
            <option value="driver">🚚 Driver</option>
          </select>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Permissions saved successfully to Supabase cloud! All staff sessions are updated in real-time.</span>
        </div>
      )}

      {/* Role Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(Object.keys(DEFAULT_ROLE_MATRIX) as UserRole[]).map((r) => {
          const cfg = matrix[r] || DEFAULT_ROLE_MATRIX[r];
          const isSelected = selectedRole === r;
          return (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`p-4 rounded-xl border text-left transition relative cursor-pointer ${
                isSelected
                  ? "bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40"
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>{cfg.name}</span>
                {r === "admin" && <span>👑</span>}
              </div>
              <span
                className={`text-[10px] mt-1 block truncate ${
                  isSelected ? "text-emerald-200" : "text-slate-400"
                }`}
              >
                {cfg.id.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Role Settings Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6">
        {/* Role Overview */}
        <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                Configuring: <span className="text-emerald-700">{currentConfig.name}</span>
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentConfig.badgeColor}`}>
                {selectedRole.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{currentConfig.description}</p>
          </div>

          {selectedRole === "admin" && (
            <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 text-xs font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin has full unrestricted access by design</span>
            </div>
          )}
        </div>

        {/* Section 1: Critical Action Permissions */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Critical Action Permissions</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                key: "canDeleteOrders" as const,
                label: "Delete Sales Orders & Invoices",
                desc: "Allows permanently deleting or voiding customer purchase orders.",
                icon: Trash2,
              },
              {
                key: "canDeleteBills" as const,
                label: "Delete Vendor Purchase Bills",
                desc: "Allows removing raw material & seed bills.",
                icon: Trash2,
              },
              {
                key: "canViewProfitAndCost" as const,
                label: "View Profit Margins & COGS",
                desc: "Shows nursery cost breakdown and net gross margin on dashboard.",
                icon: LineChart,
              },
              {
                key: "canReceivePayments" as const,
                label: "Receive Payments & Record Cash",
                desc: "Permits entering customer voucher payments and issuing receipts.",
                icon: DollarSign,
              },
              {
                key: "canManageBank" as const,
                label: "Manage Bank Accounts & Adjustments",
                desc: "Enables creating bank accounts and adjusting balances.",
                icon: Building,
              },
              {
                key: "canManageUsers" as const,
                label: "Manage Staff Roles & Access",
                desc: "Allows modifying employee permissions and inviting users.",
                icon: Users,
              },
            ].map((act) => {
              const isEnabled = selectedRole === "admin" || currentConfig.actions[act.key];
              return (
                <div
                  key={act.key}
                  onClick={() => toggleAction(act.key)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    isEnabled
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="pt-0.5">
                    {isEnabled ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{act.label}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Permitted Screens Matrix */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Permitted Screen Tabs</span>
            </h3>
            {selectedRole !== "admin" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMatrix((prev) => ({
                      ...prev,
                      [selectedRole]: {
                        ...prev[selectedRole],
                        allowedScreens: ALL_SCREENS.map((s) => s.id),
                      },
                    }));
                  }}
                  className="text-[10px] font-bold text-emerald-700 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setMatrix((prev) => ({
                      ...prev,
                      [selectedRole]: {
                        ...prev[selectedRole],
                        allowedScreens: [],
                      },
                    }));
                  }}
                  className="text-[10px] font-bold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const screensInCat = ALL_SCREENS.filter((s) => s.category === cat);
              return (
                <div key={cat} className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {cat} Modules
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {screensInCat.map((scr) => {
                      const isAllowed =
                        selectedRole === "admin" || currentConfig.allowedScreens.includes(scr.id);
                      return (
                        <div
                          key={scr.id}
                          onClick={() => toggleScreen(scr.id)}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                            isAllowed
                              ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-400"
                          }`}
                        >
                          <span>{scr.label}</span>
                          {isAllowed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#00a651] text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving to Cloud..." : "Save Role Permissions"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
