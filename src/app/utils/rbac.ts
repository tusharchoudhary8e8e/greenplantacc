import { secureStorage } from "./secureStorage";
import { supabase } from "../../lib/supabase";

export type UserRole = "admin" | "accountant" | "sales" | "worker" | "driver";

export interface ActionPermissions {
  canDeleteOrders: boolean;
  canDeleteBills: boolean;
  canViewProfitAndCost: boolean;
  canReceivePayments: boolean;
  canManageBank: boolean;
  canManageUsers: boolean;
}

export interface RoleConfig {
  id: UserRole;
  name: string;
  description: string;
  badgeColor: string;
  allowedScreens: string[];
  actions: ActionPermissions;
}

export type RoleMatrix = Record<UserRole, RoleConfig>;

export const ALL_SCREENS = [
  { id: "dashboard", label: "Dashboard", category: "Core" },
  { id: "orders", label: "Sales Orders", category: "Core" },
  { id: "sales_invoicing", label: "Post to Sales & Ledger", category: "Core" },
  { id: "returns_notes", label: "Returns & Notes (CN / DN)", category: "Core" },
  { id: "create_order", label: "Create Order Form", category: "Core" },
  { id: "purchase_bills", label: "Purchase Bills", category: "Core" },
  { id: "create_purchase_bill", label: "Create Purchase Bill", category: "Core" },
  { id: "ledger", label: "Party Ledger & Statements", category: "Finance" },
  { id: "bank_accounts", label: "Bank Accounts & Cash", category: "Finance" },
  { id: "expenses", label: "Expenses", category: "Finance" },
  { id: "sowing_plans", label: "Sowing Plans", category: "Production" },
  { id: "production", label: "Sowing Batches", category: "Production" },
  { id: "inventory", label: "Crops & Variety Rates", category: "Production" },
  { id: "drivers", label: "Drivers Management", category: "Dispatch" },
  { id: "dispatch_plans", label: "Dispatch Plans & Schedule", category: "Dispatch" },
  { id: "dispatch", label: "Dispatched Orders List", category: "Dispatch" },
  { id: "customers", label: "Customer Directory", category: "Management" },
  { id: "employees", label: "Employees & Team", category: "Management" },
  { id: "quotes", label: "Quotations", category: "Management" },
  { id: "campaign", label: "Campaigns", category: "Management" },
  { id: "audit_logs", label: "Audit Trail & Logs", category: "Management" },
  { id: "role_permissions", label: "Roles & Permissions Matrix", category: "Management" },
];

export const DEFAULT_ROLE_MATRIX: RoleMatrix = {
  admin: {
    id: "admin",
    name: "Admin (Owner)",
    description: "Unrestricted master access to all operations, financial ledgers, settings, and user permissions.",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    allowedScreens: ["*"], // All screens
    actions: {
      canDeleteOrders: true,
      canDeleteBills: true,
      canViewProfitAndCost: true,
      canReceivePayments: true,
      canManageBank: true,
      canManageUsers: true,
    },
  },
  accountant: {
    id: "accountant",
    name: "Accountant",
    description: "Financial ledger, payment receipts, vendor bills, bank reconciliation, and expense tracking.",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    allowedScreens: [
      "dashboard",
      "orders",
      "sales_invoicing",
      "returns_notes",
      "purchase_bills",
      "create_purchase_bill",
      "ledger",
      "bank_accounts",
      "expenses",
      "customers",
      "inventory",
      "audit_logs",
    ],
    actions: {
      canDeleteOrders: false,
      canDeleteBills: false,
      canViewProfitAndCost: true,
      canReceivePayments: true,
      canManageBank: true,
      canManageUsers: false,
    },
  },
  sales: {
    id: "sales",
    name: "Sales & Dispatch Staff",
    description: "Booking customer orders, delivery scheduling, sowing schedules, and payment receipts.",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    allowedScreens: [
      "dashboard",
      "orders",
      "sales_invoicing",
      "returns_notes",
      "create_order",
      "customers",
      "sowing_plans",
      "dispatch_plans",
      "dispatch",
      "drivers",
      "inventory",
      "quotes",
    ],
    actions: {
      canDeleteOrders: false,
      canDeleteBills: false,
      canViewProfitAndCost: false, // Protected profit margin
      canReceivePayments: true,
      canManageBank: false,
      canManageUsers: false,
    },
  },
  worker: {
    id: "worker",
    name: "Greenhouse / Farm Worker",
    description: "Plant nursery production batches, sowing plans, crop variety catalogs, and dispatch packing.",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    allowedScreens: [
      "sowing_plans",
      "production",
      "inventory",
      "dispatch_plans",
    ],
    actions: {
      canDeleteOrders: false,
      canDeleteBills: false,
      canViewProfitAndCost: false,
      canReceivePayments: false,
      canManageBank: false,
      canManageUsers: false,
    },
  },
  driver: {
    id: "driver",
    name: "Driver / Transporter",
    description: "Assigned vehicle trips, delivery routes, dispatch challans, and driver trip statements.",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    allowedScreens: [
      "drivers",
      "dispatch_plans",
      "dispatch",
    ],
    actions: {
      canDeleteOrders: false,
      canDeleteBills: false,
      canViewProfitAndCost: false,
      canReceivePayments: false,
      canManageBank: false,
      canManageUsers: false,
    },
  },
};

const STORAGE_KEY = "nursery_role_matrix_v1";
const ACTIVE_ROLE_KEY = "nursery_active_role_v1";

// In-Memory Matrix Cache
let activeMatrix: RoleMatrix = DEFAULT_ROLE_MATRIX;
let activeUserRole: UserRole = "admin";

/**
 * Load Matrix from Encrypted Storage & Supabase App Settings
 */
export const loadRoleMatrix = async (): Promise<RoleMatrix> => {
  // 1. Try local encrypted storage first
  const local = secureStorage.getItem<RoleMatrix | null>(STORAGE_KEY, null);
  if (local && typeof local === "object" && local.admin) {
    activeMatrix = { ...DEFAULT_ROLE_MATRIX, ...local };
  }

  // 2. Load from Supabase app_settings cloud store
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "role_permissions_matrix")
      .single();

    if (!error && data?.value && typeof data.value === "object" && data.value.admin) {
      activeMatrix = { ...DEFAULT_ROLE_MATRIX, ...data.value };
      secureStorage.setItem(STORAGE_KEY, activeMatrix);
    }
  } catch (e) {
    console.warn("Could not load cloud role permissions:", e);
  }

  // Also load active test/logged role
  const savedRole = secureStorage.getItem<UserRole>(ACTIVE_ROLE_KEY, "admin");
  if (DEFAULT_ROLE_MATRIX[savedRole]) {
    activeUserRole = savedRole;
  }

  return activeMatrix;
};

/**
 * Save Matrix to Local Encrypted Storage & Supabase Cloud
 */
export const saveRoleMatrix = async (matrix: RoleMatrix): Promise<boolean> => {
  activeMatrix = matrix;
  secureStorage.setItem(STORAGE_KEY, matrix);

  try {
    await supabase.from("app_settings").upsert({
      key: "role_permissions_matrix",
      value: matrix,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.error("Failed to save role permissions matrix to Supabase:", e);
    return false;
  }
};

/**
 * Reset Role Matrix to Factory Defaults
 */
export const resetRoleMatrix = async (): Promise<RoleMatrix> => {
  activeMatrix = DEFAULT_ROLE_MATRIX;
  await saveRoleMatrix(DEFAULT_ROLE_MATRIX);
  return activeMatrix;
};

/**
 * Get Current Active Role
 */
export const getCurrentUserRole = (): UserRole => {
  const saved = secureStorage.getItem<UserRole>(ACTIVE_ROLE_KEY, activeUserRole || "admin");
  return saved || "admin";
};

/**
 * Set Active Role (Admin role preview / staff login role)
 */
export const setCurrentUserRole = (role: UserRole): void => {
  activeUserRole = role;
  secureStorage.setItem(ACTIVE_ROLE_KEY, role);
};

/**
 * Screen Access Guard: Checks if a role can view a specific screen tab
 */
export const hasScreenAccess = (
  role: UserRole | string,
  screenId: string,
  matrix?: RoleMatrix
): boolean => {
  const m = matrix || activeMatrix || DEFAULT_ROLE_MATRIX;
  const config = m[role as UserRole];
  if (!config) return false;

  // Admin wildcard has access to all screens
  if (config.allowedScreens.includes("*")) return true;

  return config.allowedScreens.includes(screenId);
};

/**
 * Action Guard: Checks if a role can perform a specific critical action
 */
export const canPerform = (
  role: UserRole | string,
  action: keyof ActionPermissions,
  matrix?: RoleMatrix
): boolean => {
  const m = matrix || activeMatrix || DEFAULT_ROLE_MATRIX;
  const config = m[role as UserRole];
  if (!config) return false;

  return Boolean(config.actions[action]);
};
