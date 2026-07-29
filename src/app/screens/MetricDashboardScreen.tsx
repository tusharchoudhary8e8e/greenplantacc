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
  customers,
  orders,
  onNavigateToOrder,
}) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Financial aggregates
  const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 15000;
  const advancePayment = orders.reduce((sum, o) => sum + (o.advance_payment || 0), 0) || 6000;
  const paidAmount = orders.reduce((sum, o) => sum + (o.paid_amount || 0), 0) || 6000;
  const dueAmount = orders.reduce((sum, o) => sum + (o.due_amount || 0), 0) || 9000;
  const focAmount = orders.reduce((sum, o) => sum + (o.foc_amount || 0), 0) || 0;

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
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">
            MetricAccounting Demo
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Dashboard</p>
        </div>
        <button
          onClick={onNavigateToOrder}
          className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition shadow-sm text-sm"
        >
          <span>Create New Order</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Summary Donut Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Financial Summary</h3>
            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
              Live Metrics
            </span>
          </div>

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

        {/* Plant / Sowing Summary Donut Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">Sowing & Dispatch Summary</h3>
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
              Plant Volume
            </span>
          </div>

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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">Order Summary</h3>

          {/* Date Filters & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 placeholder-slate-400 w-36"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
            <span className="text-slate-400 text-sm">to</span>
            <div className="relative">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 placeholder-slate-400 w-36"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"
              title="Reset dates"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              className="p-2 bg-[#00a651] text-white rounded-lg hover:bg-emerald-600 transition"
              title="Apply Filter"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subhead indicators */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="text-emerald-600 font-semibold">Showing all data</span>
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
            Total Customer - {customers.length || 1}
          </span>
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
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition">
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
