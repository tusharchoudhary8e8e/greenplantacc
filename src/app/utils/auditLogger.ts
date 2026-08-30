import { supabase, getCurrentUser } from "../../lib/supabase";
import { secureStorage } from "./secureStorage";
import { getCurrentUserRole } from "./rbac";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "ADJUST" | "PERMISSION_CHANGE";

export type AuditEntityType =
  | "order"
  | "purchase_bill"
  | "receipt"
  | "bank_account"
  | "expense"
  | "customer"
  | "batch"
  | "product"
  | "rbac"
  | "system";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  user_role: string;
  entity_type: AuditEntityType;
  entity_id: string;
  entity_label?: string;
  action: AuditAction;
  changes_summary: string;
  previous_state?: Record<string, any> | null;
  new_state?: Record<string, any> | null;
  created_at?: string;
}

const STORAGE_KEY = "demo_audit_logs";
let AUDIT_LOGS_CACHE: AuditLogEntry[] = [];

/**
 * Compute human-readable delta diff between previous and new states
 */
export const calculateStateDiff = (
  prev: Record<string, any> | null | undefined,
  next: Record<string, any> | null | undefined
): string => {
  if (!prev && next) return "Created new record";
  if (prev && !next) return "Deleted record";
  if (!prev && !next) return "No changes recorded";

  const changes: string[] = [];
  const ignoredKeys = new Set(["updated_at", "created_at", "user_id"]);

  const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);

  for (const k of allKeys) {
    if (ignoredKeys.has(k)) continue;

    const v1 = prev?.[k];
    const v2 = next?.[k];

    // Handle nested array or object
    if (typeof v1 === "object" || typeof v2 === "object") {
      if (JSON.stringify(v1) !== JSON.stringify(v2)) {
        changes.push(`${k} modified`);
      }
    } else if (v1 !== v2) {
      const displayV1 = v1 === undefined || v1 === null ? "None" : String(v1);
      const displayV2 = v2 === undefined || v2 === null ? "None" : String(v2);
      changes.push(`${k}: '${displayV1}' → '${displayV2}'`);
    }
  }

  return changes.length > 0 ? changes.slice(0, 5).join("; ") : "No field values changed";
};

/**
 * Record an audit log entry in real-time
 */
export const logAuditAction = async (entry: {
  entity_type: AuditEntityType;
  entity_id: string;
  entity_label?: string;
  action: AuditAction;
  changes_summary?: string;
  previous_state?: Record<string, any> | null;
  new_state?: Record<string, any> | null;
}): Promise<AuditLogEntry> => {
  const user = await getCurrentUser();
  const role = getCurrentUserRole();

  const summary =
    entry.changes_summary ||
    calculateStateDiff(entry.previous_state, entry.new_state);

  const fullEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    user_id: user?.id || "local-user",
    user_email: user?.email || "owner@nursery.com",
    user_role: role,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    entity_label: entry.entity_label || `${entry.entity_type.toUpperCase()} #${entry.entity_id}`,
    action: entry.action,
    changes_summary: summary,
    previous_state: entry.previous_state || null,
    new_state: entry.new_state || null,
    created_at: new Date().toISOString(),
  };

  // 1. Update in-memory and local encrypted storage cache
  AUDIT_LOGS_CACHE = secureStorage.getItem<AuditLogEntry[]>(STORAGE_KEY, []);
  AUDIT_LOGS_CACHE.unshift(fullEntry);
  if (AUDIT_LOGS_CACHE.length > 500) AUDIT_LOGS_CACHE = AUDIT_LOGS_CACHE.slice(0, 500); // retain last 500
  secureStorage.setItem(STORAGE_KEY, AUDIT_LOGS_CACHE);

  // 2. Direct write to Supabase ma_audit_logs table
  try {
    await supabase.from("ma_audit_logs").insert({
      id: fullEntry.id,
      timestamp: fullEntry.timestamp,
      user_id: user?.id || null,
      user_email: fullEntry.user_email,
      user_role: fullEntry.user_role,
      entity_type: fullEntry.entity_type,
      entity_id: fullEntry.entity_id,
      entity_label: fullEntry.entity_label,
      action: fullEntry.action,
      changes_summary: fullEntry.changes_summary,
      previous_state: fullEntry.previous_state,
      new_state: fullEntry.new_state,
    });
  } catch (e) {
    console.warn("Supabase audit log table write error:", e);
  }

  return fullEntry;
};

/**
 * Fetch audit logs with optional filters
 */
export const getAuditLogs = async (filters?: {
  entity_type?: string;
  action?: string;
  search?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> => {
  let logs: AuditLogEntry[] = [];
  const limit = filters?.limit || 200;

  try {
    let query = supabase
      .from("ma_audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (filters?.entity_type && filters.entity_type !== "all") {
      query = query.eq("entity_type", filters.entity_type);
    }
    if (filters?.action && filters.action !== "all") {
      query = query.eq("action", filters.action);
    }

    const { data, error } = await query;
    if (!error && data && Array.isArray(data) && data.length > 0) {
      logs = data as AuditLogEntry[];
      secureStorage.setItem(STORAGE_KEY, logs);
      return logs;
    }
  } catch (e) {
    console.warn("Supabase audit log fetch fallback:", e);
  }

  // Local fallback
  logs = secureStorage.getItem<AuditLogEntry[]>(STORAGE_KEY, []);
  if (filters?.entity_type && filters.entity_type !== "all") {
    logs = logs.filter((l) => l.entity_type === filters.entity_type);
  }
  if (filters?.action && filters.action !== "all") {
    logs = logs.filter((l) => l.action === filters.action);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        (l.entity_label || "").toLowerCase().includes(q) ||
        (l.entity_id || "").toLowerCase().includes(q) ||
        (l.changes_summary || "").toLowerCase().includes(q) ||
        (l.user_email || "").toLowerCase().includes(q)
    );
  }

  return logs;
};
