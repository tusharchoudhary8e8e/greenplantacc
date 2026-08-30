/**
 * Mutation Sanitization & Validation Engine
 * Protects database against malicious inputs, XSS, negative values, NaN, and corrupt data structures.
 */

import { roundCurrency } from "./financialMath";
import {
  Customer,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  ProductionBatch,
  PurchaseBill,
  PurchaseBillItem,
  PaymentReceipt,
  DispatchRecord,
  ExpenseRecord,
  BankAccount,
  Driver,
} from "../../db/supabaseService";

/**
 * Strips HTML tags, script injection patterns, control characters, and trims whitespace
 */
export function sanitizeString(val: any, maxLength = 255, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  let str = String(val).trim();
  // Strip null bytes and control chars
  str = str.replace(/\0/g, "");
  // Strip HTML / script tags
  str = str.replace(/<[^>]*>?/gm, "");
  // Strip common XSS injection protocols
  str = str.replace(/javascript:/gi, "").replace(/data:/gi, "");
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  return str;
}

/**
 * Validates and clamps financial numbers to valid ranges and 2-decimal rounded precision
 */
export function sanitizeNumber(
  val: any,
  min: number = 0,
  max: number = 100_000_000,
  fallback: number = 0
): number {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  if (isNaN(num) || !isFinite(num)) return fallback;
  const clamped = Math.max(min, Math.min(max, num));
  return roundCurrency(clamped);
}

/**
 * Validates and clamps integer quantities
 */
export function sanitizeInteger(
  val: any,
  min: number = 0,
  max: number = 50_000_000,
  fallback: number = 0
): number {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseInt(String(val).replace(/,/g, ""), 10);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
}

/**
 * Validates YYYY-MM-DD date string format
 */
export function sanitizeDate(val: any, fallbackToToday = true): string {
  const today = new Date().toISOString().split("T")[0];
  if (!val || typeof val !== "string") return fallbackToToday ? today : "";
  const trimmed = val.trim();
  const dateObj = new Date(trimmed);
  if (isNaN(dateObj.getTime())) {
    return fallbackToToday ? today : "";
  }
  // Standardize YYYY-MM-DD
  const yyyy = dateObj.getFullYear();
  if (yyyy < 2000 || yyyy > 2100) return fallbackToToday ? today : "";
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Phone number sanitization
 */
export function sanitizePhone(val: any): string {
  if (!val) return "";
  const str = String(val).trim();
  // Allow only digits, +, -, space, brackets
  return str.replace(/[^\d+\- ()]/g, "").substring(0, 20);
}

/**
 * Email sanitization
 */
export function sanitizeEmail(val: any): string {
  if (!val) return "";
  const str = String(val).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(str)) return "";
  return str.substring(0, 100);
}

/**
 * Customer Sanitizer
 */
export function sanitizeCustomer(cust: Customer): Customer {
  return {
    ...(cust.id ? { id: sanitizeString(cust.id, 64) } : {}),
    ...(cust.org_id ? { org_id: sanitizeString(cust.org_id, 64) } : {}),
    name: sanitizeString(cust.name, 120, "Unnamed Customer"),
    phone: sanitizePhone(cust.phone),
    email: sanitizeEmail(cust.email),
    city: sanitizeString(cust.city, 80),
    state: sanitizeString(cust.state, 80),
    pincode: sanitizeString(cust.pincode, 10),
    zone: sanitizeString(cust.zone, 40, "ZONE1"),
    size_category: cust.size_category === "Large" || cust.size_category === "Medium" ? cust.size_category : "Small",
    crop_types: Array.isArray(cust.crop_types) ? cust.crop_types.map((c) => sanitizeString(c, 50)) : ["Tomato"],
    gstin: sanitizeString(cust.gstin, 20).toUpperCase(),
    address: sanitizeString(cust.address, 300),
    opening_balance: sanitizeNumber(cust.opening_balance, -10_000_000, 10_000_000, 0),
    is_active: cust.is_active !== false,
    ...(cust.created_at ? { created_at: cust.created_at } : {}),
  };
}

/**
 * Product & Variants Sanitizer
 */
export function sanitizeProduct(prod: Product): Product {
  const sanitizedVariants: ProductVariant[] = (prod.variants || []).map((v) => ({
    name: sanitizeString(v.name, 80, "Standard"),
    price: sanitizeNumber(v.price, 0, 10000, 0),
    cost_price: sanitizeNumber(v.cost_price, 0, 10000, roundCurrency((v.price || 0) * 0.55)),
    duration: sanitizeInteger(v.duration, 1, 365, 30),
    description: sanitizeString(v.description, 255),
  }));

  return {
    ...(prod.id ? { id: sanitizeString(prod.id, 64) } : {}),
    name: sanitizeString(prod.name, 100, "UNNAMED CROP").toUpperCase(),
    category: sanitizeString(prod.category, 50, "Vegetables"),
    unit: sanitizeString(prod.unit, 20, "plants"),
    variants: sanitizedVariants.length > 0 ? sanitizedVariants : [{ name: "Standard", price: 0, duration: 30 }],
    description: sanitizeString(prod.description, 300),
    is_active: prod.is_active !== false,
    ...(prod.created_at ? { created_at: prod.created_at } : {}),
  };
}

/**
 * Order & Line Items Sanitizer
 */
export function sanitizeOrder(order: Order): Order {
  const sanitizedItems: OrderItem[] = (order.items || []).map((i) => ({
    ...(i.id ? { id: sanitizeString(i.id, 64) } : {}),
    ...(i.order_id ? { order_id: sanitizeString(i.order_id, 64) } : {}),
    product_name: sanitizeString(i.product_name, 100, "Crop"),
    variant_name: sanitizeString(i.variant_name, 80, "Standard"),
    price: sanitizeNumber(i.price, 0, 10000, 0),
    quantity: sanitizeInteger(i.quantity, 1, 10_000_000, 1),
    dispatch_from: sanitizeDate(i.dispatch_from),
    dispatch_to: sanitizeDate(i.dispatch_to),
    sowing_date: sanitizeDate(i.sowing_date),
    batch_id: sanitizeString(i.batch_id, 64),
    dispatched_qty: sanitizeInteger(i.dispatched_qty, 0, 10_000_000, 0),
    remaining_qty: sanitizeInteger(i.remaining_qty, 0, 10_000_000, 0),
    status: i.status === "dispatched" || i.status === "sowing_done" ? i.status : "pending",
  }));

  const itemsTotal = roundCurrency(
    sanitizedItems.reduce((sum, it) => sum + roundCurrency(it.price * it.quantity), 0)
  );
  const transport = sanitizeNumber(order.transport_charge, 0, 1_000_000, 0);
  const advance = sanitizeNumber(order.advance_payment, 0, 10_000_000, 0);
  const foc = sanitizeNumber(order.foc_amount, 0, 10_000_000, 0);
  const paid = sanitizeNumber(order.paid_amount, 0, 10_000_000, 0);

  const totalAmount = roundCurrency(Math.max(0, itemsTotal + transport - foc));
  const dueAmount = roundCurrency(Math.max(0, totalAmount - advance - paid));

  return {
    ...(order.id ? { id: sanitizeString(order.id, 64) } : {}),
    order_no: sanitizeString(order.order_no, 50, `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    customer_id: sanitizeString(order.customer_id, 64),
    customer_name: sanitizeString(order.customer_name, 120, "Customer"),
    order_date: sanitizeDate(order.order_date),
    status: order.status || "pending",
    transport_charge: transport,
    advance_payment: advance,
    foc_amount: foc,
    paid_amount: paid,
    items_total: itemsTotal,
    total_amount: totalAmount,
    due_amount: dueAmount,
    narration: sanitizeString(order.narration, 500),
    items: sanitizedItems,
    ...(order.created_at ? { created_at: order.created_at } : {}),
  };
}

/**
 * Production Batch Sanitizer
 */
export function sanitizeBatch(b: ProductionBatch): ProductionBatch {
  return {
    ...(b.id ? { id: sanitizeString(b.id, 64) } : {}),
    batch_no: sanitizeString(b.batch_no, 50, `BAT-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    batch_code: sanitizeString(b.batch_code, 50),
    lot_no: sanitizeString(b.lot_no, 50),
    unit: sanitizeString(b.unit, 50, "Polyhouse A"),
    polyhouse: sanitizeString(b.polyhouse, 50, "Polyhouse A"),
    table_no: sanitizeString(b.table_no, 50),
    tray_size: sanitizeString(b.tray_size, 50, "104 Cavity"),
    required_quantity: sanitizeInteger(b.required_quantity, 0, 10_000_000, 0),
    buffer_quantity_pct: sanitizeNumber(b.buffer_quantity_pct, 0, 100, 10),
    product_name: sanitizeString(b.product_name, 100, "Crop"),
    variant_name: sanitizeString(b.variant_name, 80, "Standard"),
    sowing_date: sanitizeDate(b.sowing_date),
    end_date: sanitizeDate(b.end_date, false),
    maturity_days: sanitizeInteger(b.maturity_days, 1, 365, 30),
    total_seeds: sanitizeInteger(b.total_seeds, 0, 20_000_000, 0),
    cocopeat_used: sanitizeNumber(b.cocopeat_used, 0, 10000, 0),
    trays_used: sanitizeInteger(b.trays_used, 0, 100000, 0),
    trays_sown: sanitizeInteger(b.trays_sown, 0, 100000, 0),
    seeds_per_tray: sanitizeInteger(b.seeds_per_tray, 1, 1000, 1),
    expected_plants: sanitizeInteger(b.expected_plants, 0, 10_000_000, 0),
    actual_plants: sanitizeInteger(b.actual_plants, 0, 10_000_000, 0),
    germination_pct: sanitizeNumber(b.germination_pct, 0, 100, 90),
    status: b.status || "sowing",
    notes: sanitizeString(b.notes, 500),
    allocated_quantity: sanitizeInteger(b.allocated_quantity, 0, 10_000_000, 0),
    surplus_quantity: sanitizeInteger(b.surplus_quantity, 0, 10_000_000, 0),
    cost_per_plant: sanitizeNumber(b.cost_per_plant, 0, 1000, 0.60),
    ...(b.created_at ? { created_at: b.created_at } : {}),
  };
}

/**
 * Purchase Bill Sanitizer
 */
export function sanitizePurchaseBill(bill: PurchaseBill): PurchaseBill {
  const sanitizedItems: PurchaseBillItem[] = (bill.items || []).map((i) => ({
    ...(i.id ? { id: sanitizeString(i.id, 64) } : {}),
    product_name: sanitizeString(i.product_name, 100, "Raw Material"),
    variant_name: sanitizeString(i.variant_name, 80),
    price: sanitizeNumber(i.price, 0, 10_000_000, 0),
    quantity: sanitizeNumber(i.quantity, 0.01, 1_000_000, 1),
  }));

  const itemsTotal = roundCurrency(
    sanitizedItems.reduce((sum, it) => sum + roundCurrency(it.price * it.quantity), 0)
  );
  const gstType = bill.gst_type === "none" || bill.gst_type === "amount" ? bill.gst_type : "percentage";
  const gstValue = sanitizeNumber(bill.gst_value, 0, 1000, 18);
  const gstAmount = sanitizeNumber(bill.gst_amount, 0, 10_000_000, 0);
  const transport = sanitizeNumber(bill.transport_charge, 0, 1_000_000, 0);
  const paid = sanitizeNumber(bill.paid_amount, 0, 50_000_000, 0);

  const totalAmount = roundCurrency(itemsTotal + gstAmount + transport);
  const dueAmount = roundCurrency(Math.max(0, totalAmount - paid));

  return {
    ...(bill.id ? { id: sanitizeString(bill.id, 64) } : {}),
    bill_no: sanitizeString(bill.bill_no, 50, `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    party_id: sanitizeString(bill.party_id, 64),
    party_name: sanitizeString(bill.party_name, 120, "Vendor"),
    bill_date: sanitizeDate(bill.bill_date),
    gst_type: gstType,
    gst_value: gstValue,
    gst_amount: gstAmount,
    transport_charge: transport,
    paid_amount: paid,
    items_total: itemsTotal,
    total_amount: totalAmount,
    due_amount: dueAmount,
    narration: sanitizeString(bill.narration, 500),
    items: sanitizedItems,
    ...(bill.created_at ? { created_at: bill.created_at } : {}),
  };
}

/**
 * Payment Receipt Sanitizer
 */
export function sanitizePaymentReceipt(rec: Partial<PaymentReceipt>): PaymentReceipt {
  const mode =
    rec.payment_mode === "Cash" || rec.payment_mode === "Bank Transfer" || rec.payment_mode === "Cheque"
      ? rec.payment_mode
      : "UPI";

  return {
    ...(rec.id ? { id: sanitizeString(rec.id, 64) } : {}),
    receipt_no: sanitizeString(rec.receipt_no, 50, `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    order_id: sanitizeString(rec.order_id, 64),
    order_no: sanitizeString(rec.order_no, 50),
    customer_id: sanitizeString(rec.customer_id, 64),
    customer_name: sanitizeString(rec.customer_name, 120, "Customer"),
    receipt_date: sanitizeDate(rec.receipt_date),
    amount: sanitizeNumber(rec.amount, 0.01, 100_000_000, 0),
    payment_mode: mode,
    reference_no: sanitizeString(rec.reference_no, 80),
    notes: sanitizeString(rec.notes, 500),
    ...(rec.created_at ? { created_at: rec.created_at } : {}),
  };
}

/**
 * Operating Expense Sanitizer
 */
export function sanitizeExpense(exp: Partial<ExpenseRecord>): ExpenseRecord {
  const sanitizedItems = (exp.items || []).map((i) => ({
    name: sanitizeString(i.name, 100, "Expense Item"),
    amount: sanitizeNumber(i.amount, 0, 10_000_000, 0),
  }));

  const itemsTotal = roundCurrency(sanitizedItems.reduce((sum, it) => sum + it.amount, 0));
  const shipping = sanitizeNumber(exp.shipping_amount, 0, 1_000_000, 0);
  const baseTotal = itemsTotal > 0 ? itemsTotal + shipping : sanitizeNumber(exp.total_amount, 0, 10_000_000, 0);

  return {
    ...(exp.id ? { id: sanitizeString(exp.id, 64) } : {}),
    expense_no: sanitizeString(exp.expense_no, 50, `EXP-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    expense_date: sanitizeDate(exp.expense_date),
    category_name: sanitizeString(exp.category_name, 80, "General Expense"),
    items: sanitizedItems,
    shipping_amount: shipping,
    total_amount: roundCurrency(baseTotal),
    payment_type: sanitizeString(exp.payment_type, 30, "Cash"),
    notes: sanitizeString(exp.notes, 500),
    ...(exp.created_at ? { created_at: exp.created_at } : {}),
  };
}

/**
 * Bank Account Sanitizer
 */
export function sanitizeBankAccount(acc: Partial<BankAccount>): BankAccount {
  const type = acc.account_type === "Savings" || acc.account_type === "Overdraft" ? acc.account_type : "Current";

  return {
    ...(acc.id ? { id: sanitizeString(acc.id, 64) } : {}),
    account_name: sanitizeString(acc.account_name, 100, "Bank Account"),
    account_number: sanitizeString(acc.account_number, 40),
    ifsc_code: sanitizeString(acc.ifsc_code, 20).toUpperCase(),
    bank_name: sanitizeString(acc.bank_name, 80),
    account_type: type,
    balance: sanitizeNumber(acc.balance, -100_000_000, 100_000_000, 0),
    is_online_payment: acc.is_online_payment === true,
    is_printing_default: acc.is_printing_default === true,
    ...(acc.created_at ? { created_at: acc.created_at } : {}),
  };
}

/**
 * Dispatch Record Sanitizer
 */
export function sanitizeDispatch(disp: Partial<DispatchRecord>): DispatchRecord {
  const sanitizedItems = (disp.items || []).map((i) => ({
    product_name: sanitizeString(i.product_name, 100, "Crop"),
    variant_name: sanitizeString(i.variant_name, 80, "Standard"),
    quantity: sanitizeInteger(i.quantity, 1, 10_000_000, 1),
    trays: sanitizeInteger(i.trays, 0, 100000, 0),
    lot_no: sanitizeString(i.lot_no, 50),
    unit: sanitizeString(i.unit, 20, "plants"),
  }));

  const totalPlants = sanitizeInteger(
    disp.total_plants !== undefined
      ? disp.total_plants
      : sanitizedItems.reduce((s, it) => s + (it.quantity || 0), 0)
  );

  return {
    ...(disp.id ? { id: sanitizeString(disp.id, 64) } : {}),
    dispatch_no: sanitizeString(disp.dispatch_no, 50, `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`),
    order_id: sanitizeString(disp.order_id, 64),
    order_no: sanitizeString(disp.order_no, 50),
    customer_id: sanitizeString(disp.customer_id, 64),
    customer_name: sanitizeString(disp.customer_name, 120, "Customer"),
    customer_phone: sanitizePhone(disp.customer_phone),
    customer_code: sanitizeString(disp.customer_code, 50),
    village: sanitizeString(disp.village, 100),
    due_amount: sanitizeNumber(disp.due_amount, 0, 100_000_000, 0),
    total_trays: sanitizeInteger(disp.total_trays, 0, 100000, 0),
    total_plants: totalPlants,
    dispatch_date: sanitizeDate(disp.dispatch_date),
    vehicle_name: sanitizeString(disp.vehicle_name, 80),
    vehicle_no: sanitizeString(disp.vehicle_no, 30),
    driver_name: sanitizeString(disp.driver_name, 80),
    driver_phone: sanitizePhone(disp.driver_phone),
    status: disp.status || "dispatched",
    notes: sanitizeString(disp.notes, 500),
    created_by: sanitizeString(disp.created_by, 64),
    items: sanitizedItems,
    ...(disp.created_at ? { created_at: disp.created_at } : {}),
  };
}

/**
 * Driver Sanitizer
 */
export function sanitizeDriver(drv: Partial<Driver>): Driver {
  return {
    ...(drv.id ? { id: sanitizeString(drv.id, 64) } : {}),
    name: sanitizeString(drv.name, 100, "Driver"),
    phone: sanitizePhone(drv.phone),
    vehicle_name: sanitizeString(drv.vehicle_name, 80),
    vehicle_number: sanitizeString(drv.vehicle_number, 30),
    balance: sanitizeNumber(drv.balance, -10_000_000, 10_000_000, 0),
    status: drv.status === "Inactive" ? "Inactive" : "Active",
    ...(drv.created_at ? { created_at: drv.created_at } : {}),
  };
}
