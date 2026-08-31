// Receipt PDF Generator Utility (Matching RKK Nursery Orange Header PDF Receipt Format)

export interface ReceiptData {
  receiptNo: string;
  date: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  totalAmount?: number;
  amount: number;
  previousBalance?: number;
  currentBalance?: number;
  paymentType: string; // e.g. "SBI Current A/C", "Cash", "UPI / PhonePe", etc.
  notes?: string;
  items?: { product_name: string; variant_name?: string; quantity: number; price: number }[];
}

export function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num) || num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  const integerPart = Math.floor(Math.abs(num));
  const words = inWords(integerPart);
  return `${words} Rupees Only`;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const formattedDate = data.date || new Date().toISOString().split("T")[0];
  const wordsText = numberToWordsIndian(data.amount);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - ${data.receiptNo}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      color: #1a1a1a;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-container {
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
      padding-bottom: 60px;
    }
    .top-orange-header {
      background-color: #f58220 !important;
      color: #ffffff !important;
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-logo-box {
      width: 72px;
      height: 72px;
      background: #0d0d0d;
      border: 1.5px solid #ffcc00;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #ffffff;
      font-size: 8px;
      font-weight: bold;
      border-radius: 4px;
    }
    .company-info {
      text-align: right;
    }
    .company-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-family: 'Times New Roman', Georgia, serif;
      color: #ffffff !important;
    }
    .company-sub {
      font-size: 11px;
      font-weight: 500;
      opacity: 0.95;
      line-height: 1.4;
      color: #ffffff !important;
    }
    .document-title {
      text-align: center;
      font-size: 22px;
      font-weight: bold;
      color: #f58220;
      margin: 22px 0 18px 0;
      font-family: 'Times New Roman', Georgia, serif;
    }
    .content-body {
      padding: 0 28px;
    }
    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 18px;
    }
    .section-header {
      background-color: #f58220 !important;
      color: #ffffff !important;
      font-size: 12px;
      font-weight: bold;
      padding: 6px 14px;
    }
    .section-box {
      border: 1px solid #e0e0e0;
      border-top: none;
      padding: 12px 14px;
      min-height: 75px;
      font-size: 12px;
      line-height: 1.6;
      background: #ffffff;
    }
    .cust-name {
      font-weight: bold;
      font-size: 13px;
      color: #000;
      text-transform: uppercase;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
    }
    .detail-label {
      color: #555;
    }
    .detail-val {
      font-weight: bold;
      color: #000;
    }
    .amount-words-box {
      border: 1px solid #e0e0e0;
      border-top: none;
      padding: 12px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #222;
      min-height: 48px;
    }
    .amounts-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .amounts-table td {
      padding: 7px 14px;
    }
    .amounts-table tr {
      border-bottom: 1px solid #f0f0f0;
    }
    .amounts-table tr:last-child {
      border-bottom: none;
    }
    .amt-label {
      color: #333;
      font-weight: 500;
    }
    .amt-val {
      text-align: right;
      font-weight: bold;
      font-mono: monospace;
      font-size: 13px;
    }
    .signatory-section {
      margin-top: 60px;
      padding-right: 36px;
      text-align: right;
    }
    .signatory-title {
      font-size: 12px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
    }
    .stamp-badge {
      display: inline-block;
      width: 130px;
      height: 54px;
      border: 2px dashed #004080;
      border-radius: 50%;
      color: #004080;
      font-size: 9px;
      font-weight: bold;
      text-align: center;
      padding-top: 10px;
      margin-bottom: 8px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .signatory-sub {
      font-size: 12px;
      font-weight: bold;
      color: #000;
    }
    .bottom-watermark {
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #777777;
      border-top: 1px solid #eeeeee;
      padding-top: 8px;
    }
    .footer-tag {
      background: #f0fdf4;
      color: #166534;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      border: 1px solid #bbf7d0;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Top Orange Header Banner -->
    <div class="top-orange-header">
      <div class="company-logo-box">
        <div style="color:#ffcc00; font-size:16px; margin-bottom:2px;">🌱</div>
        <div style="font-size:7px; font-weight:bold;">RKK NURSERY</div>
        <div style="font-size:5.5px; opacity:0.85;">PREMIUM QUALITY</div>
      </div>
      <div class="company-info">
        <div class="company-title">RKK NURSERY</div>
        <div class="company-sub">UMRETH ROAD, CHABDIKALA, CHHINDWARA (MP)</div>
        <div class="company-sub">Phone no.: 8319011437 Email: rkknursery@gmail.com</div>
      </div>
    </div>

    <!-- Document Title -->
    <div class="document-title">Payment Receipt</div>

    <div class="content-body">
      <!-- Row 1: Received From & Receipt Details -->
      <div class="grid-2col">
        <div>
          <div class="section-header">Received From</div>
          <div class="section-box">
            <div class="cust-name">${data.customerName || "GOLU YADUWANSHI LIKHAWADI"}</div>
            <div>${data.customerAddress || "CHABDIKALA, CHHINDWARA"}</div>
            <div style="margin-top:4px;">Contact No.: <strong>${data.customerPhone || "N/A"}</strong></div>
          </div>
        </div>

        <div>
          <div class="section-header">Receipt Details</div>
          <div class="section-box" style="padding: 12px 14px;">
            <div class="detail-row">
              <span class="detail-label">Receipt No.:</span>
              <span class="detail-val">${data.receiptNo}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-val">${formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Amount In Words & Amounts Table -->
      <div class="grid-2col" style="grid-template-columns: 1.15fr 0.85fr;">
        <div>
          <div class="section-header">Amount In Words</div>
          <div class="amount-words-box">
            ${wordsText}
          </div>

          <div class="section-header" style="margin-top: 16px;">Payment Type</div>
          <div class="section-box" style="min-height: auto; font-weight: bold; font-size: 13px;">
            ${data.paymentType || "Cash"}
          </div>
        </div>

        <div>
          <div class="section-header">Amounts</div>
          <div class="section-box" style="padding: 0;">
            <table class="amounts-table">
              ${data.totalAmount !== undefined ? `
              <tr>
                <td class="amt-label">Total Order Amount</td>
                <td class="amt-val">₹ ${(data.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="amt-label">Received / Advance</td>
                <td class="amt-val">₹ ${(data.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td class="amt-label">Previous Balance</td>
                <td class="amt-val">₹ ${(data.previousBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td class="amt-label">Current Balance Due</td>
                <td class="amt-val" style="color: #e05c00;">₹ ${(data.currentBalance !== undefined ? data.currentBalance : Math.max(0, (data.totalAmount || 0) - (data.amount || 0))).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Signatory Section -->
      <div class="signatory-section">
        <div class="signatory-title">For: RKK NURSERY</div>
        <div class="stamp-badge">
          ★ RKK NURSERY ★<br/>
          PREMIUM QUALITY<br/>
          CHABDI KALA
        </div>
        <div class="signatory-sub">Authorized Signatory</div>
      </div>
    </div>

    <!-- Bottom Official Footer -->
    <div class="bottom-watermark">
      <span>RKK Nursery • Official Accounting & Management System</span>
      <span class="footer-tag">Authorized Payment Receipt</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    }
  </script>
</body>
</html>`;
}

export function printReceiptPDF(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
