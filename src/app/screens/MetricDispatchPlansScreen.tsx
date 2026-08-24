import React, { useState, useMemo } from "react";
import { Search, Calendar as CalendarIcon, X, Download, Sprout, Bell, Truck, Phone, MapPin } from "lucide-react";
import { Order, OrderItem, DispatchRecord, Driver, Customer, Employee } from "../../db/supabaseService";
import { ScheduleDispatchModal } from "../components/ScheduleDispatchModal";

interface DispatchPlansScreenProps {
  orders: Order[];
  dispatches?: DispatchRecord[];
  drivers?: Driver[];
  customers?: Customer[];
  employees?: Employee[];
  onDispatchSaved?: (newDispatch: DispatchRecord) => void;
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

export const MetricDispatchPlansScreen: React.FC<DispatchPlansScreenProps> = ({
  orders = [],
  dispatches = [],
  drivers = [],
  customers = [],
  employees = [],
  onDispatchSaved,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [dispatchRecords, setDispatchRecords] = useState<DispatchRecord[]>(dispatches);

  React.useEffect(() => {
    if (dispatches && dispatches.length > 0) {
      setDispatchRecords(dispatches);
    }
  }, [dispatches]);

  // Aggregate orders by dispatch date (or order date as fallback)
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, GroupedDispatch>();

    orders.forEach((order) => {
      if (!order.items || order.items.length === 0) return;

      order.items.forEach((item) => {
        const dateStr = item.sowing_date || order.order_date;
        if (!dateStr) return;

        const dateObj = new Date(dateStr);
        const dateKey = isNaN(dateObj.getTime()) ? dateStr : dateObj.toISOString().split("T")[0];

        if (!groups.has(dateKey)) {
          const month = isNaN(dateObj.getTime())
            ? "AUG"
            : dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
          const dayNum = isNaN(dateObj.getTime())
            ? "24"
            : dateObj.toLocaleDateString("en-US", { day: "2-digit" });
          const dayName = isNaN(dateObj.getTime())
            ? "Monday"
            : dateObj.toLocaleDateString("en-US", { weekday: "long" });
          const year = isNaN(dateObj.getTime())
            ? "2026"
            : dateObj.toLocaleDateString("en-US", { year: "numeric" });

          groups.set(dateKey, {
            dateObj: isNaN(dateObj.getTime()) ? new Date() : dateObj,
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

    return Array.from(groups.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [orders]);

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedOrders;
    const lowerSearch = searchTerm.toLowerCase();

    return groupedOrders
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (i) =>
            i.order.order_no?.toLowerCase().includes(lowerSearch) ||
            i.order.customer_name?.toLowerCase().includes(lowerSearch) ||
            i.item.product_name.toLowerCase().includes(lowerSearch) ||
            (i.item.variant_name && i.item.variant_name.toLowerCase().includes(lowerSearch))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedOrders, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-[#009b4d] font-bold px-3 py-1 rounded-md text-xs">
              {orders.length} Orders
            </span>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dispatch Plans & Scheduling</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Overview of upcoming crop dispatch schedules, assigned drivers & vehicles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 bg-[#009b4d] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition text-xs shadow-sm"
          >
            <Truck className="w-4 h-4" />
            <span>+ Schedule Dispatch</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col lg:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4 flex-1 w-full flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Crop, Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#009b4d] text-slate-800 font-medium"
            />
          </div>
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span>Clear Search</span>
          </button>
        )}
      </div>

      {/* Dispatch Plans List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <div
            key={group.dateKey}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Date Block */}
            <div className="md:w-32 bg-slate-50/70 flex flex-row md:flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
              <div className="flex flex-col items-center">
                <span className="text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                  {group.month}
                </span>
                <span className="text-2xl font-black text-slate-800 leading-none">{group.dayNum}</span>
              </div>
              <div className="flex flex-col items-center md:mt-2 ml-4 md:ml-0">
                <span className="text-slate-600 text-xs font-bold">{group.dayName}</span>
                <span className="text-slate-400 text-[10px] font-medium">{group.year}</span>
              </div>
            </div>

            {/* Right Data Table */}
            <div className="flex-1 w-full overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[850px]">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 bg-slate-50/30">
                    <th className="p-3.5 pl-6">ORDER NO</th>
                    <th className="p-3.5">CUSTOMER & VILLAGE</th>
                    <th className="p-3.5">ORDERED CROP</th>
                    <th className="p-3.5">DISPATCH QTY</th>
                    <th className="p-3.5">ASSIGNED DRIVER & VEHICLE</th>
                    <th className="p-3.5">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {group.items.map((i, idx) => {
                    // Dynamic Customer Lookup
                    const matchedCustomer = customers.find(
                      (c) => c.id === i.order.customer_id || c.name.toLowerCase() === (i.order.customer_name || "").toLowerCase()
                    );
                    const custPhone = i.order.customer_phone || matchedCustomer?.phone || "";
                    const village = matchedCustomer?.city || matchedCustomer?.address || "N/A";

                    // Dynamic Dispatch & Driver Lookup
                    const matchedDispatch = dispatchRecords.find(
                      (d) => d.order_id === i.order.id || d.order_no === i.order.order_no
                    );

                    const matchedDriver = drivers.find(
                      (drv) =>
                        drv.id === matchedDispatch?.driver_name ||
                        drv.name.toLowerCase() === (matchedDispatch?.driver_name || "").toLowerCase()
                    );

                    const driverName = matchedDispatch?.driver_name || matchedDriver?.name || "";
                    const driverPhone = matchedDispatch?.driver_phone || matchedDriver?.phone || "";
                    const vehicleName = matchedDispatch?.vehicle_name || matchedDriver?.vehicle_name || "";
                    const vehicleNo = matchedDispatch?.vehicle_no || matchedDriver?.vehicle_number || "";

                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 pl-6">
                          <div className="font-extrabold text-emerald-800 text-xs">{i.order.order_no || `#ORD-${i.order.id}`}</div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">{i.order.order_date}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs">
                              {i.order.customer_name || "Customer"}
                            </span>
                            {custPhone && (
                              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {custPhone}
                              </span>
                            )}
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {village}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs border border-emerald-200">
                              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                              {i.item.variant_name || "VAR"} - {i.item.product_name}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 font-bold text-slate-700">
                          <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 font-mono text-xs">
                            🌱 {(i.item.dispatched_qty || i.item.quantity || 0).toLocaleString()} plants
                          </span>
                        </td>

                        <td className="p-3.5">
                          {driverName ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                {driverName}
                              </span>
                              {driverPhone && (
                                <span className="text-[11px] text-purple-600 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-purple-400" />
                                  {driverPhone}
                                </span>
                              )}
                              {(vehicleName || vehicleNo) && (
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {vehicleName} {vehicleNo ? `#${vehicleNo}` : ""}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unassigned (No driver selected)</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                              matchedDispatch || i.item.status === "dispatched"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {matchedDispatch?.status === "delivered"
                              ? "Delivered"
                              : matchedDispatch || i.item.status === "dispatched"
                              ? "Item Dispatched"
                              : "In Queue"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-slate-400 font-medium text-xs">
            No dispatch plans found. Click "+ Schedule Dispatch" to assign delivery drivers and vehicles.
          </div>
        )}
      </div>

      {/* Schedule Dispatch Modal */}
      <ScheduleDispatchModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        customers={customers}
        orders={orders}
        employees={employees}
        drivers={drivers}
        onSaveDispatch={(newD) => {
          setDispatchRecords([newD, ...dispatchRecords]);
          if (onDispatchSaved) onDispatchSaved(newD);
        }}
      />
    </div>
  );
};
