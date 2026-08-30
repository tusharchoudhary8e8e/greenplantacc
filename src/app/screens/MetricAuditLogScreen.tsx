import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Shield,
  Clock,
  User,
  Trash2,
  Edit,
  PlusCircle,
  FileText,
  DollarSign,
  Building,
  Users,
  Sprout,
  X,
  ArrowRight,
} from "lucide-react";
import { AuditLogEntry, getAuditLogs, AuditAction, AuditEntityType } from "../utils/auditLogger";
import { PaginationControl } from "../components/PaginationControl";

export const MetricAuditLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs({
      entity_type: entityFilter,
      action: actionFilter,
    });
    setLogs(data);
    setLoading(false);
  };

  // Reset page when filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entityFilter, actionFilter]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchLabel = (l.entity_label || "").toLowerCase().includes(q);
        const matchId = (l.entity_id || "").toLowerCase().includes(q);
        const matchUser = (l.user_email || "").toLowerCase().includes(q);
        const matchSummary = (l.changes_summary || "").toLowerCase().includes(q);
        if (!matchLabel && !matchId && !matchUser && !matchSummary) return false;
      }
      return true;
    });
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "UPDATE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELETE":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "ADJUST":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "PERMISSION_CHANGE":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getEntityIcon = (type: AuditEntityType) => {
    switch (type) {
      case "order":
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case "purchase_bill":
        return <DollarSign className="w-3.5 h-3.5 text-indigo-600" />;
      case "receipt":
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case "bank_account":
        return <Building className="w-3.5 h-3.5 text-amber-600" />;
      case "customer":
        return <Users className="w-3.5 h-3.5 text-teal-600" />;
      case "batch":
        return <Sprout className="w-3.5 h-3.5 text-emerald-600" />;
      case "rbac":
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const exportCSV = () => {
    const headers = ["Timestamp", "Operator", "Role", "Action", "Entity Type", "Entity ID", "Summary"];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.user_email || "N/A",
      l.user_role,
      l.action,
      l.entity_type,
      l.entity_id,
      `"${(l.changes_summary || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nursery_audit_trail_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Audit Trail & Edit Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Forensic timeline of all invoice edits, order deletions, bank adjustments, and permission changes.
            </p>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order no, email, changes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Modules</option>
            <option value="order">Sales Orders</option>
            <option value="purchase_bill">Purchase Bills</option>
            <option value="receipt">Payment Receipts</option>
            <option value="bank_account">Bank & Cash</option>
            <option value="customer">Customers</option>
            <option value="batch">Sowing Batches</option>
            <option value="rbac">Roles & Permissions</option>
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ADJUST">ADJUST</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 tracking-wider">
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">OPERATOR / USER</th>
                <th className="py-3 px-4 text-center">ACTION</th>
                <th className="py-3 px-4">TARGET ENTITY</th>
                <th className="py-3 px-4">CHANGES SUMMARY</th>
                <th className="py-3 px-4 text-center">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(log.timestamp).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className="font-semibold text-slate-900">{log.user_email}</div>
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                        {log.user_role}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entity_type)}
                      <span className="font-bold text-slate-800">{log.entity_label || log.entity_id}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                    {log.changes_summary}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="Inspect Snapshot & Full Diff"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No audit records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredLogs.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* Snapshot Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden space-y-4 p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  Audit Snapshot: {selectedLog.entity_label || selectedLog.entity_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                Operator: <span className="font-bold text-slate-800">{selectedLog.user_email}</span> ({selectedLog.user_role})
              </div>
              <div>
                Timestamp: <span className="font-mono text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900">
              <strong>Changes Delta:</strong> {selectedLog.changes_summary}
            </div>

            {/* Side-by-side State Inspection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto min-h-0 pt-2">
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Previous State (Before Mutation)
                </h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-xl overflow-auto max-h-60 border border-slate-800">
                  {selectedLog.previous_state
                    ? JSON.stringify(selectedLog.previous_state, null, 2)
                    : "null (Created new record)"}
                </pre>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  New State (After Mutation)
                </h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-xl overflow-auto max-h-60 border border-slate-800">
                  {selectedLog.new_state
                    ? JSON.stringify(selectedLog.new_state, null, 2)
                    : "null (Deleted record)"}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
