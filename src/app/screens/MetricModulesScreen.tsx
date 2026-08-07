import React, { useState } from "react";
import { ClipboardList, Truck, FileText, Megaphone, UserCheck, CheckCircle2, Clock } from "lucide-react";
import { ProductionBatch, DispatchRecord, Quote, Campaign, Employee, Customer, Order } from "../../db/supabaseService";
import { ScheduleDispatchModal } from "../components/ScheduleDispatchModal";

// ─── PRODUCTION SCREEN ──────────────────────────────────────────────
export const MetricProductionScreen: React.FC<{
  batches: ProductionBatch[];
  orders?: any[]; // optional temporarily until App.tsx is updated
  onCreateBatch?: () => void;
}> = ({ batches = [], orders = [], onCreateBatch }) => {
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (b: ProductionBatch) => {
    // Basic logic for badges based on end_date vs today
    if (b.status === "ready") return <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-200">Ready To Dispatch</span>;
    if (!b.end_date) return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold">On Time</span>;
    
    const end = new Date(b.end_date).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
    
    if (diffDays === 1) return <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-200">1 Day Early</span>;
    if (diffDays > 1) return <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-200">Expires in {diffDays} Days</span>;
    if (diffDays < 0) return <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold border border-red-200">Overdue by {Math.abs(diffDays)} Days</span>;
    
    return <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-200">On Time</span>;
  };

  const safeBatches = Array.isArray(batches) ? batches : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">Greenza Solutions Demo</h1>
          <div className="text-xs text-slate-500 font-medium mt-1">Sowing Batches</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <div className="flex gap-4">
            <input type="text" placeholder="Search..." className="p-2 border border-slate-200 rounded-lg text-xs w-64 focus:outline-emerald-500" />
            <select className="p-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-600 focus:outline-emerald-500">
              <option>Status</option>
            </select>
            <input type="date" className="p-2 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-emerald-500" />
            <input type="date" className="p-2 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-emerald-500" />
          </div>
          <button
            onClick={onCreateBatch}
            className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition shadow-sm text-xs"
          >
            + Create Batch
          </button>
        </div>

        {/* List View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 border-b border-slate-100">
                <th className="py-3 px-4">CROP</th>
                <th className="py-3 px-4">QUANTITY</th>
                <th className="py-3 px-4">NUMBER OF TRAYS</th>
                <th className="py-3 px-4">UNIT</th>
                <th className="py-3 px-4">LOT NO.</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4">CREATED AT</th>
                <th className="py-3 px-4">COMPLETE AT</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeBatches.map((b) => {
                const isExpanded = expandedRows[b.id || b.batch_no || ""];
                const batchOrders = safeOrders.flatMap(o => 
                  o.items?.filter((item: any) => item && item.batch_id === b.id).map((item: any) => ({
                    order_no: o.order_no,
                    order_date: o.order_date,
                    customer_name: o.customer_name,
                    quantity: item.quantity || 0,
                  })) || []
                );

                return (
                  <React.Fragment key={b.id || b.batch_no}>
                    <tr className="hover:bg-slate-50 transition cursor-pointer group" onClick={() => toggleRow(b.id || b.batch_no || "")}>
                      <td className="py-3 px-4 flex items-center gap-3">
                        <button className="text-slate-400 hover:text-emerald-600">
                          {isExpanded ? <span className="rotate-90 block">▶</span> : <span>▶</span>}
                        </button>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">🌱</div>
                          <div>
                            <p className="font-bold text-slate-700 text-xs">{b.product_name || "Crop"}</p>
                            <p className="text-[10px] text-slate-500">{b.variant_name || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 text-xs">{(b.total_seeds || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        {b.trays_used || 0} <span className="text-slate-400 font-normal">| {b.seeds_per_tray || 120} crops/tray</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs font-medium">{b.unit || "Unit 1"}</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 text-xs font-bold">{b.lot_no || b.batch_no || "-"}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(b)}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{b.sowing_date || "-"}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{b.end_date || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-slate-400 hover:text-slate-700">•••</button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={9} className="p-0 border-b border-slate-100">
                          <div className="px-16 py-4">
                            <table className="w-full text-left text-xs text-slate-600 bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-[10px] uppercase font-bold text-slate-400">
                                  <th className="py-2 px-4">ORDER ID</th>
                                  <th className="py-2 px-4">ORDER DATE</th>
                                  <th className="py-2 px-4">CUSTOMER</th>
                                  <th className="py-2 px-4 text-right">SOWED QUANTITY</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {batchOrders.length > 0 ? (
                                  batchOrders.map((ord, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition">
                                      <td className="py-2 px-4 font-mono font-medium text-emerald-700">{ord.order_no}</td>
                                      <td className="py-2 px-4">{ord.order_date}</td>
                                      <td className="py-2 px-4 font-medium text-slate-700">{ord.customer_name}</td>
                                      <td className="py-2 px-4 text-right font-bold text-emerald-600">{(ord.quantity || 0).toLocaleString()}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="py-3 text-center text-slate-400">No orders associated with this batch.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {safeBatches.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">No batches created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── DISPATCH SCREEN ───────────────────────────────────────────────
interface MetricDispatchScreenProps {
  dispatches: DispatchRecord[];
  customers?: Customer[];
  orders?: Order[];
  employees?: Employee[];
  onDispatchSaved?: (newDispatch: DispatchRecord) => void;
}

export const MetricDispatchScreen: React.FC<MetricDispatchScreenProps> = ({
  dispatches = [],
  customers = [],
  orders = [],
  employees = [],
  onDispatchSaved,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const safeDispatches = Array.isArray(dispatches) ? dispatches : [];

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">MetricAccounting Demo</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Dispatch Schedule & Vehicle Tracking</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm flex items-center gap-2 shadow-sm"
        >
          <Truck className="w-4 h-4" />
          <span>+ Schedule Dispatch</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <th className="p-3.5">Dispatch No</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Dispatch Date</th>
              <th className="p-3.5">Vehicle No</th>
              <th className="p-3.5">Driver</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {safeDispatches.length > 0 ? (
              safeDispatches.map((d) => (
                <tr key={d.id || d.dispatch_no} className="hover:bg-slate-50 transition">
                  <td className="p-3.5 font-bold text-emerald-700">{d.dispatch_no}</td>
                  <td className="p-3.5 font-medium">{d.customer_name}</td>
                  <td className="p-3.5">{d.dispatch_date}</td>
                  <td className="p-3.5 font-mono">{d.vehicle_no}</td>
                  <td className="p-3.5">{d.driver_name} ({d.driver_phone || "N/A"})</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                      {d.status || "scheduled"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  No dispatched orders scheduled yet. Click "+ Schedule Dispatch" to schedule a vehicle dispatch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ScheduleDispatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        orders={orders}
        employees={employees}
        onSaveDispatch={(newD) => {
          if (onDispatchSaved) onDispatchSaved(newD);
        }}
      />
    </div>
  );
};

// ─── QUOTES SCREEN ────────────────────────────────────────────────
export const MetricQuotesScreen: React.FC<{ quotes: Quote[] }> = ({ quotes }) => (
  <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">MetricAccounting Demo</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Quotations & Pricing Quotes</p>
      </div>
      <button className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm">
        + Create Quote
      </button>
    </div>

    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
            <th className="p-3.5">Quote No</th>
            <th className="p-3.5">Customer</th>
            <th className="p-3.5">Quote Date</th>
            <th className="p-3.5">Valid Until</th>
            <th className="p-3.5">Total Amount</th>
            <th className="p-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {quotes.map((q) => (
            <tr key={q.id} className="hover:bg-slate-50 transition">
              <td className="p-3.5 font-bold text-emerald-700">{q.quote_no}</td>
              <td className="p-3.5 font-medium">{q.customer_name}</td>
              <td className="p-3.5">{q.quote_date}</td>
              <td className="p-3.5">{q.valid_until}</td>
              <td className="p-3.5 font-bold">₹{(q.total_amount || 0).toLocaleString()}</td>
              <td className="p-3.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {q.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── CAMPAIGN SCREEN ──────────────────────────────────────────────
export const MetricCampaignScreen: React.FC<{ campaigns: Campaign[] }> = ({ campaigns }) => (
  <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">MetricAccounting Demo</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Marketing & Outreach Campaigns</p>
      </div>
      <button className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm">
        + Launch Campaign
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((c) => (
        <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">{c.name}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {c.status}
            </span>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Target Zone: <span className="font-bold text-slate-700">{c.target_zone}</span></p>
            <p>Duration: {c.start_date} to {c.end_date}</p>
            <p>Budget: <span className="font-bold text-emerald-600">₹{(c.budget || 0).toLocaleString()}</span></p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── EMPLOYEES SCREEN ─────────────────────────────────────────────
export const MetricEmployeesScreen: React.FC<{ employees: Employee[] }> = ({ employees }) => (
  <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">MetricAccounting Demo</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Employees & Staff Management</p>
      </div>
      <button className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm">
        + Add Employee
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {employees.map((emp) => (
        <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">{emp.name}</h3>
            <span className="text-xs font-mono text-slate-400">{emp.emp_id}</span>
          </div>
          <p className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
            {emp.role} ({emp.department})
          </p>
          <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
            <p>Phone: {emp.phone}</p>
            <p>Email: {emp.email}</p>
            <p>Salary: ₹{(emp.salary || 0).toLocaleString()}/mo</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
