import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, X, CheckCircle2, User, Phone, Truck } from "lucide-react";
import { Driver, SupabaseService } from "../../db/supabaseService";

interface MetricDriversScreenProps {
  drivers?: Driver[];
  onDriversUpdated?: () => void;
}

export const MetricDriversScreen: React.FC<MetricDriversScreenProps> = ({
  drivers: initialDrivers,
  onDriversUpdated,
}) => {
  const [driverList, setDriverList] = useState<Driver[]>(initialDrivers || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [balance, setBalance] = useState<number | "">("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.getDrivers();
      setDriverList(data);
    } catch (e) {
      console.error("Error loading drivers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDrivers && initialDrivers.length > 0) {
      setDriverList(initialDrivers);
    } else {
      loadDrivers();
    }
  }, [initialDrivers]);

  const handleOpenCreateModal = () => {
    setEditingDriver(null);
    setName("");
    setPhone("");
    setVehicleName("");
    setVehicleNumber("");
    setBalance("");
    setStatus("Active");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (drv: Driver) => {
    setEditingDriver(drv);
    setName(drv.name || "");
    setPhone(drv.phone || "");
    setVehicleName(drv.vehicle_name || "");
    setVehicleNumber(drv.vehicle_number || "");
    setBalance(drv.balance !== undefined ? drv.balance : "");
    setStatus(drv.status || "Active");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Driver name is required.");
      return;
    }

    setSubmitting(true);

    const payload: Partial<Driver> = {
      ...(editingDriver ? { id: editingDriver.id } : {}),
      name: name.trim(),
      phone: phone.trim(),
      vehicle_name: vehicleName.trim(),
      vehicle_number: vehicleNumber.trim(),
      balance: balance === "" ? 0 : Number(balance),
      status: status,
    };

    try {
      const saved = await SupabaseService.saveDriver(payload);
      setIsModalOpen(false);
      await loadDrivers();
      if (onDriversUpdated) onDriversUpdated();
    } catch (err) {
      console.error("Save driver error:", err);
      setErrorMsg("Failed to save driver details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (drv: Driver) => {
    if (!drv.id) return;
    if (window.confirm(`Are you sure you want to delete driver "${drv.name}"?`)) {
      await SupabaseService.deleteDriver(drv.id);
      await loadDrivers();
      if (onDriversUpdated) onDriversUpdated();
    }
  };

  const filteredDrivers = driverList.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.vehicle_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.vehicle_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-emerald-800 tracking-tight">Driver Directory</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage delivery drivers, vehicle numbers & transport ledger accounts
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Driver</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Driver Name, Phone or Vehicle No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Total Drivers: <span className="text-emerald-700 font-mono font-bold">{filteredDrivers.length}</span>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <th className="py-3.5 px-4">DRIVER NAME</th>
                <th className="py-3.5 px-4">PHONE NUMBER</th>
                <th className="py-3.5 px-4">VEHICLE NAME</th>
                <th className="py-3.5 px-4">VEHICLE NUMBER</th>
                <th className="py-3.5 px-4 text-right">BALANCE (₹)</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDrivers.map((drv) => (
                <tr key={drv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{drv.name}</td>
                  <td className="py-3.5 px-4 font-mono">{drv.phone || "N/A"}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{drv.vehicle_name || "N/A"}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{drv.vehicle_number || "N/A"}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono">
                    ₹{(drv.balance || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border capitalize ${
                        drv.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {drv.status || "Active"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(drv)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Driver"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(drv)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Delete Driver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No drivers found. Click "+ Add Driver" to create a new delivery driver.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {editingDriver ? "Edit Driver" : "Add New Driver"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingDriver ? "Update driver & vehicle details" : "Register a new driver for dispatches"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Driver Name*
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9826198261"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahindra Bolero / Tractor"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MP28-C-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 bg-white font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00a651] text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-sm disabled:opacity-55 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : editingDriver ? "Update Driver" : "Save Driver"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
