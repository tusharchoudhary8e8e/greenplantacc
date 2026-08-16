import React, { useState } from "react";
import { Plus, Search, Filter, Phone, Mail, MapPin, Building, User, BookOpen } from "lucide-react";
import { Customer, SupabaseService } from "../../db/supabaseService";

interface CustomersProps {
  customers: Customer[];
  onCustomerAdded: (cust: Customer) => void;
  onViewLedger?: (customerId: string) => void;
}

export const MetricCustomersScreen: React.FC<CustomersProps> = ({
  customers = [],
  onCustomerAdded,
  onViewLedger,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedZone, setSelectedZone] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const safeCustomers = Array.isArray(customers) ? customers : [];

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [zone, setZone] = useState("ZONE1 ZONE");
  const [size, setSize] = useState<"Small" | "Medium" | "Large">("Small");
  const [cropsStr, setCropsStr] = useState("Tomato, Chilly");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setPhone(editingCustomer.phone || "");
      setEmail(editingCustomer.email || "");
      setCity(editingCustomer.city || "");
      setStateName(editingCustomer.state || "");
      setPincode(editingCustomer.pincode || "");
      setZone(editingCustomer.zone || "ZONE1 ZONE");
      setSize(editingCustomer.size_category || "Small");
      setCropsStr(editingCustomer.crop_types?.join(", ") || "");
      setAddress(editingCustomer.address || "");
      setErrorMsg("");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setCity("");
      setStateName("");
      setPincode("");
      setZone("ZONE1 ZONE");
      setSize("Small");
      setCropsStr("");
      setAddress("");
      setErrorMsg("");
    }
  }, [editingCustomer, showAddModal]);

  const filteredCustomers = safeCustomers.filter((c) => {
    const matchesSearch =
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesZone = selectedZone === "all" || c.zone === selectedZone;
    return matchesSearch && matchesZone;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || submitting) return;
    setErrorMsg("");

    const normalizedName = name.trim().toLowerCase();
    const duplicate = customers.find(
      (c) => c.name.trim().toLowerCase() === normalizedName && (!editingCustomer || c.id !== editingCustomer.id)
    );

    const currentAddress = address || `${city}, ${stateName}, ${pincode}`;

    if (duplicate) {
      if ((duplicate.address || "").trim().toLowerCase() === currentAddress.trim().toLowerCase()) {
        setErrorMsg("A customer with this exact name and address already exists.");
        return;
      }
    }

    setSubmitting(true);

    const newCust: Customer = {
      ...(editingCustomer ? { id: editingCustomer.id, org_id: editingCustomer.org_id } : {}),
      name,
      phone,
      email,
      city,
      state: stateName,
      pincode,
      zone,
      size_category: size,
      crop_types: cropsStr.split(",").map((s) => s.trim()).filter(Boolean),
      address: currentAddress,
      is_active: editingCustomer ? editingCustomer.is_active : true,
    };

    try {
      const saved = await SupabaseService.saveCustomer(newCust);
      onCustomerAdded(saved);
      setShowAddModal(false);
      setEditingCustomer(null);
      // Reset
      setName("");
      setPhone("");
      setEmail("");
      setCity("");
      setStateName("");
      setPincode("");
      setAddress("");
      setCropsStr("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-emerald-700 tracking-tight">
            RKK Nursery
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Customers Management</p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#00a651] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search customer name, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Zones</option>
            <option value="ZONE1 ZONE">ZONE1 ZONE</option>
            <option value="ZONE2 ZONE">ZONE2 ZONE</option>
          </select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm">
                  {cust.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{cust.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {cust.org_id || "#ORG1_CUST_2026_0002"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onViewLedger && (
                  <button
                    onClick={() => onViewLedger(cust.id || "")}
                    className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition shadow-sm flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3 text-emerald-600" />
                    <span>Ledger</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingCustomer(cust);
                    setShowAddModal(true);
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#00a651] rounded-md hover:bg-emerald-600 transition shadow-sm"
                >
                  Edit
                </button>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                  {cust.zone || "ZONE1 ZONE"}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{cust.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>{cust.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{cust.address || `${cust.city}, ${cust.state}`}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {(cust.size_category || "Small").toUpperCase()}
              </span>
              {(cust.crop_types || ["Tomato"]).map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden space-y-6 p-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingCustomer ? "Edit Customer Detail" : "Add New Customer"}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer Name*
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. Ayush Choudhary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. 9109239066"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. customer@farm.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Zone
                  </label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  >
                    <option value="ZONE1 ZONE">ZONE1 ZONE</option>
                    <option value="ZONE2 ZONE">ZONE2 ZONE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. Chhindwara"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. Madhya Pradesh"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Crops (comma separated)
                </label>
                <input
                  type="text"
                  value={cropsStr}
                  onChange={(e) => setCropsStr(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                  placeholder="Tomato, Chilly, Brinjal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#00a651] text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-55"
                >
                  {submitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
