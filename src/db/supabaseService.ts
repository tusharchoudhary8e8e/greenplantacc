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
    id: "cust-1",
    org_id: "#ORG1_CUST_2026_0002",
    name: "AYUSH CHOUDHARY",
    phone: "9109239066",
    email: "N/A",
    city: "CHHINDWARA",
    state: "MADHYA PRADESH",
    pincode: "480001",
    zone: "ZONE1 ZONE",
    size_category: "Small",
    crop_types: ["Tomato", "Chilly"],
    address: "CHHINDWARA, CHHINDWARA, MADHYA PRADESH, 480001",
    opening_balance: 0,
    is_active: true,
  },
  {
    id: "cust-2",
    org_id: "#ORG1_CUST_2026_0003",
    name: "RAJESH PATEL",
    phone: "9826199881",
    email: "rajesh@farm.com",
    city: "INDORE",
    state: "MADHYA PRADESH",
    pincode: "452001",
    zone: "ZONE2 ZONE",
    size_category: "Medium",
    crop_types: ["Brinjal", "Marigold"],
    address: "FARM ROAD, INDORE, MP",
    opening_balance: 5000,
    is_active: true,
  },
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

let DEMO_CUSTOMERS: Customer[] = loadFromStorage("demo_customers", INITIAL_CUSTOMERS);
let DEMO_PRODUCTS: Product[] = loadFromStorage("demo_products", INITIAL_PRODUCTS);
let DEMO_ORDERS: Order[] = loadFromStorage("demo_orders", INITIAL_ORDERS);
let DEMO_BATCHES: ProductionBatch[] = loadFromStorage("demo_batches", INITIAL_BATCHES);
let DEMO_DISPATCH: DispatchRecord[] = loadFromStorage("demo_dispatch", INITIAL_DISPATCH);
let DEMO_EMPLOYEES: Employee[] = loadFromStorage("demo_employees", INITIAL_EMPLOYEES);
let DEMO_QUOTES: Quote[] = loadFromStorage("demo_quotes", INITIAL_QUOTES);
let DEMO_CAMPAIGNS: Campaign[] = loadFromStorage("demo_campaigns", INITIAL_CAMPAIGNS);
let DEMO_RECEIPTS: PaymentReceipt[] = loadFromStorage("demo_receipts", []);

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
}
