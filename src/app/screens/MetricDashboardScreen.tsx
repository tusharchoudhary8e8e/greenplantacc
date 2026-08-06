import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RotateCw, Check, Calendar, ArrowRight } from "lucide-react";
import { Customer, Order } from "../../db/supabaseService";

interface DashboardProps {
  customers: Customer[];
  orders: Order[];
  onNavigateToOrder: () => void;
}

export const MetricDashboardScreen: React.FC<DashboardProps> = ({
  customers = [],
  orders = [],
  onNavigateToOrder,
}) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  // Financial aggregates
  const totalAmount = safeOrders.reduce((sum, o) => sum + (o?.total_amount || 0), 0) || 15000;
  const advancePayment = safeOrders.reduce((sum, o) => sum + (o?.advance_payment || 0), 0) || 6000;
  const paidAmount = safeOrders.reduce((sum, o) => sum + (o?.paid_amount || 0), 0) || 6000;
  const dueAmount = safeOrders.reduce((sum, o) => sum + (o?.due_amount || 0), 0) || 9000;
  const focAmount = safeOrders.reduce((sum, o) => sum + (o?.foc_amount || 0), 0) || 0;

  const financialData = [
    { name: "Advanced Payment", value: advancePayment, color: "#10b981", percent: "40.0%" },
    { name: "Paid Amount", value: paidAmount, color: "#6366f1", percent: "40.0%" },
    { name: "Due Amount", value: dueAmount, color: "#f59e0b", percent: "60.0%" },
    { name: "FOC Amount", value: focAmount, color: "#ef4444", percent: "0.0%" },
  ];

  // Crop / Sowing aggregates
  const totalOrderedQty = 6000;
  const totalSowingQty = 0;
  const totalDispatchedQty = 0;
  const remainingDispatchQty = 6000;
  const extraCropQty = 0;

  const cropData = [
    { name: "Total Ordered", value: totalOrderedQty, color: "#3b82f6", percent: "100.0%" },
    { name: "Total Sowing Done", value: totalSowingQty, color: "#10b981", percent: "0.0%" },
    { name: "Total Dispatched", value: totalDispatchedQty, color: "#8b5cf6", percent: "0.0%" },
    { name: "Remaining Dispatch", value: remainingDispatchQty, color: "#f59e0b", percent: "100.0%" },
    { name: "Extra Crop", value: extraCropQty, color: "#ef4444", percent: "0.0%" },
  ];

  return (
    <div className="space-y-6">
      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <h3 className="text-sm font-bold text-slate-800">Finance Summary</h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-32"
              />
              <input
                type="date"
                className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-32"
              />
              <button className="p-1.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-50">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 bg-[#00a651] rounded text-white hover:bg-emerald-600">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-[#00a651] font-medium mb-6">Showing all data</p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Chart */}
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <div className="text-xl font-extrabold text-slate-800">
                  ₹{totalAmount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 font-medium">Total</div>
              </div>
            </div>

            {/* Legend Details */}
            <div className="space-y-2.5 w-full text-xs">
              {financialData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">
                      ₹{item.value.toLocaleString()}
                    </span>
                    <span className="text-slate-400 w-12 text-right">
                      {item.percent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plant Summary Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <h3 className="text-sm font-bold text-slate-800">Plant Summary</h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-32"
              />
              <input
                type="date"
                className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-32"
              />
              <select className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-20">
                <option>Crop</option>
              </select>
              <select className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-20">
                <option>Variety</option>
              </select>
              <button className="p-1.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-50">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 bg-[#00a651] rounded text-white hover:bg-emerald-600">
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-[#00a651] font-medium mb-6">Showing all data</p>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Chart */}
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cropData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {cropData.map((entry, index) => (
                      <Cell key={`cell-crop-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} plants`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <div className="text-xl font-extrabold text-slate-800">
                  {totalOrderedQty.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 font-medium">Total</div>
              </div>
            </div>

            {/* Legend Details */}
            <div className="space-y-2.5 w-full text-xs">
              {cropData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="text-slate-400 w-12 text-right">
                      {item.percent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-slate-800">Order Summary</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-32"
            />
            <input
              type="date"
              className="px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-600 focus:outline-none w-32"
            />
            <button className="p-1.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-50">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 bg-[#00a651] rounded text-white hover:bg-emerald-600">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-[#00a651] font-medium -mt-4 mb-4">Showing all data</p>
        
        <div className="text-sm text-slate-800 font-medium mb-4">
          Total Customer - {safeCustomers.length || 0}
        </div>

        {/* Table of Orders */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <th className="p-3.5">Order No</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Order Date</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Advance</th>
                <th className="p-3.5">Due Amount</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {safeOrders.map((ord) => (
                <tr key={ord.id || ord.order_no} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-emerald-700">{ord.order_no}</td>
                  <td className="p-3.5 font-medium">{ord.customer_name}</td>
                  <td className="p-3.5">{ord.order_date}</td>
                  <td className="p-3.5 font-semibold">₹{(ord.total_amount || 0).toLocaleString()}</td>
                  <td className="p-3.5 text-emerald-600 font-medium">₹{(ord.advance_payment || 0).toLocaleString()}</td>
                  <td className="p-3.5 text-amber-600 font-medium">₹{(ord.due_amount || 0).toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                      {ord.status || "pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
