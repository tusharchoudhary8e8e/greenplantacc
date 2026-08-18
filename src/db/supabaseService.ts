import { supabase } from "../lib/supabase";

export interface Customer {
  id?: string;
  org_id?: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  zone?: string;
  size_category?: "Small" | "Medium" | "Large";
  crop_types?: string[];
  gstin?: string;
  address?: string;
  opening_balance?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface ProductVariant {
  name: string;
  price: number;
  duration?: number;
  description?: string;
}

export interface Product {
  id?: string;
  name: string;
  category?: string;
  unit?: string;
  variants?: ProductVariant[];
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  dispatch_from?: string;
  dispatch_to?: string;
  sowing_date?: string;
  batch_id?: string;
  dispatched_qty?: number;
  remaining_qty?: number;
  status?: "pending" | "sowing_done" | "dispatched";
}

export interface Order {
  id?: string;
  order_no?: string;
  customer_id?: string;
  customer_name?: string;
  order_date: string;
  status?: "pending" | "partially_paid" | "paid" | "sowing_done" | "dispatched" | "cancelled";
  transport_charge?: number;
  advance_payment?: number;
  foc_amount?: number;
  paid_amount?: number;
  items_total?: number;
  total_amount?: number;
  due_amount?: number;
  narration?: string;
  items?: OrderItem[];
  created_at?: string;
}

export interface PaymentReceipt {
  id?: string;
  receipt_no?: string;
  order_id?: string;
  order_no?: string;
  customer_id?: string;
  customer_name?: string;
  receipt_date: string;
  amount: number;
  payment_mode: "Cash" | "UPI" | "Bank Transfer" | "Cheque";
  reference_no?: string;
  notes?: string;
  created_at?: string;
}

export interface PurchaseBillItem {
  id?: string;
  bill_id?: string;
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  line_total?: number;
}

export interface PurchaseBill {
  id?: string;
  bill_no?: string;
  party_id?: string;
  party_name: string;
  bill_date: string;
  gst_type?: "percentage" | "amount" | "none";
  gst_value?: number;
  gst_amount?: number;
  transport_charge?: number;
  paid_amount?: number;
  items_total?: number;
  total_amount?: number;
  due_amount?: number;
  status?: "unpaid" | "partially_paid" | "paid";
  narration?: string;
  items?: PurchaseBillItem[];
  created_at?: string;
}

export interface ProductionBatch {
  id?: string;
  batch_no?: string;
  lot_no?: string;
  unit?: string;
  polyhouse?: string;
  table_no?: string;
  tray_size?: string;
  required_quantity?: number;
  buffer_quantity_pct?: number;
  product_name?: string;
  variant_name?: string;
  sowing_date?: string;
  end_date?: string;
  total_seeds?: number;
  cocopeat_used?: number;
  trays_used?: number;
  seeds_per_tray?: number;
  expected_plants?: number;
  actual_plants?: number;
  germination_pct?: number;
  status?: "sowing" | "germinating" | "ready" | "dispatched";
  notes?: string;
  created_at?: string;
}

export interface DispatchRecord {
  id?: string;
  dispatch_no?: string;
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  dispatch_date?: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_phone?: string;
  status?: "pending" | "in_transit" | "delivered";
  notes?: string;
  items?: { product_name: string; variant_name: string; quantity: number }[];
  created_at?: string;
}

export interface Quote {
  id?: string;
  quote_no?: string;
  customer_id?: string;
  customer_name?: string;
  quote_date?: string;
  valid_until?: string;
  status?: "draft" | "sent" | "accepted" | "rejected" | "expired";
  items?: { product_name: string; variant_name: string; price: number; quantity: number }[];
  total_amount?: number;
  notes?: string;
  created_at?: string;
}

export interface Campaign {
  id?: string;
  name: string;
  type?: string;
  target_zone?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  status?: "planned" | "active" | "completed" | "cancelled";
  notes?: string;
  created_at?: string;
}

export interface Employee {
  id?: string;
  emp_id?: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  department?: string;
  join_date?: string;
  salary?: number;
  status?: "active" | "inactive";
  address?: string;
  created_at?: string;
}

export interface Driver {
  id?: string;
  name: string;
  phone?: string;
  vehicle_name?: string;
  vehicle_number?: string;
  balance?: number;
  status?: "Active" | "Inactive";
  created_at?: string;
}

// ─── LOCAL DEMO SEED DATA (fallback if offline / Supabase setup pending) ──────

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error:", e);
  }
};

const INITIAL_CUSTOMERS: Customer[] = [
  {
    "id": "cust-excel-1",
    "org_id": "#ORG1_CUST_2026_0010",
    "name": "ABHISHEK SAHU AMARWADA",
    "phone": "6264138841",
    "city": "AMARWADA",
    "state": "MADHYA PRADESH",
    "address": "AMARWADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-2",
    "org_id": "#ORG1_CUST_2026_0011",
    "name": "AJJU PAWAR NURSERY",
    "phone": "7566185757",
    "city": "MORAN",
    "state": "MADHYA PRADESH",
    "address": "MORAN",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-3",
    "org_id": "#ORG1_CUST_2026_0012",
    "name": "AKSHAY PAWAR NAGALWADI",
    "phone": "8770497133",
    "city": "NAGALWADI",
    "state": "MADHYA PRADESH",
    "address": "NAGALWADI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-4",
    "org_id": "#ORG1_CUST_2026_0013",
    "name": "ANIL CHANDRAWANSHI MANKADAI",
    "phone": "7722891623",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-5",
    "org_id": "#ORG1_CUST_2026_0014",
    "name": "ANIL KOHALE MANIYA",
    "phone": "9617658058",
    "city": "MANIYA",
    "state": "MADHYA PRADESH",
    "address": "MANIYA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-6",
    "org_id": "#ORG1_CUST_2026_0015",
    "name": "ANIL PAWAR CHABDI",
    "phone": "9770054631",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-7",
    "org_id": "#ORG1_CUST_2026_0016",
    "name": "ANIL SAHU ITAWA",
    "phone": "8269539645",
    "city": "ITAWA",
    "state": "MADHYA PRADESH",
    "address": "ITAWA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-8",
    "org_id": "#ORG1_CUST_2026_0017",
    "name": "ARJUN NURSERY",
    "phone": "9669392558",
    "city": "PATHA",
    "state": "MADHYA PRADESH",
    "address": "PATHA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-9",
    "org_id": "#ORG1_CUST_2026_0018",
    "name": "ARJUN YADUWANSHI KACHRAM",
    "phone": "",
    "city": "KACHRAM",
    "state": "MADHYA PRADESH",
    "address": "KACHRAM",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-10",
    "org_id": "#ORG1_CUST_2026_0019",
    "name": "ARUN PAWAR HARNAKHEDI",
    "phone": "9165637273",
    "city": "HARNAKHEDI",
    "state": "MADHYA PRADESH",
    "address": "HARNAKHEDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-11",
    "org_id": "#ORG1_CUST_2026_0020",
    "name": "ARYAN PAWAR RIDHORA",
    "phone": "8519029252",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-12",
    "org_id": "#ORG1_CUST_2026_0021",
    "name": "ASHUTOSH NASERI BIJORI",
    "phone": "9694976860",
    "city": "BIJORI",
    "state": "MADHYA PRADESH",
    "address": "BIJORI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-13",
    "org_id": "#ORG1_CUST_2026_0022",
    "name": "BABLU MALVI MANKADAI",
    "phone": "9589333119",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-14",
    "org_id": "#ORG1_CUST_2026_0023",
    "name": "BALRAM DRIVER",
    "phone": "7724049785",
    "city": "CHABDI KALA",
    "state": "MADHYA PRADESH",
    "address": "CHABDI KALA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-15",
    "org_id": "#ORG1_CUST_2026_0024",
    "name": "BHAGWANDAS PAWAR CHABDI",
    "phone": "8319279755",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-16",
    "org_id": "#ORG1_CUST_2026_0025",
    "name": "BHAJANLAL MASTER RIDHORA",
    "phone": "",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-17",
    "org_id": "#ORG1_CUST_2026_0026",
    "name": "BHOJELAL CHANDRAWANSHI KHERWADA",
    "phone": "9399511165",
    "city": "KHERWADA",
    "state": "MADHYA PRADESH",
    "address": "KHERWADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-18",
    "org_id": "#ORG1_CUST_2026_0027",
    "name": "BHURA PAWAR RIDHORA (MAMA)",
    "phone": "9893426265",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-19",
    "org_id": "#ORG1_CUST_2026_0028",
    "name": "BHUVAN PATEL TIGAI",
    "phone": "8629995817",
    "city": "TIGAI",
    "state": "MADHYA PRADESH",
    "address": "TIGAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-20",
    "org_id": "#ORG1_CUST_2026_0029",
    "name": "BLOSSOM AGRITECH TIRUNELVELI",
    "phone": "",
    "city": "TIRUNELVELI",
    "state": "MADHYA PRADESH",
    "address": "TIRUNELVELI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-21",
    "org_id": "#ORG1_CUST_2026_0030",
    "name": "BRIJESH BINJHADE SUSRAI",
    "phone": "9399080545",
    "city": "SUSRAI",
    "state": "MADHYA PRADESH",
    "address": "SUSRAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-22",
    "org_id": "#ORG1_CUST_2026_0031",
    "name": "CASH SALE",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-23",
    "org_id": "#ORG1_CUST_2026_0032",
    "name": "CHANCHALESH PAWAR RIDHORA",
    "phone": "",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-24",
    "org_id": "#ORG1_CUST_2026_0033",
    "name": "CHOUDHARY NURSERY FARM SONMAU",
    "phone": "7057813075",
    "city": "SONMAU",
    "state": "MADHYA PRADESH",
    "address": "SONMAU",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-25",
    "org_id": "#ORG1_CUST_2026_0034",
    "name": "DAS NURSERY",
    "phone": "",
    "city": "SONARIMOHAGAO",
    "state": "MADHYA PRADESH",
    "address": "SONARIMOHAGAO",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-26",
    "org_id": "#ORG1_CUST_2026_0035",
    "name": "DASHRATH PAWAR CHABDI KHURD",
    "phone": "+91 6263-094944",
    "city": "CHABDI KALA",
    "state": "MADHYA PRADESH",
    "address": "CHABDI KALA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-27",
    "org_id": "#ORG1_CUST_2026_0036",
    "name": "DEEPAK KUMAR DEVRI",
    "phone": "7000107512",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-28",
    "org_id": "#ORG1_CUST_2026_0037",
    "name": "DEEPAK PAWAR RIDHORA",
    "phone": "8989090923",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-29",
    "org_id": "#ORG1_CUST_2026_0038",
    "name": "DHARMENDRA PAWAR CHABDI",
    "phone": "6266742738",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-30",
    "org_id": "#ORG1_CUST_2026_0039",
    "name": "DIMAK PAWAR RIDHORA",
    "phone": "6268266113",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-31",
    "org_id": "#ORG1_CUST_2026_0040",
    "name": "DURGESH PAWAR CHABDI KALA",
    "phone": "9981517023",
    "city": "CHABDI KALA",
    "state": "MADHYA PRADESH",
    "address": "CHABDI KALA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-32",
    "org_id": "#ORG1_CUST_2026_0041",
    "name": "DURGESH YADUWANSHI GAYGOHAN",
    "phone": "9098934282",
    "city": "GAYGOHAN",
    "state": "MADHYA PRADESH",
    "address": "GAYGOHAN",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-33",
    "org_id": "#ORG1_CUST_2026_0042",
    "name": "GAJJU PAWAR CHABDI",
    "phone": "9399628827",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-34",
    "org_id": "#ORG1_CUST_2026_0043",
    "name": "GOKUL PLASTIC NASIK",
    "phone": "",
    "city": "NASIK",
    "state": "MADHYA PRADESH",
    "address": "NASIK",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-35",
    "org_id": "#ORG1_CUST_2026_0044",
    "name": "GOLU PAWAR CHABDI (BELDER)",
    "phone": "9691532530",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-36",
    "org_id": "#ORG1_CUST_2026_0045",
    "name": "GOLU YADUWANSHI LIKHAWADI",
    "phone": "6264558482",
    "city": "LIKHAWADI",
    "state": "MADHYA PRADESH",
    "address": "LIKHAWADI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-37",
    "org_id": "#ORG1_CUST_2026_0046",
    "name": "GOTAM AUTO DRIVER",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-38",
    "org_id": "#ORG1_CUST_2026_0047",
    "name": "GOVIND CHANDRAWANSHI BONAKHERI",
    "phone": "8602896355",
    "city": "BONAKHERI",
    "state": "MADHYA PRADESH",
    "address": "BONAKHERI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-39",
    "org_id": "#ORG1_CUST_2026_0048",
    "name": "GOVIND CHANDRAWANSHI JI BANDRA",
    "phone": "6264581604",
    "city": "BANDRA",
    "state": "MADHYA PRADESH",
    "address": "BANDRA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-40",
    "org_id": "#ORG1_CUST_2026_0049",
    "name": "GULSHON PAWAR JI KANHARGAO",
    "phone": "",
    "city": "KANHARGAO",
    "state": "MADHYA PRADESH",
    "address": "KANHARGAO",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-41",
    "org_id": "#ORG1_CUST_2026_0050",
    "name": "GULSHON PAWAR RADHIDHANA",
    "phone": "9752336442",
    "city": "RAKHIDHANA",
    "state": "MADHYA PRADESH",
    "address": "RAKHIDHANA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-42",
    "org_id": "#ORG1_CUST_2026_0051",
    "name": "GURENDRA MAHORE JI IMLIKHEDA",
    "phone": "9406576990",
    "city": "IMLIKHEDA",
    "state": "MADHYA PRADESH",
    "address": "IMLIKHEDA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-43",
    "org_id": "#ORG1_CUST_2026_0052",
    "name": "ISHWAR YADUWANSHI JI KACHRAM",
    "phone": "7723913843",
    "city": "KACHRAM",
    "state": "MADHYA PRADESH",
    "address": "KACHRAM",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-44",
    "org_id": "#ORG1_CUST_2026_0053",
    "name": "JAGARNATH CHANDRAWANSHI MANKADAI",
    "phone": "9302037972",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-45",
    "org_id": "#ORG1_CUST_2026_0054",
    "name": "JAGDISH CHACHA RKK",
    "phone": "9424902804",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-46",
    "org_id": "#ORG1_CUST_2026_0055",
    "name": "JAMNAPRASHAD PAWAR RIDHORA",
    "phone": "7566094115",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-47",
    "org_id": "#ORG1_CUST_2026_0056",
    "name": "JITTU PAWAR (PAA)",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-48",
    "org_id": "#ORG1_CUST_2026_0057",
    "name": "JYOTI GONEJAR",
    "phone": "7999972547",
    "city": "MHALPUR",
    "state": "MADHYA PRADESH",
    "address": "MHALPUR",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-49",
    "org_id": "#ORG1_CUST_2026_0058",
    "name": "KAILASH YADUWANSHI LALAMANDI",
    "phone": "9452336442",
    "city": "LALMANDI",
    "state": "MADHYA PRADESH",
    "address": "LALMANDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-50",
    "org_id": "#ORG1_CUST_2026_0059",
    "name": "KAPIL KRISHI KENDRA RIDHORA",
    "phone": "",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-51",
    "org_id": "#ORG1_CUST_2026_0060",
    "name": "KAPIL SAHU MANEGAO",
    "phone": "8269840413",
    "city": "MANEGAO",
    "state": "MADHYA PRADESH",
    "address": "MANEGAO",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-52",
    "org_id": "#ORG1_CUST_2026_0061",
    "name": "KARAN YADUWANSHI JI LALMANDI",
    "phone": "8839451280",
    "city": "LALMANDI",
    "state": "MADHYA PRADESH",
    "address": "LALMANDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-53",
    "org_id": "#ORG1_CUST_2026_0062",
    "name": "KARIYAS NURSERY UMRANALA",
    "phone": "",
    "city": "UMRANALA",
    "state": "MADHYA PRADESH",
    "address": "UMRANALA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-54",
    "org_id": "#ORG1_CUST_2026_0063",
    "name": "KASRE K K UMRETH",
    "phone": "8770296149",
    "city": "UMRETH",
    "state": "MADHYA PRADESH",
    "address": "UMRETH",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-55",
    "org_id": "#ORG1_CUST_2026_0064",
    "name": "KISAN MITRA HYTECH NURSERY DPS",
    "phone": "7224907032",
    "city": "DPS SCHOOL",
    "state": "MADHYA PRADESH",
    "address": "DPS SCHOOL",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-56",
    "org_id": "#ORG1_CUST_2026_0065",
    "name": "KRISHNA NURSERY MORAN",
    "phone": "",
    "city": "MORAN",
    "state": "MADHYA PRADESH",
    "address": "MORAN",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-57",
    "org_id": "#ORG1_CUST_2026_0066",
    "name": "LAXMAN YADUWANSHI ZHAKI",
    "phone": "9752963624",
    "city": "ZHAKI",
    "state": "MADHYA PRADESH",
    "address": "ZHAKI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-58",
    "org_id": "#ORG1_CUST_2026_0067",
    "name": "MADAN RASELA JI RIDHORA",
    "phone": "",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-59",
    "org_id": "#ORG1_CUST_2026_0068",
    "name": "MADHU PAWAR KACHRAM",
    "phone": "",
    "city": "KACHRAM",
    "state": "MADHYA PRADESH",
    "address": "KACHRAM",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-60",
    "org_id": "#ORG1_CUST_2026_0069",
    "name": "MALSING YADUWANSHI BHESADAND",
    "phone": "9691219184",
    "city": "BHESADAND",
    "state": "MADHYA PRADESH",
    "address": "BHESADAND",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-61",
    "org_id": "#ORG1_CUST_2026_0070",
    "name": "MANESH MALVI JI MANKADAI",
    "phone": "8085176464",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-62",
    "org_id": "#ORG1_CUST_2026_0071",
    "name": "MANOHAR YADUWANSHI ZHAKI",
    "phone": "9131069997",
    "city": "ZHAKI",
    "state": "MADHYA PRADESH",
    "address": "ZHAKI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-63",
    "org_id": "#ORG1_CUST_2026_0072",
    "name": "MANOJ KADVE JI CHABDI",
    "phone": "9584007345",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-64",
    "org_id": "#ORG1_CUST_2026_0073",
    "name": "MANOJ PAWAR DOBRI",
    "phone": "9713772418",
    "city": "DOBRI",
    "state": "MADHYA PRADESH",
    "address": "DOBRI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-65",
    "org_id": "#ORG1_CUST_2026_0074",
    "name": "MANOJ SURWANSHI PATPADA",
    "phone": "8103190886",
    "city": "PATPADA",
    "state": "MADHYA PRADESH",
    "address": "PATPADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-66",
    "org_id": "#ORG1_CUST_2026_0075",
    "name": "MAYUR SURWANSHI JI BALKAJHAR",
    "phone": "8770465971",
    "city": "BALKAJHAR",
    "state": "MADHYA PRADESH",
    "address": "BALKAJHAR",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-67",
    "org_id": "#ORG1_CUST_2026_0076",
    "name": "MITHILESH SURWANSHI MANKADAI",
    "phone": "8827569625",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-68",
    "org_id": "#ORG1_CUST_2026_0077",
    "name": "MONU DRIVER BIJORI",
    "phone": "7909564653",
    "city": "BIJORI",
    "state": "MADHYA PRADESH",
    "address": "BIJORI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-69",
    "org_id": "#ORG1_CUST_2026_0078",
    "name": "MONU PAWAR MUARI",
    "phone": "7000819310",
    "city": "MUARI",
    "state": "MADHYA PRADESH",
    "address": "MUARI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-70",
    "org_id": "#ORG1_CUST_2026_0079",
    "name": "MUKESH CHADRAPURI KEVLARI",
    "phone": "8085293219",
    "city": "KEVLARI",
    "state": "MADHYA PRADESH",
    "address": "KEVLARI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-71",
    "org_id": "#ORG1_CUST_2026_0080",
    "name": "NANDKISHORE CHANDRAWANSHI JI MANKADAI",
    "phone": "7389021255",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-72",
    "org_id": "#ORG1_CUST_2026_0081",
    "name": "NARESH PAWAR JI BICHAKWADA",
    "phone": "",
    "city": "BICHAKWADA",
    "state": "MADHYA PRADESH",
    "address": "BICHAKWADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-73",
    "org_id": "#ORG1_CUST_2026_0082",
    "name": "NARESH PAWAR JI CHABDI",
    "phone": "9685573822",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-74",
    "org_id": "#ORG1_CUST_2026_0083",
    "name": "NIKKY SURWANSHI JI BHATODIYA",
    "phone": "7247059960",
    "city": "BHATODIYA",
    "state": "MADHYA PRADESH",
    "address": "BHATODIYA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-75",
    "org_id": "#ORG1_CUST_2026_0084",
    "name": "NILESH RAJPUT JI CHABDI",
    "phone": "8827107888",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-76",
    "org_id": "#ORG1_CUST_2026_0085",
    "name": "OM SAI KRISHI KENDRA UMRETH",
    "phone": "",
    "city": "UMRETH",
    "state": "MADHYA PRADESH",
    "address": "UMRETH",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-77",
    "org_id": "#ORG1_CUST_2026_0086",
    "name": "OMJI YADUWANSHI KACHRAM",
    "phone": "",
    "city": "KACHRAM",
    "state": "MADHYA PRADESH",
    "address": "KACHRAM",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-78",
    "org_id": "#ORG1_CUST_2026_0087",
    "name": "OMKAR YADUWANSHI",
    "phone": "9753228429",
    "city": "GAYGOHAN",
    "state": "MADHYA PRADESH",
    "address": "GAYGOHAN",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-79",
    "org_id": "#ORG1_CUST_2026_0088",
    "name": "PAHALAD CHACHA RAJADA",
    "phone": "",
    "city": "RAJADA",
    "state": "MADHYA PRADESH",
    "address": "RAJADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-80",
    "org_id": "#ORG1_CUST_2026_0089",
    "name": "PANKAJ PAWAR JI CHABDI",
    "phone": "6263406493",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-81",
    "org_id": "#ORG1_CUST_2026_0090",
    "name": "PANKAJ THEKRE",
    "phone": "7869277387",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-82",
    "org_id": "#ORG1_CUST_2026_0091",
    "name": "PAPPU SURWANSHI MUADAI",
    "phone": "",
    "city": "MUADAI",
    "state": "MADHYA PRADESH",
    "address": "MUADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-83",
    "org_id": "#ORG1_CUST_2026_0092",
    "name": "PAWAN MAHORE JI ROHANA",
    "phone": "7067469993",
    "city": "ROHANA",
    "state": "MADHYA PRADESH",
    "address": "ROHANA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-84",
    "org_id": "#ORG1_CUST_2026_0093",
    "name": "PAWAN SURWANSHI ROHANA",
    "phone": "7999146402",
    "city": "ROHANA",
    "state": "MADHYA PRADESH",
    "address": "ROHANA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-85",
    "org_id": "#ORG1_CUST_2026_0094",
    "name": "PAWAR AGRO AGENCY UMRETH",
    "phone": "9752336442",
    "city": "UMRETH",
    "state": "MADHYA PRADESH",
    "address": "UMRETH",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-86",
    "org_id": "#ORG1_CUST_2026_0095",
    "name": "PRADEEP PAWAR JI KACHRAM",
    "phone": "7987916607",
    "city": "KACHRAM",
    "state": "MADHYA PRADESH",
    "address": "KACHRAM",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-87",
    "org_id": "#ORG1_CUST_2026_0096",
    "name": "PRADEEP SAHU RIDHORA",
    "phone": "",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-88",
    "org_id": "#ORG1_CUST_2026_0097",
    "name": "PRADUM CHANDRAWANSHI KHANSWADA",
    "phone": "8827700861",
    "city": "KHANSWADA",
    "state": "MADHYA PRADESH",
    "address": "KHANSWADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-89",
    "org_id": "#ORG1_CUST_2026_0098",
    "name": "PRAVEEN NURSERY",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-90",
    "org_id": "#ORG1_CUST_2026_0099",
    "name": "RADHESHYAN BHAJIYA",
    "phone": "8817549665",
    "city": "8817549665",
    "state": "MADHYA PRADESH",
    "address": "8817549665",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-91",
    "org_id": "#ORG1_CUST_2026_0100",
    "name": "RAGHUNATH PAWAR JI GAJANDOW HETI",
    "phone": "",
    "city": "GAJANDHOW HETI",
    "state": "MADHYA PRADESH",
    "address": "GAJANDHOW HETI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-92",
    "org_id": "#ORG1_CUST_2026_0101",
    "name": "RAJA GAJANDOW GADIWALA",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-93",
    "org_id": "#ORG1_CUST_2026_0102",
    "name": "RAJESH BAGHEL JI SILADAI",
    "phone": "8720051876",
    "city": "SILADAI",
    "state": "MADHYA PRADESH",
    "address": "SILADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-94",
    "org_id": "#ORG1_CUST_2026_0103",
    "name": "RAJESH PAWAR CHABDI",
    "phone": "9584007401",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-95",
    "org_id": "#ORG1_CUST_2026_0104",
    "name": "RAJU MAHORE ROHANA",
    "phone": "7999231239",
    "city": "ROHANA",
    "state": "MADHYA PRADESH",
    "address": "ROHANA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-96",
    "org_id": "#ORG1_CUST_2026_0105",
    "name": "RAKESH YADUWANSHI LALMANDI",
    "phone": "",
    "city": "LALMANDI",
    "state": "MADHYA PRADESH",
    "address": "LALMANDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-97",
    "org_id": "#ORG1_CUST_2026_0106",
    "name": "RAMBHAROSH PAWAR JI CHABDI",
    "phone": "",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-98",
    "org_id": "#ORG1_CUST_2026_0107",
    "name": "RAMESH PAWAR AMANALA",
    "phone": "9879554335",
    "city": "AMANALA",
    "state": "MADHYA PRADESH",
    "address": "AMANALA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-99",
    "org_id": "#ORG1_CUST_2026_0108",
    "name": "RAMESH PAWAR CHABDI",
    "phone": "9713123370",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-100",
    "org_id": "#ORG1_CUST_2026_0109",
    "name": "RAMESH YADUWANSHI ZHAKI",
    "phone": "9589251345",
    "city": "ZHAKI",
    "state": "MADHYA PRADESH",
    "address": "ZHAKI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-101",
    "org_id": "#ORG1_CUST_2026_0110",
    "name": "RAMKRISHNA PAWAR CHABDI KHURD",
    "phone": "9713970852",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-102",
    "org_id": "#ORG1_CUST_2026_0111",
    "name": "RANJEET CHANDRAVANSHI JI  BAYER",
    "phone": "9165393917",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-103",
    "org_id": "#ORG1_CUST_2026_0112",
    "name": "RAVI HYTECH NURSERY JUNAPANI",
    "phone": "7470476177",
    "city": "JUNAPANI",
    "state": "MADHYA PRADESH",
    "address": "JUNAPANI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-104",
    "org_id": "#ORG1_CUST_2026_0113",
    "name": "RAVI SANKER KALBHUT",
    "phone": "7509534451",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-105",
    "org_id": "#ORG1_CUST_2026_0114",
    "name": "RESAM YADAV SETPARAS",
    "phone": "8120206701",
    "city": "SETPARAS",
    "state": "MADHYA PRADESH",
    "address": "SETPARAS",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-106",
    "org_id": "#ORG1_CUST_2026_0115",
    "name": "RKK",
    "phone": "9993916272",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-107",
    "org_id": "#ORG1_CUST_2026_0116",
    "name": "RUPESH PAWAR JI RIDHORA",
    "phone": "9993432731",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-108",
    "org_id": "#ORG1_CUST_2026_0117",
    "name": "SACHIN PAWAR JI KANHARGAO",
    "phone": "9685971075",
    "city": "PATPADA",
    "state": "MADHYA PRADESH",
    "address": "PATPADA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-109",
    "org_id": "#ORG1_CUST_2026_0118",
    "name": "SACHIN PAWAR SONAPIPARI",
    "phone": "9584637593",
    "city": "SONAPIPARI",
    "state": "MADHYA PRADESH",
    "address": "SONAPIPARI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-110",
    "org_id": "#ORG1_CUST_2026_0119",
    "name": "SAGAN KUMRE MANKADAI",
    "phone": "8889736982",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-111",
    "org_id": "#ORG1_CUST_2026_0120",
    "name": "SAKIL KHAN UMRETH",
    "phone": "9752336442",
    "city": "UMRETH",
    "state": "MADHYA PRADESH",
    "address": "UMRETH",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-112",
    "org_id": "#ORG1_CUST_2026_0121",
    "name": "SAMIR ANSARI UMRETH",
    "phone": "",
    "city": "UMRETH",
    "state": "MADHYA PRADESH",
    "address": "UMRETH",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-113",
    "org_id": "#ORG1_CUST_2026_0122",
    "name": "SANDEEP DEHARIYA JI NEWTON",
    "phone": "9111985068",
    "city": "NEWTON",
    "state": "MADHYA PRADESH",
    "address": "NEWTON",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-114",
    "org_id": "#ORG1_CUST_2026_0123",
    "name": "SANDEEP KANOJIYA JABALPUR",
    "phone": "7049630031",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-115",
    "org_id": "#ORG1_CUST_2026_0124",
    "name": "SANDEEP PAWAR JI CHABDI",
    "phone": "7509203451",
    "city": "CHABDI KALA",
    "state": "MADHYA PRADESH",
    "address": "CHABDI KALA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-116",
    "org_id": "#ORG1_CUST_2026_0125",
    "name": "SANDEEP SAHU PIPARIYA GUMANI",
    "phone": "7000368004",
    "city": "PIPARIYA GUMANI",
    "state": "MADHYA PRADESH",
    "address": "PIPARIYA GUMANI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-117",
    "org_id": "#ORG1_CUST_2026_0126",
    "name": "SANJU PAWAR JI CHABDI",
    "phone": "8517844202",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-118",
    "org_id": "#ORG1_CUST_2026_0127",
    "name": "SANOJ YADUWANSHI SATNUR",
    "phone": "9109495619",
    "city": "SATNUR",
    "state": "MADHYA PRADESH",
    "address": "SATNUR",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-119",
    "org_id": "#ORG1_CUST_2026_0128",
    "name": "SANTKUMAR YADUWANSHI GAYGOHAN",
    "phone": "9131969605",
    "city": "GAYGOHAN",
    "state": "MADHYA PRADESH",
    "address": "GAYGOHAN",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-120",
    "org_id": "#ORG1_CUST_2026_0129",
    "name": "SANTRAM CHANDRAWANSHI JI MANKADAI",
    "phone": "9755323819",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-121",
    "org_id": "#ORG1_CUST_2026_0130",
    "name": "SARWAN SAHU JI CHABDI",
    "phone": "7828628262",
    "city": "CHABDI",
    "state": "MADHYA PRADESH",
    "address": "CHABDI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-122",
    "org_id": "#ORG1_CUST_2026_0131",
    "name": "SATISH PATEL TILHERI JABALPUR",
    "phone": "6260-753813",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-123",
    "org_id": "#ORG1_CUST_2026_0132",
    "name": "SATISH PAWAR JI RIDHORA",
    "phone": "9893400951",
    "city": "RIDHORA",
    "state": "MADHYA PRADESH",
    "address": "RIDHORA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-124",
    "org_id": "#ORG1_CUST_2026_0133",
    "name": "SHIVAM SURYAWANSHI BALKAZHAR",
    "phone": "",
    "city": "BALKACHAR",
    "state": "MADHYA PRADESH",
    "address": "BALKACHAR",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-125",
    "org_id": "#ORG1_CUST_2026_0134",
    "name": "SHIVRAM CHANDRAWANSHI PINDRAI",
    "phone": "9926163957",
    "city": "PINDRAI",
    "state": "MADHYA PRADESH",
    "address": "PINDRAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-126",
    "org_id": "#ORG1_CUST_2026_0135",
    "name": "SHREEDHAR GUPTA NURSINGPUR",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-127",
    "org_id": "#ORG1_CUST_2026_0136",
    "name": "SHUBHAM DOIFODE IMLIKHEDA",
    "phone": "9630736879",
    "city": "IMLIKHEDA",
    "state": "MADHYA PRADESH",
    "address": "IMLIKHEDA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-128",
    "org_id": "#ORG1_CUST_2026_0137",
    "name": "SHUBHAM PAWAR JI RAKHIDHANA",
    "phone": "9584547502",
    "city": "RAKHIDHANA",
    "state": "MADHYA PRADESH",
    "address": "RAKHIDHANA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-129",
    "org_id": "#ORG1_CUST_2026_0138",
    "name": "SIJJU JI UMRETH",
    "phone": "9754531588",
    "city": "UMRETH",
    "state": "MADHYA PRADESH",
    "address": "UMRETH",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-130",
    "org_id": "#ORG1_CUST_2026_0139",
    "name": "SITARAM JI GOTEGAO",
    "phone": "9617976689",
    "city": "GOTEGAO",
    "state": "MADHYA PRADESH",
    "address": "GOTEGAO",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-131",
    "org_id": "#ORG1_CUST_2026_0140",
    "name": "SOHAN DOMRI",
    "phone": "8827336301",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-132",
    "org_id": "#ORG1_CUST_2026_0141",
    "name": "SONU NANA",
    "phone": "9981330430",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-133",
    "org_id": "#ORG1_CUST_2026_0142",
    "name": "SUBHAS BAGHEL SONAKHAR",
    "phone": "8435447278",
    "city": "SONAKHAR",
    "state": "MADHYA PRADESH",
    "address": "SONAKHAR",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-134",
    "org_id": "#ORG1_CUST_2026_0143",
    "name": "SUBHOD THAKRE JI CHOURAI NURSERY",
    "phone": "",
    "city": "CHOURAI",
    "state": "MADHYA PRADESH",
    "address": "CHOURAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-135",
    "org_id": "#ORG1_CUST_2026_0144",
    "name": "SUNIL SURWANSHI ROHANA",
    "phone": "",
    "city": "ROHANA",
    "state": "MADHYA PRADESH",
    "address": "ROHANA",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-136",
    "org_id": "#ORG1_CUST_2026_0145",
    "name": "SURENDRA CHOURE JI SONAKHAR",
    "phone": "9575281703",
    "city": "SONAKHAR",
    "state": "MADHYA PRADESH",
    "address": "SONAKHAR",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-137",
    "org_id": "#ORG1_CUST_2026_0146",
    "name": "VAMANRAO SAVLE SAVLEWADI",
    "phone": "7049989888",
    "city": "SAVLEWADI",
    "state": "MADHYA PRADESH",
    "address": "SAVLEWADI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-138",
    "org_id": "#ORG1_CUST_2026_0147",
    "name": "VINOD PAWAR HETI",
    "phone": "7509205107",
    "city": "HETI",
    "state": "MADHYA PRADESH",
    "address": "HETI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-139",
    "org_id": "#ORG1_CUST_2026_0148",
    "name": "VISHAL PAWAR JI SONAPIPRI",
    "phone": "7000623350",
    "city": "SONAPIPRI",
    "state": "MADHYA PRADESH",
    "address": "SONAPIPRI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-140",
    "org_id": "#ORG1_CUST_2026_0149",
    "name": "VISHNU PAWAR JI KACHRAM",
    "phone": "6267252040",
    "city": "KACHRAM",
    "state": "MADHYA PRADESH",
    "address": "KACHRAM",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-141",
    "org_id": "#ORG1_CUST_2026_0150",
    "name": "VIVEK KRISHI KENDRA GAGIWADA",
    "phone": "",
    "city": "",
    "state": "MADHYA PRADESH",
    "address": "",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-142",
    "org_id": "#ORG1_CUST_2026_0151",
    "name": "YASHWANT PAWAR SILADAI",
    "phone": "9399946726",
    "city": "SILADAI",
    "state": "MADHYA PRADESH",
    "address": "SILADAI",
    "opening_balance": 0,
    "is_active": true
  },
  {
    "id": "cust-excel-143",
    "org_id": "#ORG1_CUST_2026_0152",
    "name": "YOGESH SURWANSHI JI MANKADAI",
    "phone": "88394845173",
    "city": "MANKADAI",
    "state": "MADHYA PRADESH",
    "address": "MANKADAI",
    "opening_balance": 0,
    "is_active": true
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "CHILLY",
    category: "Vegetables",
    unit: "plants",
    variants: [
      { name: "TALWAR", price: 1.6, duration: 40 },
      { name: "VNR 212", price: 1.8, duration: 45 },
      { name: "FIRE", price: 1.5, duration: 35 },
    ],
    is_active: true,
  },
  {
    id: "prod-2",
    name: "TOMATO",
    category: "Vegetables",
    unit: "plants",
    variants: [
      { name: "ABHILASH", price: 2.0, duration: 40 },
      { name: "HEM SONA", price: 2.2, duration: 42 },
      { name: "SAHOO", price: 1.9, duration: 38 },
    ],
    is_active: true,
  },
  {
    id: "prod-3",
    name: "BRINJAL",
    category: "Vegetables",
    unit: "plants",
    variants: [
      { name: "MOHINI", price: 1.4, duration: 45 },
      { name: "KALPATARU", price: 1.5, duration: 50 },
    ],
    is_active: true,
  },
  {
    id: "prod-4",
    name: "MARIGOLD",
    category: "Flowers",
    unit: "plants",
    variants: [
      { name: "ORANGE", price: 1.2, duration: 30 },
      { name: "YELLOW", price: 1.2, duration: 30 },
    ],
    is_active: true,
  },
];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_BATCHES: ProductionBatch[] = [
  {
    id: "batch-1",
    batch_no: "BATCH-2026-001",
    product_name: "CHILLY",
    variant_name: "TALWAR",
    sowing_date: "2026-06-18",
    total_seeds: 6000,
    cocopeat_used: 12.0,
    trays_used: 48,
    seeds_per_tray: 126,
    expected_plants: 5800,
    actual_plants: 5650,
    germination_pct: 94.17,
    status: "ready",
    notes: "Healthy growth observed",
  },
];

const INITIAL_DISPATCH: DispatchRecord[] = [];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    emp_id: "EMP-001",
    name: "Suresh Sharma",
    role: "Nursery Manager",
    phone: "9812345678",
    email: "suresh@metricaccounting.com",
    department: "Operations",
    join_date: "2024-01-15",
    salary: 35000,
    status: "active",
  },
  {
    id: "emp-2",
    emp_id: "EMP-002",
    name: "Vikas Verma",
    role: "Sowing Specialist",
    phone: "9823456789",
    email: "vikas@metricaccounting.com",
    department: "Production",
    join_date: "2024-03-01",
    salary: 22000,
    status: "active",
  },
];

const INITIAL_QUOTES: Quote[] = [
  {
    id: "qt-1",
    quote_no: "QT-2026-001",
    customer_id: "cust-2",
    customer_name: "RAJESH PATEL",
    quote_date: "2026-07-28",
    valid_until: "2026-08-10",
    status: "sent",
    items: [
      { product_name: "TOMATO", variant_name: "ABHILASH", price: 2.0, quantity: 5000 },
    ],
    total_amount: 10000,
    notes: "Quotation for August tomato saplings",
  },
];

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp-1",
    name: "Kharif Sowing Monsoon Campaign",
    type: "field_visit",
    target_zone: "ZONE1 ZONE",
    start_date: "2026-07-01",
    end_date: "2026-08-15",
    budget: 15000,
    status: "active",
    notes: "Farmer outreach for high-yield chilly saplings",
  },
];

const INITIAL_DRIVERS: Driver[] = [
  {
    id: "drv-1",
    name: "Monu Kumar",
    phone: "9752348309",
    vehicle_name: "Mahindra Bolero",
    vehicle_number: "MP28C1234",
    balance: 0,
    status: "Active",
  },
];

const loadCustomersFromStorage = (): Customer[] => {
  try {
    const data = localStorage.getItem("demo_customers_v3");
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length >= 100) {
        return parsed;
      }
    }

    // Merge INITIAL_CUSTOMERS with any user-created local storage customers
    const oldData = localStorage.getItem("demo_customers");
    let mergedList = [...INITIAL_CUSTOMERS];

    if (oldData) {
      try {
        const parsedOld = JSON.parse(oldData);
        if (Array.isArray(parsedOld)) {
          const existingNames = new Set(INITIAL_CUSTOMERS.map((c) => (c.name || "").trim().toUpperCase()));
          parsedOld.forEach((cust: any) => {
            if (cust && cust.name && !existingNames.has(cust.name.trim().toUpperCase())) {
              mergedList.push(cust);
            }
          });
        }
      } catch {}
    }

    saveToStorage("demo_customers_v3", mergedList);
    saveToStorage("demo_customers", mergedList);
    return mergedList;
  } catch {
    return INITIAL_CUSTOMERS;
  }
};

let DEMO_CUSTOMERS: Customer[] = loadCustomersFromStorage();
let DEMO_PRODUCTS: Product[] = loadFromStorage("demo_products", INITIAL_PRODUCTS);
let DEMO_ORDERS: Order[] = loadFromStorage("demo_orders", INITIAL_ORDERS);
let DEMO_BATCHES: ProductionBatch[] = loadFromStorage("demo_batches", INITIAL_BATCHES);
let DEMO_DISPATCH: DispatchRecord[] = loadFromStorage("demo_dispatch", INITIAL_DISPATCH);
let DEMO_EMPLOYEES: Employee[] = loadFromStorage("demo_employees", INITIAL_EMPLOYEES);
let DEMO_QUOTES: Quote[] = loadFromStorage("demo_quotes", INITIAL_QUOTES);
let DEMO_CAMPAIGNS: Campaign[] = loadFromStorage("demo_campaigns", INITIAL_CAMPAIGNS);
let DEMO_RECEIPTS: PaymentReceipt[] = loadFromStorage("demo_receipts", []);
let DEMO_DRIVERS: Driver[] = loadFromStorage("demo_drivers", INITIAL_DRIVERS);

// ─── SERVICE IMPLEMENTATION ──────────────────────────────────────────
export class SupabaseService {
  static async getUserId(): Promise<string | undefined> {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id;
    } catch {
      return undefined;
    }
  }

  // Customers
  static async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from("ma_customers")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data as Customer[];
    } catch {
      // Fallback
    }
    return DEMO_CUSTOMERS;
  }

  static async saveCustomer(cust: Customer): Promise<Customer> {
    try {
      const userId = cust.user_id || (await SupabaseService.getUserId());
      const payload = {
        ...cust,
        ...(userId ? { user_id: userId } : {}),
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("ma_customers")
        .upsert(payload)
        .select()
        .single();
      if (!error && data) return data as Customer;
    } catch {
      // Fallback
    }
    const newCust = {
      ...cust,
      id: cust.id || `cust-${Date.now()}`,
      org_id: cust.org_id || `#ORG1_CUST_2026_${Math.floor(1000 + Math.random() * 9000)}`,
    };
    DEMO_CUSTOMERS.unshift(newCust);
    saveToStorage("demo_customers", DEMO_CUSTOMERS);
    return newCust;
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from("ma_products")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data) return data as Product[];
    } catch {
      // Fallback
    }
    return DEMO_PRODUCTS;
  }

  static async saveProduct(prod: Product): Promise<Product> {
    try {
      const userId = prod.user_id || (await SupabaseService.getUserId());
      const payload = {
        ...prod,
        ...(userId ? { user_id: userId } : {}),
      };
      const { data, error } = await supabase
        .from("ma_products")
        .upsert(payload)
        .select()
        .single();
      if (!error && data) return data as Product;
    } catch {
      // Fallback
    }
    const newProd = { ...prod, id: prod.id || `prod-${Date.now()}` };
    const idx = DEMO_PRODUCTS.findIndex((p) => p.id === newProd.id);
    if (idx !== -1) {
      DEMO_PRODUCTS[idx] = newProd;
    } else {
      DEMO_PRODUCTS.push(newProd);
    }
    saveToStorage("demo_products", DEMO_PRODUCTS);
    return newProd;
  }

  static async bulkImportProducts(products: Product[]): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("ma_products")
        .upsert(products)
        .select();
      if (!error && data) return data.length;
    } catch {
      // Fallback
    }
    products.forEach(p => {
      const idx = DEMO_PRODUCTS.findIndex(dp => dp.id === p.id);
      if (idx !== -1) {
        DEMO_PRODUCTS[idx] = p;
      } else {
        DEMO_PRODUCTS.push(p);
      }
    });
    saveToStorage("demo_products", DEMO_PRODUCTS);
    return products.length;
  }

  // Orders
  static async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from("ma_orders")
        .select("*, items:ma_order_items(*)")
        .order("order_date", { ascending: false });
      if (!error && data) return data as Order[];
    } catch {
      // Fallback
    }
    return DEMO_ORDERS;
  }

  static async createOrder(order: Order): Promise<Order> {
    const orderNo = order.order_no || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsTotal = (order.items || []).reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );
    const transport = order.transport_charge || 0;
    const advance = order.advance_payment || 0;
    const foc = order.foc_amount || 0;
    const totalAmount = Math.max(0, itemsTotal + transport - foc);
    const dueAmount = Math.max(0, totalAmount - advance);

    const fullOrder: Order = {
      ...order,
      order_no: orderNo,
      items_total: itemsTotal,
      total_amount: totalAmount,
      due_amount: dueAmount,
      status: "pending",
    };

    try {
      const userId = order.user_id || (await SupabaseService.getUserId());
      const { data: ordData, error: ordErr } = await supabase
        .from("ma_orders")
        .insert({
          ...(userId ? { user_id: userId } : {}),
          order_no: fullOrder.order_no,
          customer_id: fullOrder.customer_id,
          customer_name: fullOrder.customer_name,
          order_date: fullOrder.order_date,
          status: fullOrder.status,
          transport_charge: fullOrder.transport_charge,
          advance_payment: fullOrder.advance_payment,
          foc_amount: fullOrder.foc_amount,
          items_total: fullOrder.items_total,
          total_amount: fullOrder.total_amount,
          narration: fullOrder.narration,
        })
        .select()
        .single();

      if (!ordErr && ordData) {
        if (order.items && order.items.length > 0) {
          const itemPayloads = order.items.map((it) => ({
            order_id: ordData.id,
            product_name: it.product_name,
            variant_name: it.variant_name,
            price: it.price,
            quantity: it.quantity,
            dispatch_from: it.dispatch_from,
            dispatch_to: it.dispatch_to,
            sowing_date: it.sowing_date,
            dispatched_qty: 0,
            status: "pending",
          }));
          await supabase.from("ma_order_items").insert(itemPayloads);
        }
        return { ...ordData, items: order.items } as Order;
      }
    } catch {
      // Fallback
    }

    const localOrd = { ...fullOrder, id: `ord-${Date.now()}` };
    DEMO_ORDERS.unshift(localOrd);
    saveToStorage("demo_orders", DEMO_ORDERS);
    return localOrd;
  }

  static async updateOrder(order: Order): Promise<Order> {
    if (!order.id) return this.createOrder(order);

    const itemsTotal = (order.items || []).reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );
    const transport = order.transport_charge || 0;
    const advance = order.advance_payment || 0;
    const foc = order.foc_amount || 0;
    const totalAmount = Math.max(0, itemsTotal + transport - foc);
    const dueAmount = Math.max(0, totalAmount - advance);

    const updatedOrder: Order = {
      ...order,
      items_total: itemsTotal,
      total_amount: totalAmount,
      due_amount: dueAmount,
    };

    try {
      const { error: ordErr } = await supabase
        .from("ma_orders")
        .update({
          customer_id: updatedOrder.customer_id,
          customer_name: updatedOrder.customer_name,
          order_date: updatedOrder.order_date,
          status: updatedOrder.status,
          transport_charge: updatedOrder.transport_charge,
          advance_payment: updatedOrder.advance_payment,
          foc_amount: updatedOrder.foc_amount,
          items_total: updatedOrder.items_total,
          total_amount: updatedOrder.total_amount,
          narration: updatedOrder.narration,
        })
        .eq("id", order.id);

      if (!ordErr) {
        if (order.items) {
          await supabase.from("ma_order_items").delete().eq("order_id", order.id);
          if (order.items.length > 0) {
            const itemPayloads = order.items.map((it) => ({
              order_id: order.id,
              product_name: it.product_name,
              variant_name: it.variant_name,
              price: it.price,
              quantity: it.quantity,
              dispatch_from: it.dispatch_from,
              dispatch_to: it.dispatch_to,
              sowing_date: it.sowing_date,
              dispatched_qty: it.dispatched_qty || 0,
              status: it.status || "pending",
            }));
            await supabase.from("ma_order_items").insert(itemPayloads);
          }
        }
      }
    } catch (e) {
      console.error("Supabase order update error:", e);
    }

    const idx = DEMO_ORDERS.findIndex((o) => o.id === order.id || o.order_no === order.order_no);
    if (idx !== -1) {
      DEMO_ORDERS[idx] = updatedOrder;
    } else {
      DEMO_ORDERS.unshift(updatedOrder);
    }
    saveToStorage("demo_orders", DEMO_ORDERS);
    return updatedOrder;
  }

  static async deleteOrder(orderId: string): Promise<boolean> {
    try {
      await supabase.from("ma_order_items").delete().eq("order_id", orderId);
      await supabase.from("ma_orders").delete().eq("id", orderId);
    } catch (e) {
      console.error("Supabase delete order error:", e);
    }

    DEMO_ORDERS = DEMO_ORDERS.filter((o) => o.id !== orderId && o.order_no !== orderId);
    saveToStorage("demo_orders", DEMO_ORDERS);
    return true;
  }

  // Production Batches
  static async getBatches(): Promise<ProductionBatch[]> {
    try {
      const { data, error } = await supabase
        .from("ma_batches")
        .select("*")
        .order("sowing_date", { ascending: false });
      if (!error && data) return data as ProductionBatch[];
    } catch {
      // Fallback
    }
    return DEMO_BATCHES;
  }

  static async saveBatch(b: ProductionBatch): Promise<ProductionBatch> {
    try {
      const userId = b.user_id || (await SupabaseService.getUserId());
      const payload = {
        ...b,
        ...(userId ? { user_id: userId } : {}),
      };
      const { data, error } = await supabase
        .from("ma_batches")
        .upsert(payload)
        .select()
        .single();
      if (!error && data) return data as ProductionBatch;
    } catch {
      // Fallback
    }
    const newB = { ...b, id: b.id || `batch-${Date.now()}` };
    const idx = DEMO_BATCHES.findIndex(x => x.id === newB.id);
    if (idx !== -1) {
      DEMO_BATCHES[idx] = newB;
    } else {
      DEMO_BATCHES.unshift(newB);
    }
    saveToStorage("demo_batches", DEMO_BATCHES);
    return newB;
  }

  // Dispatches
  static async getDispatches(): Promise<DispatchRecord[]> {
    try {
      const { data, error } = await supabase
        .from("ma_dispatch")
        .select("*, items:ma_dispatch_items(*)")
        .order("dispatch_date", { ascending: false });
      if (!error && data) return data as DispatchRecord[];
    } catch {
      // Fallback
    }
    return DEMO_DISPATCH;
  }

  static async saveDispatch(disp: Partial<DispatchRecord>): Promise<DispatchRecord> {
    try {
      const userId = (disp as any).user_id || (await SupabaseService.getUserId());
      const payload = {
        ...disp,
        ...(userId ? { user_id: userId } : {}),
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("ma_dispatch")
        .upsert(payload)
        .select()
        .single();
      if (!error && data) return data as DispatchRecord;
    } catch {
      // Fallback
    }
    const newD: DispatchRecord = {
      ...disp,
      id: disp.id || `disp-${Date.now()}`,
      dispatch_no: disp.dispatch_no || `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const idx = DEMO_DISPATCH.findIndex(x => x.id === newD.id);
    if (idx !== -1) {
      DEMO_DISPATCH[idx] = newD;
    } else {
      DEMO_DISPATCH.unshift(newD);
    }
    saveToStorage("demo_dispatch", DEMO_DISPATCH);
    return newD;
  }

  // Employees
  static async getEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from("ma_employees")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data) return data as Employee[];
    } catch {
      // Fallback
    }
    return DEMO_EMPLOYEES;
  }

  // Quotes
  static async getQuotes(): Promise<Quote[]> {
    try {
      const { data, error } = await supabase
        .from("ma_quotes")
        .select("*")
        .order("quote_date", { ascending: false });
      if (!error && data) return data as Quote[];
    } catch {
      // Fallback
    }
    return DEMO_QUOTES;
  }

  // Campaigns
  static async getCampaigns(): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from("ma_campaigns")
        .select("*")
        .order("start_date", { ascending: false });
      if (!error && data) return data as Campaign[];
    } catch {
      // Fallback
    }
    return DEMO_CAMPAIGNS;
  }

  // Payment Receipts
  static async getPaymentReceipts(): Promise<PaymentReceipt[]> {
    try {
      const { data, error } = await supabase
        .from("ma_receipts")
        .select("*")
        .order("receipt_date", { ascending: false });
      if (!error && data) return data as PaymentReceipt[];
    } catch {
      // Fallback
    }
    return DEMO_RECEIPTS;
  }

  static async savePaymentReceipt(rec: Partial<PaymentReceipt>): Promise<PaymentReceipt> {
    const receiptNo = rec.receipt_no || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRec: PaymentReceipt = {
      ...rec,
      id: rec.id || `rec-${Date.now()}`,
      receipt_no: receiptNo,
      receipt_date: rec.receipt_date || new Date().toISOString().split("T")[0],
      amount: Number(rec.amount) || 0,
      payment_mode: rec.payment_mode || "UPI",
    };

    try {
      const userId = (rec as any).user_id || (await SupabaseService.getUserId());
      const payload = {
        ...newRec,
        ...(userId ? { user_id: userId } : {}),
      };
      await supabase.from("ma_receipts").upsert(payload);
    } catch (e) {
      console.error("Supabase save receipt error:", e);
    }

    // Save to local storage
    const idx = DEMO_RECEIPTS.findIndex((r) => r.id === newRec.id);
    if (idx !== -1) {
      DEMO_RECEIPTS[idx] = newRec;
    } else {
      DEMO_RECEIPTS.unshift(newRec);
    }
    saveToStorage("demo_receipts", DEMO_RECEIPTS);

    // If receipt is linked to a specific Order, update the Order's paid amount & status!
    if (newRec.order_id || newRec.order_no) {
      const targetOrd = DEMO_ORDERS.find(
        (o) => o.id === newRec.order_id || o.order_no === newRec.order_id || o.order_no === newRec.order_no
      );

      if (targetOrd) {
        const currentPaid = (targetOrd.paid_amount || 0) + newRec.amount;
        const totalAmt = targetOrd.total_amount || 0;
        const advAmt = targetOrd.advance_payment || 0;
        const netDue = Math.max(0, totalAmt - advAmt - currentPaid);

        let newStatus = targetOrd.status;
        if (netDue === 0) {
          newStatus = "paid";
        } else if (currentPaid > 0) {
          newStatus = "partially_paid";
        }

        const updatedOrd: Order = {
          ...targetOrd,
          paid_amount: currentPaid,
          due_amount: netDue,
          status: newStatus,
        };

        await SupabaseService.updateOrder(updatedOrd);
      }
    }

    return newRec;
  }

  // Purchase Bills
  static async getPurchaseBills(): Promise<PurchaseBill[]> {
    try {
      const { data, error } = await supabase
        .from("ma_purchase_bills")
        .select("*")
        .order("bill_date", { ascending: false });
      if (!error && data && Array.isArray(data)) return data as PurchaseBill[];
    } catch {
      // Fallback
    }
    return DEMO_PURCHASE_BILLS;
  }

  static async savePurchaseBill(bill: PurchaseBill): Promise<PurchaseBill> {
    const billNo = bill.bill_no || `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsTotal = (bill.items || []).reduce(
      (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
      0
    );

    // Calculate Custom GST
    let gstAmount = 0;
    if (bill.gst_type === "percentage") {
      gstAmount = (itemsTotal * (bill.gst_value || 0)) / 100;
    } else if (bill.gst_type === "amount") {
      gstAmount = bill.gst_value || 0;
    }

    const transport = bill.transport_charge || 0;
    const paid = bill.paid_amount || 0;
    const totalAmount = itemsTotal + gstAmount + transport;
    const dueAmount = Math.max(0, totalAmount - paid);

    let status: "unpaid" | "partially_paid" | "paid" = "unpaid";
    if (dueAmount === 0) {
      status = "paid";
    } else if (paid > 0) {
      status = "partially_paid";
    }

    const fullBill: PurchaseBill = {
      ...bill,
      bill_no: billNo,
      items_total: itemsTotal,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      due_amount: dueAmount,
      status: status,
    };

    try {
      const userId = bill.user_id || (await SupabaseService.getUserId());
      const { data: billData, error: billErr } = await supabase
        .from("ma_purchase_bills")
        .upsert({
          ...(userId ? { user_id: userId } : {}),
          ...(fullBill.id ? { id: fullBill.id } : {}),
          bill_no: fullBill.bill_no,
          party_id: fullBill.party_id,
          party_name: fullBill.party_name,
          bill_date: fullBill.bill_date,
          gst_type: fullBill.gst_type,
          gst_value: fullBill.gst_value,
          gst_amount: fullBill.gst_amount,
          transport_charge: fullBill.transport_charge,
          paid_amount: fullBill.paid_amount,
          items_total: fullBill.items_total,
          total_amount: fullBill.total_amount,
          due_amount: fullBill.due_amount,
          status: fullBill.status,
          narration: fullBill.narration,
        })
        .select()
        .single();

      if (!billErr && billData) {
        if (bill.items) {
          await supabase.from("ma_purchase_bill_items").delete().eq("bill_id", billData.id);
          if (bill.items.length > 0) {
            const itemPayloads = bill.items.map((it) => ({
              bill_id: billData.id,
              product_name: it.product_name,
              variant_name: it.variant_name,
              price: it.price,
              quantity: it.quantity,
              line_total: (it.price || 0) * (it.quantity || 0),
            }));
            await supabase.from("ma_purchase_bill_items").insert(itemPayloads);
          }
        }
        return { ...billData, items: bill.items } as PurchaseBill;
      }
    } catch {
      // Fallback
    }

    const localBill = { ...fullBill, id: fullBill.id || `pur-${Date.now()}` };
    const idx = DEMO_PURCHASE_BILLS.findIndex((b) => b.id === localBill.id || b.bill_no === localBill.bill_no);
    if (idx !== -1) {
      DEMO_PURCHASE_BILLS[idx] = localBill;
    } else {
      DEMO_PURCHASE_BILLS.unshift(localBill);
    }
    saveToStorage("demo_purchase_bills", DEMO_PURCHASE_BILLS);
    return localBill;
  }

  static async deletePurchaseBill(billId: string): Promise<boolean> {
    try {
      await supabase.from("ma_purchase_bill_items").delete().eq("bill_id", billId);
      await supabase.from("ma_purchase_bills").delete().eq("id", billId);
    } catch (e) {
      console.error("Supabase delete purchase bill error:", e);
    }

    DEMO_PURCHASE_BILLS = DEMO_PURCHASE_BILLS.filter((b) => b.id !== billId && b.bill_no !== billId);
    saveToStorage("demo_purchase_bills", DEMO_PURCHASE_BILLS);
    return true;
  }

  // Drivers
  static async getDrivers(): Promise<Driver[]> {
    try {
      const { data, error } = await supabase
        .from("ma_drivers")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data && Array.isArray(data)) return data as Driver[];
    } catch {
      // Fallback
    }
    return DEMO_DRIVERS;
  }

  static async saveDriver(drv: Partial<Driver>): Promise<Driver> {
    const newD: Driver = {
      ...drv,
      id: drv.id || `drv-${Date.now()}`,
      name: drv.name || "Driver",
      phone: drv.phone || "",
      vehicle_name: drv.vehicle_name || "",
      vehicle_number: drv.vehicle_number || "",
      balance: drv.balance !== undefined ? Number(drv.balance) : 0,
      status: drv.status || "Active",
    };

    try {
      await supabase.from("ma_drivers").upsert(newD);
    } catch {
      // Fallback
    }

    const idx = DEMO_DRIVERS.findIndex((d) => d.id === newD.id);
    if (idx !== -1) {
      DEMO_DRIVERS[idx] = newD;
    } else {
      DEMO_DRIVERS.unshift(newD);
    }
    saveToStorage("demo_drivers", DEMO_DRIVERS);
    return newD;
  }

  static async deleteDriver(driverId: string): Promise<boolean> {
    try {
      await supabase.from("ma_drivers").delete().eq("id", driverId);
    } catch {
      // Fallback
    }
    DEMO_DRIVERS = DEMO_DRIVERS.filter((d) => d.id !== driverId);
    saveToStorage("demo_drivers", DEMO_DRIVERS);
    return true;
  }
}
