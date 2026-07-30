import React from "react";
import { Plus, MoreHorizontal } from "lucide-react";

export const MetricDriversScreen: React.FC = () => {
  // Mock data as driver table doesn't exist in DB yet
  const drivers = [
    {
      id: "1",
      name: "monu",
      phone: "9752348309",
      vehicleName: "mahemndra",
      vehicleNumber: "mp28c1234",
      balance: 0,
      status: "Active"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-[#009b4d] font-bold px-3 py-1 rounded-md text-sm">
            {drivers.length}
          </span>
          <h2 className="text-sm font-semibold text-slate-700">Drivers</h2>
        </div>
        <button className="flex items-center gap-2 bg-[#009b4d] text-white hover:bg-emerald-700 px-4 py-2.5 rounded-lg font-semibold text-sm transition shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={3} />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-[#f5f7f9] text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="p-4 pl-6">Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Vehicle Name</th>
                <th className="p-4">Vehicle Number</th>
                <th className="p-4">Balance</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 pl-6 font-semibold text-slate-700 text-[13px]">
                    {driver.name}
                  </td>
                  <td className="p-4 text-slate-600 text-[13px]">
                    {driver.phone}
                  </td>
                  <td className="p-4 text-slate-600 font-medium text-[13px]">
                    {driver.vehicleName}
                  </td>
                  <td className="p-4 text-slate-600 text-[13px]">
                    {driver.vehicleNumber}
                  </td>
                  <td className="p-4 font-bold text-[#009b4d] text-[13px]">
                    ₹{driver.balance}
                  </td>
                  <td className="p-4 flex items-center justify-center gap-6">
                    <span className="bg-emerald-50 text-[#009b4d] border border-emerald-100 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                      {driver.status}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
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
