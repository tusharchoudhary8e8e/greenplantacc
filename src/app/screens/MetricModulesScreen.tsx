import React from "react";
import { ClipboardList, Truck, FileText, Megaphone, UserCheck, CheckCircle2, Clock } from "lucide-react";
import { ProductionBatch, DispatchRecord, Quote, Campaign, Employee } from "../../db/supabaseService";

// ─── PRODUCTION SCREEN ──────────────────────────────────────────────
export const MetricProductionScreen: React.FC<{ batches: ProductionBatch[] }> = ({ batches }) => (
  <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">MetricAccounting Demo</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Production & Sowing Batches Tracker</p>
      </div>
      <button className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm">
        + New Sowing Batch
      </button>
    </div>

    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
            <th className="p-3.5">Batch No</th>
            <th className="p-3.5">Crop / Variant</th>
            <th className="p-3.5">Sowing Date</th>
            <th className="p-3.5">Total Seeds</th>
            <th className="p-3.5">Cocopeat (kg)</th>
            <th className="p-3.5">Trays Used</th>
            <th className="p-3.5">Germination %</th>
            <th className="p-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {batches.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50 transition">
              <td className="p-3.5 font-bold text-emerald-700">{b.batch_no}</td>
              <td className="p-3.5 font-medium">{b.product_name} - {b.variant_name}</td>
              <td className="p-3.5">{b.sowing_date}</td>
              <td className="p-3.5 font-semibold">{(b.total_seeds || 0).toLocaleString()}</td>
              <td className="p-3.5">{b.cocopeat_used} kg</td>
              <td className="p-3.5">{b.trays_used}</td>
              <td className="p-3.5 font-bold text-emerald-600">{b.germination_pct}%</td>
              <td className="p-3.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {b.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── DISPATCH SCREEN ───────────────────────────────────────────────
export const MetricDispatchScreen: React.FC<{ dispatches: DispatchRecord[] }> = ({ dispatches }) => (
  <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">MetricAccounting Demo</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Dispatch Schedule & Vehicle Tracking</p>
      </div>
      <button className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition text-sm">
        + Schedule Dispatch
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
          {dispatches.map((d) => (
            <tr key={d.id} className="hover:bg-slate-50 transition">
              <td className="p-3.5 font-bold text-emerald-700">{d.dispatch_no}</td>
              <td className="p-3.5 font-medium">{d.customer_name}</td>
              <td className="p-3.5">{d.dispatch_date}</td>
              <td className="p-3.5 font-mono">{d.vehicle_no}</td>
              <td className="p-3.5">{d.driver_name} ({d.driver_phone})</td>
              <td className="p-3.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {d.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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
