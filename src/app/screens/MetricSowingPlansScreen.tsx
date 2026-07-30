import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Download, MoreHorizontal, Sprout } from "lucide-react";
import { Order, OrderItem } from "../../db/supabaseService";

interface SowingPlansScreenProps {
  orders: Order[];
}

interface SowingGroup {
  id: string; // sowingDate_product_variant
  sowingDate: string;
  productName: string;
  variantName: string;
  totalQuantity: number;
  orders: { order: Order; item: OrderItem }[];
}

export const MetricSowingPlansScreen: React.FC<SowingPlansScreenProps> = ({ orders }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Aggregate data
  const sowingGroups = useMemo(() => {
    const groups = new Map<string, SowingGroup>();

    orders.forEach((order) => {
      if (!order.items) return;
      
      order.items.forEach((item) => {
        if (!item.sowing_date) return; // Skip items without a sowing date

        const key = `${item.sowing_date}_${item.product_name}_${item.variant_name || ""}`;
        
        if (!groups.has(key)) {
          groups.set(key, {
            id: key,
            sowingDate: item.sowing_date,
            productName: item.product_name,
            variantName: item.variant_name || "",
            totalQuantity: 0,
            orders: [],
          });
        }
        
        const group = groups.get(key)!;
        group.totalQuantity += item.quantity;
        group.orders.push({ order, item });
      });
    });

    // Convert map to array and sort by date
    return Array.from(groups.values()).sort((a, b) => 
      new Date(a.sowingDate).getTime() - new Date(b.sowingDate).getTime()
    );
  }, [orders]);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-[#009b4d] font-bold px-3 py-1 rounded-md text-sm">
            {sowingGroups.length}
          </span>
          <h2 className="text-sm font-semibold text-slate-700">Sowing Plans</h2>
        </div>
        <button className="flex items-center gap-2 border border-[#009b4d] text-[#009b4d] bg-white hover:bg-emerald-50 px-4 py-2 rounded-lg font-medium text-sm transition">
          <Download className="w-4 h-4" />
          <span>Export All Plans</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 pb-4 flex justify-between items-center border-b border-slate-100">
          <h3 className="text-xl font-bold text-[#009b4d]">Upcoming</h3>
          <button className="flex items-center gap-2 text-[#009b4d] hover:bg-emerald-50 px-3 py-1.5 rounded-md font-medium text-sm transition">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f5f7f9] text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                <th className="p-4 pl-6">Sowing Date</th>
                <th className="p-4">Crop Name</th>
                <th className="p-4">Crops (+15%)</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sowingGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                // Apply 15% buffer
                const bufferedQty = Math.ceil(group.totalQuantity * 1.15);

                return (
                  <React.Fragment key={group.id}>
                    {/* Group Header Row */}
                    <tr 
                      className="hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <td className="p-4 pl-6 flex items-center gap-2 text-slate-800">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{formatDate(group.sowingDate)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-emerald-50 text-[#009b4d] font-bold px-2 py-0.5 rounded text-xs border border-emerald-100">
                            <Sprout className="w-3 h-3" />
                            {group.variantName || "VAR"}
                          </span>
                          <span className="text-slate-500 text-xs">from</span>
                          <span className="text-[#009b4d] font-semibold">{group.productName}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Sprout className="w-4 h-4 text-slate-400" />
                          {bufferedQty.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded text-xs w-max">
                          <span className="opacity-70 text-[10px]">👤</span>
                          {group.orders.length}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                          Pending
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Content Rows */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="p-0 border-t border-slate-100">
                          <div className="pl-[3.25rem] pr-6 py-4">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                                  <th className="pb-3 w-8"></th>
                                  <th className="pb-3">Order ID</th>
                                  <th className="pb-3">Order Date</th>
                                  <th className="pb-3">Customer</th>
                                  <th className="pb-3">Quantity</th>
                                  <th className="pb-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.orders.map((o, idx) => (
                                  <tr key={idx} className="text-slate-600 hover:bg-slate-100/50 transition">
                                    <td className="py-3">
                                      <div className="w-3 h-3 border-l-2 border-b-2 border-slate-300 rounded-bl-sm ml-2" />
                                    </td>
                                    <td className="py-3 font-medium text-slate-700">{o.order.order_no}</td>
                                    <td className="py-3">{formatOrderDate(o.order.order_date)}</td>
                                    <td className="py-3">
                                      <span className="text-slate-700 font-medium">{o.order.customer_name || "Unknown"}</span>
                                      <span className="text-slate-400 ml-1">()</span>
                                    </td>
                                    <td className="py-3 font-bold text-slate-700">
                                      <div className="flex items-center gap-1">
                                        <Sprout className="w-3.5 h-3.5 text-[#009b4d]" />
                                        {o.item.quantity.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wider">
                                        {o.item.status || "Pending"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              
              {sowingGroups.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No upcoming sowing plans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
