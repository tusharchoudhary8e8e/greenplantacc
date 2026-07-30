import React, { useState, useMemo } from "react";
import { Search, Calendar as CalendarIcon, X, Download, Sprout, Bell } from "lucide-react";
import { Order, OrderItem } from "../../db/supabaseService";

interface DispatchPlansScreenProps {
  orders: Order[];
}

interface GroupedDispatch {
  dateObj: Date;
  dateKey: string;
  month: string;
  dayNum: string;
  dayName: string;
  year: string;
  items: { order: Order; item: OrderItem }[];
}

export const MetricDispatchPlansScreen: React.FC<DispatchPlansScreenProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Aggregate orders by dispatch date (or order date as fallback)
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, GroupedDispatch>();

    orders.forEach((order) => {
      if (!order.items || order.items.length === 0) return;
      
      order.items.forEach((item) => {
        // Group by sowing_date or order_date for demo purposes
        const dateStr = item.sowing_date || order.order_date;
        if (!dateStr) return;

        const dateObj = new Date(dateStr);
        const dateKey = dateObj.toISOString().split('T')[0];

        if (!groups.has(dateKey)) {
          const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          const dayNum = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          const year = dateObj.toLocaleDateString('en-US', { year: 'numeric' });

          groups.set(dateKey, {
            dateObj,
            dateKey,
            month,
            dayNum,
            dayName,
            year,
            items: [],
          });
        }
        
        groups.get(dateKey)!.items.push({ order, item });
      });
    });

    // Convert map to array and sort by date ascending
    return Array.from(groups.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [orders]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedOrders;
    const lowerSearch = searchTerm.toLowerCase();
    
    return groupedOrders.map(group => ({
      ...group,
      items: group.items.filter(i => 
        i.order.order_no?.toLowerCase().includes(lowerSearch) ||
        i.order.customer_name?.toLowerCase().includes(lowerSearch) ||
        i.item.product_name.toLowerCase().includes(lowerSearch) ||
        (i.item.variant_name && i.item.variant_name.toLowerCase().includes(lowerSearch))
      )
    })).filter(group => group.items.length > 0);
  }, [groupedOrders, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-[#009b4d] font-bold px-3 py-1 rounded-md text-sm">
            {orders.length}
          </span>
          <h2 className="text-sm font-semibold text-slate-700">Dispatch Plans</h2>
        </div>
        <button className="flex items-center gap-2 border border-[#009b4d] text-[#009b4d] bg-white hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium text-sm transition">
          <Download className="w-4 h-4" />
          <span>Export 4</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col lg:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1 w-full flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by 'Order Id', 'Crop name', 'Customer Name'"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#009b4d] text-slate-600 placeholder-slate-400"
            />
          </div>

          <select className="border border-slate-200 rounded-lg text-sm text-slate-600 px-3 py-2 w-32 focus:outline-none focus:ring-1 focus:ring-[#009b4d]">
            <option>Status</option>
          </select>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                className="pl-3 pr-8 py-2 w-32 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#009b4d] text-slate-600"
              />
              <CalendarIcon className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                className="pl-3 pr-8 py-2 w-32 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#009b4d] text-slate-600"
              />
              <CalendarIcon className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button 
            onClick={() => setSearchTerm("")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <button className="bg-[#009b4d] text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition shadow-sm">
            Search
          </button>
        </div>
      </div>

      {/* Dispatch Plans List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <div key={group.dateKey} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row">
            {/* Left Date Block */}
            <div className="md:w-32 bg-white flex flex-row md:flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{group.month}</span>
                <span className="text-2xl font-black text-slate-800 leading-none">{group.dayNum}</span>
              </div>
              <div className="flex flex-col items-center md:mt-2 ml-4 md:ml-0">
                <span className="text-slate-600 text-sm font-medium">{group.dayName}</span>
                <span className="text-slate-400 text-xs">{group.year}</span>
              </div>
            </div>

            {/* Right Data Block */}
            <div className="flex-1 w-full overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <th className="p-4 pl-6">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Ordered Crop</th>
                    <th className="p-4">Dispatched Qty</th>
                    <th className="p-4">Unit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Payment Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((i, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-slate-800 text-[13px]">{i.order.order_no}</div>
                        <div className="text-xs text-slate-500 mt-1">{i.order.order_date}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 text-[13px]">
                        {i.order.customer_name || "Unknown"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-emerald-50 text-[#009b4d] font-bold px-2 py-0.5 rounded text-[11px] border border-emerald-100">
                            <Sprout className="w-3 h-3" />
                            {i.item.variant_name || "VAR"}
                          </span>
                          <span className="text-slate-400 text-xs">-</span>
                          <span className="text-[#009b4d] font-semibold text-[13px]">{i.item.product_name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-600 text-[13px]">
                        <span className="bg-emerald-50 text-[#009b4d] px-2 py-0.5 rounded mr-1 border border-emerald-100">
                          {i.item.dispatched_qty || 0}
                        </span>
                        <span className="text-slate-400">/</span> {i.item.quantity.toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-600 font-medium text-[13px]">
                        {i.order.items_total ? `Unit 1 - ${i.order.items_total}` : "N/A"}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${i.item.status === 'dispatched' 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                            : 'bg-slate-100 text-slate-600'}`
                        }>
                          {i.item.status === 'dispatched' ? 'Ready To Dispatch' : 'In Queue'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <Bell className="w-4 h-4 text-slate-400 mb-0.5" />
                          <span className="text-[10px] text-slate-500 font-medium">
                            {i.order.due_amount && i.order.due_amount > 0 ? '32d left' : 'none'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-500 font-medium">
            No dispatch plans found.
          </div>
        )}
      </div>
    </div>
  );
};
