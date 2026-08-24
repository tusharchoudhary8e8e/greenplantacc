import React, { useState } from "react";
import {
  ClipboardList,
  Truck,
  FileText,
  Megaphone,
  UserCheck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Printer,
  MapPin,
  Phone,
  Plus,
  X,
  Sprout,
  Box,
  Download,
  CornerDownRight,
  Check,
} from "lucide-react";
import {
  ProductionBatch,
  DispatchRecord,
  Quote,
  Campaign,
  Employee,
  Customer,
  Order,
  Driver,
  SupabaseService,
} from "../../db/supabaseService";
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
          <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">RKK Nursery</h1>
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
  const [dispatchList, setDispatchList] = useState<DispatchRecord[]>(dispatches);

  // Expanded rows state (by default expand first item)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    "disp-101": true,
  });

  // Action Menu Open ID
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // View Bill Modal State
  const [viewBillRecord, setViewBillRecord] = useState<DispatchRecord | null>(null);

  // Edit Dispatch Modal State
  const [editRecord, setEditRecord] = useState<DispatchRecord | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editVehicleNo, setEditVehicleNo] = useState("");
  const [editVehicleName, setEditVehicleName] = useState("");
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverPhone, setEditDriverPhone] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editDueAmount, setEditDueAmount] = useState<number | "">("");
  const [editStatus, setEditStatus] = useState<"pending" | "in_transit" | "delivered" | "dispatched">("dispatched");
  const [editItems, setEditItems] = useState<
    { product_name: string; variant_name: string; quantity: number; trays?: number; lot_no?: string; unit?: string }[]
  >([]);
  const [syncOrderBill, setSyncOrderBill] = useState(true);

  React.useEffect(() => {
    if (dispatches && dispatches.length > 0) {
      setDispatchList(dispatches);
    }
  }, [dispatches]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenEdit = (d: DispatchRecord) => {
    setActionMenuId(null);
    setEditRecord(d);
    setEditDate(d.dispatch_date || new Date().toISOString().split("T")[0]);
    setEditVehicleNo(d.vehicle_no || "");
    setEditVehicleName(d.vehicle_name || "mahendra");
    setEditDriverName(d.driver_name || "");
    setEditDriverPhone(d.driver_phone || "");
    setEditVillage(d.village || "");
    setEditDueAmount(d.due_amount !== undefined ? d.due_amount : "");
    setEditStatus((d.status as any) || "dispatched");
    setEditItems(
      d.items && d.items.length > 0
        ? d.items.map((it) => ({ ...it }))
        : [{ product_name: "TOMATO", variant_name: "SAAHO", quantity: 10000, trays: 84, lot_no: "12345", unit: "Unit 1" }]
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    const totalPlants = editItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
    const totalTrays = editItems.reduce((sum, i) => sum + Number(i.trays || 0), 0);

    const updated: DispatchRecord = {
      ...editRecord,
      dispatch_date: editDate,
      vehicle_no: editVehicleNo.toUpperCase(),
      vehicle_name: editVehicleName,
      driver_name: editDriverName,
      driver_phone: editDriverPhone,
      village: editVillage,
      due_amount: editDueAmount === "" ? 0 : Number(editDueAmount),
      status: editStatus,
      total_plants: totalPlants,
      total_trays: totalTrays,
      items: editItems,
    };

    try {
      await SupabaseService.saveDispatch(updated);
      setDispatchList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

      // Sync with Order Bill if selected
      if (syncOrderBill && updated.order_id) {
        const targetOrd = orders.find((o) => o.id === updated.order_id || o.order_no === updated.order_id);
        if (targetOrd) {
          const updatedOrd: Order = {
            ...targetOrd,
            total_amount: updated.due_amount || targetOrd.total_amount,
            items: editItems.map((it) => ({
              product_name: it.product_name,
              variant_name: it.variant_name,
              quantity: it.quantity,
              dispatched_qty: it.quantity,
              remaining_qty: 0,
              status: "dispatched",
            })),
          };
          await SupabaseService.saveOrder(updatedOrd);
        }
      }
    } catch (err) {
      console.error("Save edit dispatch error:", err);
    } finally {
      setEditRecord(null);
    }
  };

  const handleMarkDelivered = async (d: DispatchRecord) => {
    setActionMenuId(null);
    const updated: DispatchRecord = { ...d, status: "delivered" };
    try {
      await SupabaseService.saveDispatch(updated);
      setDispatchList((prev) => prev.map((x) => (x.id === d.id ? updated : x)));
    } catch (err) {
      console.error("Deliver error:", err);
    }
  };

  const handleRemoveDispatch = async (d: DispatchRecord) => {
    setActionMenuId(null);
    if (window.confirm(`Are you sure you want to remove dispatch "${d.dispatch_no || d.id}"?`)) {
      setDispatchList((prev) => prev.filter((x) => x.id !== d.id));
    }
  };

  const formatDispatchDate = (dateStr?: string) => {
    if (!dateStr) return { month: "AUG", day: "24", weekday: "Monday", year: "2026" };
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { month: "AUG", day: "24", weekday: "Monday", year: "2026" };
    return {
      month: dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      day: dateObj.toLocaleDateString("en-US", { day: "2-digit" }),
      weekday: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
      year: dateObj.toLocaleDateString("en-US", { year: "numeric" }),
    };
  };

  const safeDispatches = dispatchList.length > 0 ? dispatchList : dispatches;

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">RKK Nursery</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Dispatch Schedule, Vehicle Tracking & Bill Syncing
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition text-xs flex items-center gap-2 shadow-sm"
        >
          <Truck className="w-4 h-4" />
          <span>+ Schedule Dispatch</span>
        </button>
      </div>

      {/* Main Expandable Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#f8fafc] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="py-4 px-4 pl-6">DISPATCH DATE</th>
                <th className="py-4 px-4">CUSTOMER</th>
                <th className="py-4 px-4">VILLAGE</th>
                <th className="py-4 px-4">DUE AMOUNT</th>
                <th className="py-4 px-4">ORDER</th>
                <th className="py-4 px-4">DRIVER</th>
                <th className="py-4 px-4">VEHICLE</th>
                <th className="py-4 px-4">STATUS</th>
                <th className="py-4 px-4">CREATED BY</th>
                <th className="py-4 px-4 text-center">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {safeDispatches.map((d, index) => {
                const recId = d.id || `disp-${index}`;
                const isExpanded = !!expandedRows[recId];
                const dateMeta = formatDispatchDate(d.dispatch_date);
                const itemsList =
                  d.items && d.items.length > 0
                    ? d.items
                    : [
                        {
                          product_name: "TOMATO",
                          variant_name: "SAAHO",
                          quantity: 10000,
                          trays: 84,
                          lot_no: "12345",
                          unit: "Unit 1",
                        },
                        {
                          product_name: "CHILLY",
                          variant_name: "TALWAR",
                          quantity: 15000,
                          trays: 125,
                          lot_no: "1234567",
                          unit: "Unit 1",
                        },
                      ];

                const calcTotalPlants = itemsList.reduce((s, i) => s + (i.quantity || 0), 0);
                const calcTotalTrays = itemsList.reduce((s, i) => s + (i.trays || Math.round((i.quantity || 0) / 120)), 0);

                return (
                  <React.Fragment key={recId}>
                    {/* Main Row */}
                    <tr className="hover:bg-slate-50/80 transition group">
                      {/* DISPATCH DATE */}
                      <td className="py-4 px-4 pl-6">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleRow(recId)}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-extrabold flex flex-col items-center justify-center leading-none shadow-xs">
                              <span className="text-[9px] uppercase font-bold text-sky-500">{dateMeta.month}</span>
                              <span className="text-sm font-extrabold text-sky-700 mt-0.5">{dateMeta.day}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-[13px]">{dateMeta.weekday}</span>
                              <span className="text-[11px] font-medium text-slate-400">{dateMeta.year}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="py-4 px-4">
                        {(() => {
                          const matchedCustomer = (customers || []).find(
                            (c) => c.id === d.customer_id || (c.name || "").toLowerCase() === (d.customer_name || "").toLowerCase()
                          );
                          const custName = d.customer_name || matchedCustomer?.name || "Customer";
                          const custPhone = d.customer_phone || matchedCustomer?.phone || "";
                          const custCode = d.customer_code || matchedCustomer?.org_id || "";

                          return (
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 text-[13px]">{custName}</span>
                              {custPhone && (
                                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {custPhone}
                                </span>
                              )}
                              {custCode && (
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{custCode}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* VILLAGE */}
                      <td className="py-4 px-4">
                        {(() => {
                          const matchedCustomer = (customers || []).find(
                            (c) => c.id === d.customer_id || (c.name || "").toLowerCase() === (d.customer_name || "").toLowerCase()
                          );
                          const villageName = d.village || matchedCustomer?.city || matchedCustomer?.address || "N/A";
                          return (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-full font-bold text-[11px] capitalize">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {villageName}
                            </span>
                          );
                        })()}
                      </td>

                      {/* DUE AMOUNT */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-extrabold text-xs font-mono shadow-xs">
                          ₹{(d.due_amount !== undefined ? d.due_amount : 0).toLocaleString()}
                        </span>
                      </td>

                      {/* ORDER */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 text-xs">
                            {d.total_trays || calcTotalTrays} Tray
                          </span>
                          <span className="text-[11px] font-bold text-sky-700 font-mono mt-0.5">
                            🌱 {(d.total_plants || calcTotalPlants).toLocaleString()}
                          </span>
                          {d.order_no && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{d.order_no}</span>
                          )}
                        </div>
                      </td>

                      {/* DRIVER */}
                      <td className="py-4 px-4">
                        {(() => {
                          const matchedDriver = (drivers || []).find(
                            (drv) =>
                              drv.id === d.driver_name ||
                              (drv.name || "").toLowerCase() === (d.driver_name || "").toLowerCase()
                          );
                          const drvName = d.driver_name || matchedDriver?.name || "Unassigned";
                          const drvPhone = d.driver_phone || matchedDriver?.phone || "";

                          return (
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 capitalize text-xs">{drvName}</span>
                              {drvPhone ? (
                                <span className="text-[11px] text-purple-600 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-purple-400" />
                                  {drvPhone}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">N/A</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* VEHICLE */}
                      <td className="py-4 px-4">
                        {(() => {
                          const matchedDriver = (drivers || []).find(
                            (drv) =>
                              drv.id === d.driver_name ||
                              (drv.name || "").toLowerCase() === (d.driver_name || "").toLowerCase()
                          );
                          const vName = d.vehicle_name || matchedDriver?.vehicle_name || "";
                          const vNo = d.vehicle_no || matchedDriver?.vehicle_number || "";

                          return (
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 capitalize text-xs">
                                {vName || "Vehicle"}
                              </span>
                              {vNo && (
                                <span className="text-[11px] text-slate-500 font-mono mt-0.5">#{vNo}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-4">
                        <span className="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs inline-block capitalize">
                          {d.status === "delivered" ? "Delivered" : "Item Dispatched"}
                        </span>
                      </td>

                      {/* CREATED BY */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-800 text-xs">
                          {d.created_by || "System Staff"}
                        </span>
                      </td>

                      {/* ACTION MENU */}
                      <td className="py-4 px-4 text-center relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === recId ? null : recId)}
                          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Floating Popover Dropdown */}
                        {actionMenuId === recId && (
                          <div className="absolute right-4 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                            <button
                              onClick={() => {
                                setActionMenuId(null);
                                setViewBillRecord(d);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>View Bill</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(d)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                            >
                              <Pencil className="w-4 h-4 text-amber-600" />
                              <span>Edit Dispatch</span>
                            </button>

                            <button
                              onClick={() => handleMarkDelivered(d)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 text-emerald-700 rounded-xl transition"
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Mark as Delivered</span>
                            </button>

                            <div className="border-t border-slate-100 my-1"></div>

                            <button
                              onClick={() => handleRemoveDispatch(d)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span>Remove Dispatch</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* EXPANDED CHILD SUB-TABLE ROW */}
                    {isExpanded && (
                      <tr className="bg-emerald-50/30 border-b border-slate-100">
                        <td colSpan={10} className="p-4 pl-12">
                          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                              <CornerDownRight className="w-4 h-4 text-emerald-600" />
                              <span>Dispatch Plant Items ({itemsList.length})</span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                                    <th className="py-2.5 px-3">CROP</th>
                                    <th className="py-2.5 px-3">QUANTITY</th>
                                    <th className="py-2.5 px-3">NUMBER OF TRAYS</th>
                                    <th className="py-2.5 px-3">LOT NOS.</th>
                                    <th className="py-2.5 px-3">UNIT</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {itemsList.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/60">
                                      <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-extrabold text-xs">
                                          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                                          {item.variant_name} - {item.product_name}
                                        </span>
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-bold text-xs font-mono">
                                          🌱 {(item.quantity || 0).toLocaleString()}
                                        </span>
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-bold text-xs font-mono">
                                          <Box className="w-3.5 h-3.5 text-emerald-600" />
                                          {item.trays || Math.round((item.quantity || 0) / 120)}
                                        </span>
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-mono font-bold text-xs">
                                          {item.lot_no || `1234${idx + 5}`}
                                        </span>
                                      </td>

                                      <td className="py-3 px-3">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-bold text-xs">
                                          {item.unit || "Unit 1"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📄 VIEW BILL MODAL (With Download PDF Button) */}
      {viewBillRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Customer Bill / Invoice #{viewBillRecord.order_no || viewBillRecord.dispatch_no}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Official RKK Nursery Dispatch Invoice
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download / Print Bill (PDF)</span>
                </button>
                <button
                  onClick={() => setViewBillRecord(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bill Details Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700" id="printable-bill">
              {/* Header Box */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-emerald-800">RKK NURSERY</h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">High-Tech Plant Saplings & Seedlings</p>
                  <p className="text-[11px] text-slate-400 mt-1">Chhindwara, Madhya Pradesh • Ph: 9109239066</p>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold text-xs uppercase mb-1">
                    TAX INVOICE
                  </div>
                  <p className="font-mono text-slate-600">Bill No: {viewBillRecord.order_no || viewBillRecord.dispatch_no}</p>
                  <p className="text-slate-500">Date: {viewBillRecord.dispatch_date}</p>
                </div>
              </div>

              {/* Customer & Delivery Section */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 uppercase text-[10px] text-slate-400 mb-1">Billed To</h3>
                  <p className="font-extrabold text-slate-800 text-sm">{viewBillRecord.customer_name || "Ayush Choudhary"}</p>
                  <p className="font-mono text-slate-600 mt-0.5">Phone: {viewBillRecord.customer_phone || "9109239066"}</p>
                  <p className="text-slate-600">Village: {viewBillRecord.village || "Chhindwara"}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 uppercase text-[10px] text-slate-400 mb-1">Transport Details</h3>
                  <p className="font-medium text-slate-700">Driver: {viewBillRecord.driver_name || "monu"} ({viewBillRecord.driver_phone || "N/A"})</p>
                  <p className="font-mono text-slate-700 mt-0.5">Vehicle: {viewBillRecord.vehicle_name || "mahendra"} #{viewBillRecord.vehicle_no || "mp28c1234"}</p>
                  <p className="text-slate-500 mt-0.5">Created By: {viewBillRecord.created_by || "Greenza Demo"}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-center">Trays</th>
                      <th className="p-2.5 text-center">Lot No</th>
                      <th className="p-2.5 text-right">Quantity (Plants)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(viewBillRecord.items && viewBillRecord.items.length > 0
                      ? viewBillRecord.items
                      : [
                          { product_name: "TOMATO", variant_name: "SAAHO", quantity: 10000, trays: 84, lot_no: "12345" },
                          { product_name: "CHILLY", variant_name: "TALWAR", quantity: 15000, trays: 125, lot_no: "1234567" },
                        ]
                    ).map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-bold text-slate-800">
                          {it.variant_name} - {it.product_name}
                        </td>
                        <td className="p-2.5 text-center font-mono">{it.trays || Math.round(it.quantity / 120)}</td>
                        <td className="p-2.5 text-center font-mono">{it.lot_no || "12345"}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          {it.quantity.toLocaleString()} plants
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <div className="w-64 bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 space-y-2 text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Due Amount:</span>
                    <span className="font-extrabold text-emerald-800 text-base font-mono">
                      ₹{(viewBillRecord.due_amount !== undefined ? viewBillRecord.due_amount : 20000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 italic">Thank you for ordering with RKK Nursery!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📝 EDIT DISPATCH & ORDER BILL MODAL */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Edit Dispatch & Linked Order Bill
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Update dispatch schedule, vehicle, driver & plant quantities
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Village / Location</label>
                  <input
                    type="text"
                    value={editVillage}
                    onChange={(e) => setEditVillage(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Chhindwara"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Name</label>
                  <input
                    type="text"
                    value={editVehicleName}
                    onChange={(e) => setEditVehicleName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Mahindra"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={editVehicleNo}
                    onChange={(e) => setEditVehicleNo(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono uppercase"
                    placeholder="e.g. MP28C1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={editDriverName}
                    onChange={(e) => setEditDriverName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                    placeholder="e.g. Monu"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={editDriverPhone}
                    onChange={(e) => setEditDriverPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono"
                    placeholder="e.g. 9752348309"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Amount (₹)</label>
                  <input
                    type="number"
                    value={editDueAmount}
                    onChange={(e) => setEditDueAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold font-mono"
                    placeholder="20000"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="dispatched">Item Dispatched</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 uppercase text-[10px]">Dispatch Items & Quantities</h4>
                {editItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">Crop - Variety</label>
                      <input
                        type="text"
                        value={`${item.variant_name} - ${item.product_name}`}
                        onChange={(e) => {
                          const parts = e.target.value.split("-");
                          const updated = [...editItems];
                          updated[idx].variant_name = (parts[0] || "").trim();
                          updated[idx].product_name = (parts[1] || "").trim();
                          setEditItems(updated);
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">Quantity (Plants)</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...editItems];
                          updated[idx].quantity = Number(e.target.value);
                          updated[idx].trays = Math.round(Number(e.target.value) / 120);
                          setEditItems(updated);
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold">Trays</label>
                      <input
                        type="number"
                        value={item.trays || Math.round(item.quantity / 120)}
                        onChange={(e) => {
                          const updated = [...editItems];
                          updated[idx].trays = Number(e.target.value);
                          setEditItems(updated);
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sync Checkbox */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  id="syncBill"
                  checked={syncOrderBill}
                  onChange={(e) => setSyncOrderBill(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="syncBill" className="text-xs font-bold text-emerald-800 cursor-pointer">
                  Sync changes to customer order bill & total amount (₹{editDueAmount || 20000})
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditRecord(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleDispatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customers={customers}
        orders={orders}
        employees={employees}
        onSaveDispatch={(newD) => {
          setDispatchList([newD, ...dispatchList]);
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
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">RKK Nursery</h1>
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
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">RKK Nursery</h1>
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
        <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">RKK Nursery</h1>
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
