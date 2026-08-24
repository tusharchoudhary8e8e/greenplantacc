import React, { useState } from "react";
import { X, Truck, Calendar, User, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { Customer, Order, Employee, DispatchRecord, SupabaseService } from "../../db/supabaseService";
import { SearchableSelect, SearchableOption } from "./SearchableSelect";

interface ScheduleDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: Order[];
  employees: Employee[];
  drivers?: Driver[];
  onSaveDispatch: (dispatch: DispatchRecord) => void;
}

export const ScheduleDispatchModal: React.FC<ScheduleDispatchModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  orders = [],
  employees = [],
  drivers = [],
  onSaveDispatch,
}) => {
  const [selectedCustId, setSelectedCustId] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [dispatchDate, setDispatchDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [variantName, setVariantName] = useState<string>("");
  const [dispatchQty, setDispatchQty] = useState<number | "">("");
  const [status, setStatus] = useState<"pending" | "in_transit" | "delivered">("pending");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeDrivers = Array.isArray(drivers) && drivers.length > 0 ? drivers : [];

  // Searchable Customer Options
  const customerOptions: SearchableOption[] = safeCustomers.map((c) => ({
    value: c.id || "",
    label: c.name || "Customer",
    subLabel: c.address || `${c.city || ""}, ${c.state || ""}`.trim(),
  }));

  const selectedCustomer = safeCustomers.find((c) => c.id === selectedCustId);
  const selectedDriver = safeDrivers.find((d) => d.id === selectedDriverId || d.name === selectedDriverId);

  // Orders belonging to selected customer
  const customerOrders = safeOrders.filter(
    (o) =>
      o.customer_id === selectedCustId ||
      (selectedCustomer && o.customer_name && o.customer_name.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
  );

  const orderOptions: SearchableOption[] = customerOrders.map((o) => ({
    value: o.id || o.order_no || "",
    label: `Bill / Order #${o.order_no || o.id}`,
    subLabel: `Date: ${o.order_date} • Total: ₹${o.total_amount || 0}`,
    badge: o.status || "pending",
  }));

  // Driver Options from Drivers Directory
  const driverOptions: SearchableOption[] = safeDrivers.map((drv) => ({
    value: drv.id || drv.name,
    label: `${drv.name} ${drv.vehicle_name ? `(${drv.vehicle_name})` : ""}`,
    subLabel: `Phone: ${drv.phone || "N/A"} • Vehicle No: ${drv.vehicle_number || "N/A"}`,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!selectedCustId || !selectedCustomer) {
      setErrorMsg("Please search and select a customer for the dispatch.");
      return;
    }

    setSubmitting(true);

    const dispatchNo = `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const finalVehicleNo = vehicleNo.trim() || selectedDriver?.vehicle_number || "";

    const newDispatch: DispatchRecord = {
      dispatch_no: dispatchNo,
      order_id: selectedOrderId,
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      customer_phone: selectedCustomer.phone || "",
      customer_code: selectedCustomer.org_id || "",
      village: selectedCustomer.city || selectedCustomer.address || "",
      dispatch_date: dispatchDate,
      vehicle_name: selectedDriver?.vehicle_name || "",
      vehicle_no: finalVehicleNo.toUpperCase(),
      driver_name: selectedDriver?.name || "",
      driver_phone: selectedDriver?.phone || "",
      status: status,
      notes: notes,
      items: [
        {
          product_name: productName || "Vegetables",
          variant_name: variantName || "Standard",
          quantity: Number(dispatchQty) || 0,
        },
      ],
    };

    try {
      const saved = await SupabaseService.saveDispatch(newDispatch);
      onSaveDispatch(saved);
      onClose();
    } catch (err: any) {
      console.error("Save dispatch error:", err);
      setErrorMsg("Failed to save dispatch schedule. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00a651] flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Schedule Dispatch</h2>
              <p className="text-xs text-slate-500 font-medium">
                Assign vehicle, driver, and quantities for plant delivery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Customer* (Search & Select)
            </label>
            <SearchableSelect
              options={customerOptions}
              value={selectedCustId}
              onChange={(val) => {
                setSelectedCustId(val);
                setErrorMsg("");
              }}
              placeholder="Search customer by name, address or zone..."
            />
          </div>

          {selectedCustomer && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">
                  Address: {selectedCustomer.address || `${selectedCustomer.city}, ${selectedCustomer.state}`}
                </span>
              </div>

              {/* Order Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Link to Customer Purchase Order (Bill)
                </label>
                <SearchableSelect
                  options={orderOptions}
                  value={selectedOrderId}
                  onChange={(val) => {
                    setSelectedOrderId(val);
                    const chosenOrd = customerOrders.find((o) => o.id === val || o.order_no === val);
                    if (chosenOrd && chosenOrd.items && chosenOrd.items.length > 0) {
                      const firstItem = chosenOrd.items[0];
                      setProductName(firstItem.product_name || "");
                      setVariantName(firstItem.variant_name || "");
                      setDispatchQty(firstItem.remaining_qty || firstItem.quantity || 1000);
                    }
                  }}
                  placeholder="Select order bill to dispatch from..."
                />
              </div>
            </div>
          )}

          {/* Section 2: Dispatch Date & Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dispatch Date*
              </label>
              <input
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Vehicle Number*
              </label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g. MP-28-GB-1024"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Section 3: Driver Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assigned Driver
            </label>
            <SearchableSelect
              options={driverOptions}
              value={selectedDriverId}
              onChange={(val) => setSelectedDriverId(val)}
              placeholder="Select Driver (optional)..."
            />
          </div>

          {/* Section 4: Item & Quantity Details */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Item & Quantity Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Crop Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Variety
                </label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Dispatch Qty (Plants)
                </label>
                <input
                  type="number"
                  value={dispatchQty}
                  onChange={(e) => setDispatchQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 5: Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Dispatch Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="pending">Pending (Scheduled)</option>
                <option value="in_transit">In Transit (Out for Delivery)</option>
                <option value="delivered">Delivered (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notes / Delivery Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Handle with care, morning delivery"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 transition text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm text-xs disabled:opacity-55 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Save Schedule"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
