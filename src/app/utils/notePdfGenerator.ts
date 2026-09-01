import { SalesReturn, PurchaseReturn } from "../../db/supabaseService";
import { formatCurrencyINR, roundCurrency } from "./financialMath";

function numberToIndianWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const n = ("000000000" + Math.floor(Math.abs(num))).substr(-9);
  const match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return "";

  let str = "";
  str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0]] + " " + a[match[1][1]]) + "Crore " : "";
  str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0]] + " " + a[match[2][1]]) + "Lakh " : "";
  str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0]] + " " + a[match[3][1]]) + "Thousand " : "";
  str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0]] + " " + a[match[4][1]]) + "Hundred " : "";
  str += Number(match[5]) !== 0
    ? (str !== "" ? "and " : "") + (a[Number(match[5])] || b[match[5][0]] + " " + a[match[5][1]])
    : "";

  return str.trim() ? str.trim() + " Rupees Only" : "Zero Rupees Only";
}

export function generateCreditNoteHTML(cn: SalesReturn): string {
  const wordsText = numberToIndianWords(cn.total_amount || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Credit Note - ${cn.credit_note_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background: #f5f5f5; padding: 20px; }
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #00a651;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .title-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.6;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .items-table th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      text-align: left;
    }
    .items-table td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
    }
    .total-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header-bar">
      <div>
        <h1 style="color: #00a651; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RKK NURSERY</h1>
        <p style="font-size: 11px; color: #6b7280; margin-top: 2px;">High-Tech Seedlings, Saplings &amp; Plant Production</p>
        <p style="font-size: 11px; color: #6b7280;">Chabdi Kala, Umreth Road, Chhindwara (MP) • Ph: 8319011437</p>
      </div>
      <div style="text-align: right;">
        <div class="title-banner">CREDIT NOTE (SALES RETURN)</div>
        <div style="font-size: 12px; font-weight: 700; color: #1f2937; margin-top: 6px;">#${cn.credit_note_no}</div>
        <div style="font-size: 11px; color: #6b7280;">Date: ${cn.return_date}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong style="color: #374151; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 4px;">Credit Issued To (Customer):</strong>
        <div style="font-size: 14px; font-weight: 700; color: #111827;">${cn.customer_name}</div>
        <div>Linked Order / Bill: <strong>${cn.order_no || "N/A"}</strong></div>
        <div>Settlement Action: <span style="color: #166534; font-weight: 700;">Credited to Party Ledger</span></div>
      </div>
      <div class="info-card">
        <strong style="color: #374151; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 4px;">Return Reason &amp; Summary:</strong>
        <div>Reason: <strong>${cn.reason || "Plant mortality / Transit return"}</strong></div>
        <div>Total Value Credited: <strong style="color: #166534; font-size: 14px;">₹${(cn.total_amount || 0).toLocaleString("en-IN")}</strong></div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${wordsText}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Returned Plant / Item</th>
          <th>Variety / Specs</th>
          <th style="text-align: right;">Returned Qty</th>
          <th style="text-align: right;">Rate (₹)</th>
          <th style="text-align: right;">Credit Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${cn.items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${it.product_name}</strong></td>
            <td>${it.variant_name || "-"}</td>
            <td style="text-align: right; font-weight: 700;">${it.quantity?.toLocaleString("en-IN")}</td>
            <td style="text-align: right;">₹${it.unit_price?.toLocaleString("en-IN")}</td>
            <td style="text-align: right; font-weight: 800; color: #166534;">₹${it.line_total?.toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="total-box">
      <div>
        <span style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; display: block;">Amount In Words</span>
        <span style="font-size: 13px; font-weight: 700; color: #111827;">${wordsText}</span>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; display: block;">Total Credit Note Value</span>
        <span style="font-size: 20px; font-weight: 900; color: #166534;">₹${(cn.total_amount || 0).toLocaleString("en-IN")}</span>
      </div>
    </div>

    <div class="footer">
      <div>
        <p>This is a computer-generated Credit Note issued by RKK Nursery.</p>
        <p>The above amount has been credited to the customer's ledger statement.</p>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; margin-bottom: 24px; color: #374151;">For: RKK NURSERY</div>
        <div style="font-size: 10px; border-top: 1px solid #9ca3af; padding-top: 4px;">Authorized Signatory</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 300); }
  </script>
</body>
</html>`;
}

export function generateDebitNoteHTML(dn: PurchaseReturn): string {
  const wordsText = numberToIndianWords(dn.total_amount || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Debit Note - ${dn.debit_note_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    body { background: #f5f5f5; padding: 20px; }
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .title-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.6;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .items-table th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      text-align: left;
    }
    .items-table td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
    }
    .total-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header-bar">
      <div>
        <h1 style="color: #2563eb; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RKK NURSERY</h1>
        <p style="font-size: 11px; color: #6b7280; margin-top: 2px;">High-Tech Seedlings, Saplings &amp; Plant Production</p>
        <p style="font-size: 11px; color: #6b7280;">Chabdi Kala, Umreth Road, Chhindwara (MP) • Ph: 8319011437</p>
      </div>
      <div style="text-align: right;">
        <div class="title-banner">DEBIT NOTE (PURCHASE RETURN)</div>
        <div style="font-size: 12px; font-weight: 700; color: #1f2937; margin-top: 6px;">#${dn.debit_note_no}</div>
        <div style="font-size: 11px; color: #6b7280;">Date: ${dn.return_date}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong style="color: #374151; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 4px;">Debit Issued To (Supplier / Vendor):</strong>
        <div style="font-size: 14px; font-weight: 700; color: #111827;">${dn.party_name}</div>
        <div>Linked Purchase Bill: <strong>${dn.bill_no || "N/A"}</strong></div>
        <div>Settlement Action: <span style="color: #1e40af; font-weight: 700;">Debited from Vendor Payable Balance</span></div>
      </div>
      <div class="info-card">
        <strong style="color: #374151; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 4px;">Return Reason &amp; Summary:</strong>
        <div>Reason: <strong>${dn.reason || "Defective goods / Expired seeds / Damaged trays"}</strong></div>
        <div>Total Value Debited: <strong style="color: #1e40af; font-size: 14px;">₹${(dn.total_amount || 0).toLocaleString("en-IN")}</strong></div>
        <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${wordsText}</div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Returned Raw Material / Item</th>
          <th>Unit / Specs</th>
          <th style="text-align: right;">Returned Qty</th>
          <th style="text-align: right;">Rate (₹)</th>
          <th style="text-align: right;">Debit Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${dn.items.map((it, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${it.product_name}</strong></td>
            <td>${it.variant_name || it.unit || "-"}</td>
            <td style="text-align: right; font-weight: 700;">${it.quantity?.toLocaleString("en-IN")} ${it.unit || ""}</td>
            <td style="text-align: right;">₹${it.unit_price?.toLocaleString("en-IN")}</td>
            <td style="text-align: right; font-weight: 800; color: #1e40af;">₹${it.line_total?.toLocaleString("en-IN")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="total-box">
      <div>
        <span style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase; display: block;">Amount In Words</span>
        <span style="font-size: 13px; font-weight: 700; color: #111827;">${wordsText}</span>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase; display: block;">Total Debit Note Value</span>
        <span style="font-size: 20px; font-weight: 900; color: #1e40af;">₹${(dn.total_amount || 0).toLocaleString("en-IN")}</span>
      </div>
    </div>

    <div class="footer">
      <div>
        <p>This is a computer-generated Debit Note issued by RKK Nursery.</p>
        <p>The above amount has been debited from the supplier's payable ledger account.</p>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; margin-bottom: 24px; color: #374151;">For: RKK NURSERY</div>
        <div style="font-size: 10px; border-top: 1px solid #9ca3af; padding-top: 4px;">Authorized Signatory</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 300); }
  </script>
</body>
</html>`;
}

export function printCreditNotePDF(cn: SalesReturn) {
  const html = generateCreditNoteHTML(cn);
  const win = window.open("", "_blank", "width=850,height=1100");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}

export function printDebitNotePDF(dn: PurchaseReturn) {
  const html = generateDebitNoteHTML(dn);
  const win = window.open("", "_blank", "width=850,height=1100");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}
