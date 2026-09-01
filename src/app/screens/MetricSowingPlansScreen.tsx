import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  MoreHorizontal,
  Sprout,
  Calendar,
  Box,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit,
  Printer,
  Search,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Order, OrderItem, ProductionBatch, Customer } from "../../db/supabaseService";

interface SowingPlansScreenProps {
  orders: Order[];
  batches?: ProductionBatch[];
  customers?: Customer[];
  onOpenCreateBatch?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

interface SowingPlanGroup {
  id: string;
  batchCode: string;
  variantName: string;
  productName: string;
  totalQuantity: number;
  totalTrays: number;
  cropsPerTray: number;
  unitName: string;
  lotNo: string;
  statusOnTime: string;
  statusExpiry: string;
  statusDispatch: string;
  sowingDateStr: string;
  readyDateStr: string;
  createdDate: { month: string; day: string; dayName: string; year: string; dateStr: string };
  completedDate: { month: string; day: string; dayName: string; year: string; dateStr: string };
  orders: { order: Order; item: OrderItem }[];
}

export const MetricSowingPlansScreen: React.FC<SowingPlansScreenProps> = ({
  orders = [],
  batches = [],
  customers = [],
  onOpenCreateBatch,
  onNavigateToTab,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(true);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleExpandAll = () => {
    const nextState = !expandAll;
    setExpandAll(nextState);
    const newExpanded: Record<string, boolean> = {};
    sowingPlans.forEach((p) => {
      newExpanded[p.id] = nextState;
    });
    setExpandedRows(newExpanded);
  };

  const formatBadgeDate = (dateStr?: string) => {
    const defaultDate = new Date();
    try {
      if (!dateStr) {
        return {
          month: defaultDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
          day: String(defaultDate.getDate()),
          dayName: defaultDate.toLocaleDateString("en-US", { weekday: "long" }),
          year: String(defaultDate.getFullYear()),
          dateStr: defaultDate.toISOString().split("T")[0],
        };
      }
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        return {
          month: defaultDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
          day: String(defaultDate.getDate()),
          dayName: defaultDate.toLocaleDateString("en-US", { weekday: "long" }),
          year: String(defaultDate.getFullYear()),
          dateStr,
        };
      }
      return {
        month: dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        day: dateObj.toLocaleDateString("en-US", { day: "numeric" }),
        dayName: dateObj.toLocaleDateString("en-US", { weekday: "long" }),
        year: dateObj.toLocaleDateString("en-US", { year: "numeric" }),
        dateStr,
      };
    } catch {
      return {
        month: "AUG",
        day: "25",
        dayName: "Tuesday",
        year: "2026",
        dateStr: dateStr || "2026-08-25",
      };
    }
  };

  // Group orders & batches into Sowing Plans in real-time
  const sowingPlans = useMemo<SowingPlanGroup[]>(() => {
    const map = new Map<string, SowingPlanGroup>();

    // 1. Process all sales orders line items
    (orders || []).forEach((order) => {
      if (!order.items || order.items.length === 0) return;

      order.items.forEach((item) => {
        const prodName = (item.product_name || "Tomato").trim();
        const varName = (item.variant_name || "Standard Variety").trim();
        const key = `${prodName.toUpperCase()}_${varName.toUpperCase()}`;

        const qty = Number(item.quantity) || 0;
        const trayCap = Number(item.tray_size) || 104;
        const trays = Math.ceil(qty / trayCap);

        if (!map.has(key)) {
          // Look up matching production batch if one exists
          const matchedBatch = batches.find(
            (b) =>
              (b.product_name || "").toUpperCase() === prodName.toUpperCase() &&
              (b.variant_name || "").toUpperCase() === varName.toUpperCase()
          );

          const sowDate = matchedBatch?.sowing_date || item.sowing_date || order.order_date || new Date().toISOString().split("T")[0];
          
          // Calculate expected ready date (default +28 days if not specified)
          let readyDate = matchedBatch?.end_date;
          if (!readyDate) {
            const d = new Date(sowDate);
            d.setDate(d.getDate() + 28);
            readyDate = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : sowDate;
          }

          const createdD = formatBadgeDate(sowDate);
          const endD = formatBadgeDate(readyDate);

          map.set(key, {
            id: `plan-${key.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            batchCode: matchedBatch?.batch_code || matchedBatch?.batch_no || `#RKK_SOW_${String(map.size + 1001)}`,
            variantName: varName.toUpperCase(),
            productName: prodName.toUpperCase(),
            totalQuantity: 0,
            totalTrays: 0,
            cropsPerTray: trayCap,
            unitName: matchedBatch?.polyhouse || matchedBatch?.unit || "Polyhouse 1",
            lotNo: matchedBatch?.lot_no || `LOT-${1000 + map.size * 15}`,
            statusOnTime: "On Time",
            statusExpiry: "Ready in 28 Days",
            statusDispatch: "Sowing Scheduled",
            sowingDateStr: sowDate,
            readyDateStr: readyDate,
            createdDate: createdD,
            completedDate: endD,
            orders: [],
          });
        }

        const plan = map.get(key)!;
        plan.totalQuantity += qty;
        plan.totalTrays += trays;
        plan.orders.push({ order, item });
      });
    });

    // 2. Also process direct batches that might not have orders linked yet
    (batches || []).forEach((b) => {
      const prodName = (b.product_name || "Crop").trim();
      const varName = (b.variant_name || "Variety").trim();
      const key = `${prodName.toUpperCase()}_${varName.toUpperCase()}`;

      if (!map.has(key)) {
        const sowDate = b.sowing_date || new Date().toISOString().split("T")[0];
        const readyDate = b.end_date || sowDate;
        const qty = b.required_quantity || b.total_seeds || 5000;
        const trayCap = Number(b.tray_size) || 104;

        map.set(key, {
          id: `plan-${key.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          batchCode: b.batch_code || b.batch_no || `#RKK_BCH_${b.id?.slice(0, 4)}`,
          variantName: varName.toUpperCase(),
          productName: prodName.toUpperCase(),
          totalQuantity: qty,
          totalTrays: Math.ceil(qty / trayCap),
          cropsPerTray: trayCap,
          unitName: b.polyhouse || b.unit || "Polyhouse 1",
          lotNo: b.lot_no || "LOT-BATCH",
          statusOnTime: "On Time",
          statusExpiry: "In Production",
          statusDispatch: b.status === "ready" ? "Ready To Dispatch" : "Germinating",
          sowingDateStr: sowDate,
          readyDateStr: readyDate,
          createdDate: formatBadgeDate(sowDate),
          completedDate: formatBadgeDate(readyDate),
          orders: [],
        });
      }
    });

    return Array.from(map.values());
  }, [orders, batches]);

  // Filter plans by search term
  const filteredPlans = useMemo(() => {
    if (!searchTerm.trim()) return sowingPlans;
    const q = searchTerm.trim().toLowerCase();
    return sowingPlans.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.variantName.toLowerCase().includes(q) ||
        p.batchCode.toLowerCase().includes(q) ||
        p.orders.some(
          (o) =>
            (o.order.customer_name || "").toLowerCase().includes(q) ||
            (o.order.order_no || "").toLowerCase().includes(q)
        )
    );
  }, [sowingPlans, searchTerm]);

  // Totals
  const totalPlantsSowing = useMemo(
    () => sowingPlans.reduce((sum, p) => sum + p.totalQuantity, 0),
    [sowingPlans]
  );
  const totalTraysSowing = useMemo(
    () => sowingPlans.reduce((sum, p) => sum + p.totalTrays, 0),
    [sowingPlans]
  );
  const totalOrdersInSowing = useMemo(
    () => sowingPlans.reduce((sum, p) => sum + p.orders.length, 0),
    [sowingPlans]
  );

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 bg-[#f4f4f0] min-h-screen font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Sowing Plans &amp; Nursery Production Batches
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 uppercase">
              Live Order Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time seedling tray calculations, sowing schedule dates &amp; linked customer bookings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleExpandAll}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            {expandAll ? "Collapse All" : "Expand All"}
          </button>

          <button
            onClick={handlePrintSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Sowing Sheet</span>
          </button>

          {onOpenCreateBatch && (
            <button
              onClick={onOpenCreateBatch}
              className="flex items-center gap-1.5 bg-[#00a651] text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Sowing Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Total Seedlings To Sow
            </span>
            <div className="text-2xl font-black text-emerald-800 font-mono mt-0.5">
              🌱 {totalPlantsSowing.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across {sowingPlans.length} Crop Varieties
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
            <Sprout className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Pro-Trays Required
            </span>
            <div className="text-2xl font-black text-sky-800 font-mono mt-0.5">
              📦 {totalTraysSowing.toLocaleString("en-IN")} Trays
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Based on standard 104-cavity pro-trays
            </p>
          </div>
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-700">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Booked Customer Orders
            </span>
            <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">
              📑 {totalOrdersInSowing} Orders Linked
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Automatically synchronized from Sales Orders
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search crop, variety, batch #, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 bg-slate-50 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing {filteredPlans.length} Sowing Plan{filteredPlans.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Sowing Plans Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 tracking-wider">
                <th className="py-3 px-3 w-10 text-center"></th>
                <th className="py-3 px-4">BATCH CODE</th>
                <th className="py-3 px-4">CROP &amp; VARIETY</th>
                <th className="py-3 px-4">QUANTITY / TRAYS</th>
                <th className="py-3 px-4">POLYHOUSE / LOT</th>
                <th className="py-3 px-4">SOWING STATUS</th>
                <th className="py-3 px-4">SOWING DATE</th>
                <th className="py-3 px-4">READY DATE</th>
                <th className="py-3 px-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPlans.map((plan) => {
                const isExpanded = expandedRows[plan.id] !== undefined ? expandedRows[plan.id] : expandAll;

                return (
                  <React.Fragment key={plan.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition cursor-pointer ${
                        isExpanded ? "bg-emerald-50/20" : ""
                      }`}
                      onClick={() => toggleRow(plan.id)}
                    >
                      <td className="py-4 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-emerald-900">
                        {plan.batchCode}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {plan.productName}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 mt-0.5">
                            {plan.variantName}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm font-mono">
                            🌱 {plan.totalQuantity.toLocaleString("en-IN")} plants
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                            📦 {plan.totalTrays.toLocaleString("en-IN")} trays ({plan.cropsPerTray}/tray)
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 text-xs">{plan.unitName}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">Lot: {plan.lotNo}</div>
                      </td>

                      <td className="py-4 px-4">
                        {plan.orders.length > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {plan.orders.length} Order{plan.orders.length > 1 ? "s" : ""} Booked
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            🌱 Advance Nursery Stock (Available)
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-extrabold flex flex-col items-center justify-center leading-none">
                            <span className="text-[8px] uppercase font-bold text-slate-400">
                              {plan.createdDate.month}
                            </span>
                            <span className="text-xs font-black text-slate-800 mt-0.5">
                              {plan.createdDate.day}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">
                            <div>{plan.createdDate.dayName}</div>
                            <div className="text-[9px] text-slate-400">{plan.createdDate.year}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 font-extrabold flex flex-col items-center justify-center leading-none">
                            <span className="text-[8px] uppercase font-bold text-sky-500">
                              {plan.completedDate.month}
                            </span>
                            <span className="text-xs font-black text-sky-800 mt-0.5">
                              {plan.completedDate.day}
                            </span>
                          </div>
                          <div className="text-[11px] text-sky-900 font-medium">
                            <div>{plan.completedDate.dayName}</div>
                            <div className="text-[9px] text-slate-400">{plan.completedDate.year}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (onOpenCreateBatch) onOpenCreateBatch();
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 transition cursor-pointer"
                        >
                          + Batch
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED SUB-TABLE (ORDER BREAKDOWN) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200/80">
                        <td colSpan={9} className="p-4 pl-12">
                          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sprout className="w-4 h-4 text-emerald-600" />
                                Customer Orders Demanding {plan.productName} ({plan.variantName})
                              </span>
                              <span className="text-xs font-bold text-emerald-700 font-mono">
                                Total: 🌱 {plan.totalQuantity.toLocaleString("en-IN")} plants
                              </span>
                            </div>

                            {plan.orders.length > 0 ? (
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-2.5 px-3">ORDER ID</th>
                                    <th className="py-2.5 px-3">ORDER DATE</th>
                                    <th className="py-2.5 px-3">CUSTOMER NAME</th>
                                    <th className="py-2.5 px-3 text-right">BOOKED QUANTITY</th>
                                    <th className="py-2.5 px-3 text-right">EST. TRAYS</th>
                                    <th className="py-2.5 px-3 text-center">ORDER STATUS</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {plan.orders.map((o, idx) => {
                                    const qty = Number(o.item.quantity) || 0;
                                    const trays = Math.ceil(qty / (o.item.tray_size ? Number(o.item.tray_size) : 104));

                                    return (
                                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                          #{o.order.order_no || o.order.id}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600">
                                          {o.order.order_date || "2026-08-25"}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-slate-900">
                                          {o.order.customer_name || "Direct Farmer"}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-black text-emerald-800 font-mono">
                                          {qty.toLocaleString("en-IN")} Plants
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-slate-600 font-mono">
                                          {trays} Trays
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                              o.order.is_invoiced
                                                ? "bg-emerald-100 text-emerald-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}
                                          >
                                            {o.order.is_invoiced ? "Invoiced" : "Booked"}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-4 bg-amber-50/60 rounded-lg border border-amber-200/60 text-center text-xs text-amber-900 space-y-1">
                                <p className="font-bold">🌱 Advance Nursery Production Batch (Unallocated Stock)</p>
                                <p className="text-[11px] text-amber-700 font-medium">
                                  This batch of {plan.totalQuantity.toLocaleString("en-IN")} plants was sown directly in {plan.unitName} (Lot: {plan.lotNo}). When a customer places an order for <strong>{plan.productName} ({plan.variantName})</strong>, it will automatically connect here and allocate seedlings.
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    No Sowing Plans found. Create your first Sales Order or Sowing Batch to generate plans.
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
