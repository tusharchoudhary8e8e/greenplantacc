/**
 * Financial Math & GST Precision Utility for Nursery Accounting
 * Standardized Half-Up 2-Decimal Banker's Rounding for Indian GAAP & GST
 */

/**
 * Rounds any financial number to exactly 2 decimal places (paisa level)
 * Eliminates IEEE 754 floating-point artifacts like 0.30000000000000004 or 35.991000000000005
 */
export function roundCurrency(amount: number | null | undefined): number {
  if (amount === null || amount === undefined || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates GST amount and breakdown (CGST/SGST/IGST) with exact paisa rounding
 */
export function calculateGstBreakdown(
  taxableAmount: number,
  gstType: "percentage" | "amount" | "none",
  gstValue: number,
  isInterstate: boolean = false
): {
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalWithGst: number;
} {
  const taxable = roundCurrency(taxableAmount);
  let gst = 0;

  if (gstType === "percentage") {
    gst = roundCurrency((taxable * (gstValue || 0)) / 100);
  } else if (gstType === "amount") {
    gst = roundCurrency(gstValue || 0);
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (gst > 0) {
    if (isInterstate) {
      igst = gst;
    } else {
      cgst = roundCurrency(gst / 2);
      sgst = roundCurrency(gst - cgst); // Guarantees cgst + sgst === gst without fractional split loss
    }
  }

  return {
    gstAmount: gst,
    cgst,
    sgst,
    igst,
    totalWithGst: roundCurrency(taxable + gst),
  };
}

/**
 * Calculates Sales Order financial totals with exact 2-decimal precision
 */
export function calculateOrderTotals(
  items: { price: number; quantity: number }[],
  transportCharge: number = 0,
  focDiscount: number = 0,
  advancePayment: number = 0
): {
  itemsTotal: number;
  transportVal: number;
  focVal: number;
  advanceVal: number;
  netGrandTotal: number;
  dueBalanceAmount: number;
} {
  const itemsTotal = roundCurrency(
    (items || []).reduce((sum, it) => sum + roundCurrency((it.price || 0) * (it.quantity || 0)), 0)
  );
  const transportVal = roundCurrency(transportCharge);
  const focVal = roundCurrency(focDiscount);
  const advanceVal = roundCurrency(advancePayment);

  const netGrandTotal = roundCurrency(Math.max(0, itemsTotal + transportVal - focVal));
  const dueBalanceAmount = roundCurrency(Math.max(0, netGrandTotal - advanceVal));

  return {
    itemsTotal,
    transportVal,
    focVal,
    advanceVal,
    netGrandTotal,
    dueBalanceAmount,
  };
}

/**
 * Calculates Purchase Bill financial totals with exact 2-decimal precision
 */
export function calculatePurchaseBillTotals(
  items: { price: number; quantity: number }[],
  gstType: "percentage" | "amount" | "none" = "percentage",
  gstValue: number = 18,
  transportCharge: number = 0,
  paidAmount: number = 0
): {
  itemsTotal: number;
  gstAmount: number;
  transportVal: number;
  paidVal: number;
  netGrandTotal: number;
  dueBalance: number;
} {
  const itemsTotal = roundCurrency(
    (items || []).reduce((sum, it) => sum + roundCurrency((it.price || 0) * (it.quantity || 0)), 0)
  );
  const gstBreakdown = calculateGstBreakdown(itemsTotal, gstType, gstValue);
  const gstAmount = gstBreakdown.gstAmount;
  const transportVal = roundCurrency(transportCharge);
  const paidVal = roundCurrency(paidAmount);

  const netGrandTotal = roundCurrency(itemsTotal + gstAmount + transportVal);
  const dueBalance = roundCurrency(Math.max(0, netGrandTotal - paidVal));

  return {
    itemsTotal,
    gstAmount,
    transportVal,
    paidVal,
    netGrandTotal,
    dueBalance,
  };
}

/**
 * Formats a currency number into standard Indian numbering format (e.g. ₹ 1,23,456.50)
 */
export function formatCurrencyINR(amount: number, minimumFractionDigits: number = 2): string {
  const rounded = roundCurrency(amount);
  return `₹ ${rounded.toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  })}`;
}
