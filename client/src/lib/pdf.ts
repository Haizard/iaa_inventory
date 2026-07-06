import jsPDF from 'jspdf';

// ─── colour palette ───────────────────────────────────────────────────────────
const C = {
  bg:        [8,  13, 32]  as [number,number,number],
  card:      [18, 26, 58]  as [number,number,number],
  accent:    [59, 130,246] as [number,number,number],
  accentAlt: [99, 102,241] as [number,number,number],
  text:      [255,255,255] as [number,number,number],
  muted:     [150,160,190] as [number,number,number],
  success:   [16, 185,129] as [number,number,number],
  warning:   [245,158, 11] as [number,number,number],
  danger:    [239, 68, 68] as [number,number,number],
  divider:   [40,  52, 90] as [number,number,number],
};

function getLogoDataUrl(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve('');
    img.src = '/iaa-logo.jpeg';
  });
}

function drawHeader(doc: jsPDF, logoData: string, title: string, subtitle: string) {
  const W = doc.internal.pageSize.getWidth();

  // full-width dark background
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, 38, 'F');

  // accent bar at top
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, W, 3, 'F');

  // logo
  if (logoData) {
    try { doc.addImage(logoData, 'JPEG', 14, 8, 22, 22); } catch (_) {/* skip */}
  }

  // company text
  doc.setTextColor(...C.text);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('IAA Inventory IMS', logoData ? 40 : 14, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.muted);
  doc.text('Group 86 — Institute of Accountancy Arusha', logoData ? 40 : 14, 24);

  // right-side title block
  doc.setFillColor(...C.accentAlt);
  doc.roundedRect(W - 72, 7, 58, 24, 3, 3, 'F');
  doc.setTextColor(...C.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, W - 43, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, W - 43, 26, { align: 'center' });

  // divider line
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.4);
  doc.line(14, 42, W - 14, 42);
}

function drawFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...C.bg);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.4);
  doc.line(14, H - 14, W - 14, H - 14);
  doc.setFontSize(7);
  doc.setTextColor(...C.muted);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, H - 5);
  doc.text('IAA Inventory IMS — Group 86', W / 2, H - 5, { align: 'center' });
  doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, W - 14, H - 5, { align: 'right' });
}

// ─── Row colours ─────────────────────────────────────────────────────────────
function rowBg(i: number): [number,number,number] {
  return i % 2 === 0 ? [18, 26, 58] : [22, 32, 68];
}

// ─── Table renderer ──────────────────────────────────────────────────────────
interface ColDef { header: string; key: string; width: number; align?: 'left'|'right'|'center'; color?: (v: any) => [number,number,number] }

function drawTable(
  doc: jsPDF,
  cols: ColDef[],
  rows: Record<string, any>[],
  startY: number
): number {
  const W  = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const marginL = 14;
  const rowH    = 8;
  const headH   = 9;
  let y = startY;

  // header row
  doc.setFillColor(...C.accent);
  doc.rect(marginL, y, W - marginL * 2, headH, 'F');
  doc.setTextColor(...C.text);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let x = marginL + 3;
  for (const col of cols) {
    doc.text(col.header, col.align === 'right' ? x + col.width - 4 : x, y + 6.3, { align: col.align ?? 'left', maxWidth: col.width - 4 });
    x += col.width;
  }
  y += headH;

  // data rows
  for (let i = 0; i < rows.length; i++) {
    if (y + rowH > PH - 20) {
      drawFooter(doc);
      doc.addPage();
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, W, PH, 'F');
      y = 16;
      // repeat header
      doc.setFillColor(...C.accent);
      doc.rect(marginL, y, W - marginL * 2, headH, 'F');
      doc.setTextColor(...C.text);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      x = marginL + 3;
      for (const col of cols) {
        doc.text(col.header, col.align === 'right' ? x + col.width - 4 : x, y + 6.3, { align: col.align ?? 'left', maxWidth: col.width - 4 });
        x += col.width;
      }
      y += headH;
    }
    const row = rows[i];
    doc.setFillColor(...rowBg(i));
    doc.rect(marginL, y, W - marginL * 2, rowH, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    x = marginL + 3;
    for (const col of cols) {
      const val = row[col.key] ?? '';
      const clr = col.color ? col.color(val) : C.muted;
      doc.setTextColor(...clr);
      doc.text(String(val), col.align === 'right' ? x + col.width - 4 : x, y + 5.5, { align: col.align ?? 'left', maxWidth: col.width - 4 });
      x += col.width;
    }
    y += rowH;
  }

  return y;
}

// ─── Summary box ─────────────────────────────────────────────────────────────
function drawSummaryBox(doc: jsPDF, items: { label: string; value: string }[], startY: number): number {
  const W = doc.internal.pageSize.getWidth();
  const boxW = (W - 28) / Math.min(items.length, 4);
  const boxH = 22;
  for (let i = 0; i < items.length; i++) {
    const bx = 14 + i * boxW;
    doc.setFillColor(...C.card);
    doc.roundedRect(bx, startY, boxW - 3, boxH, 2, 2, 'F');
    doc.setFillColor(...C.accent);
    doc.rect(bx, startY, 2, boxH, 'F');
    doc.setTextColor(...C.muted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(items[i].label, bx + 6, startY + 8);
    doc.setTextColor(...C.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(items[i].value, bx + 6, startY + 17);
  }
  return startY + boxH + 6;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

/** Sales receipt for a single sale */
export async function generateSaleReceipt(sale: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const W   = doc.internal.pageSize.getWidth();
  const logoData = await getLogoDataUrl();

  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  drawHeader(doc, logoData, 'RECEIPT', sale.invoiceNo);

  let y = 50;

  // meta
  const meta = [
    ['Date',     new Date(sale.createdAt).toLocaleString()],
    ['Customer', sale.customer?.name ?? 'Walk-in'],
    ['Cashier',  sale.user?.name ?? '—'],
    ['Status',   sale.status],
  ];
  doc.setFontSize(8);
  for (const [k, v] of meta) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.muted);   doc.text(k + ':', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text);  doc.text(String(v), 48, y);
    y += 6;
  }
  y += 4;

  // items table
  y = drawTable(doc, [
    { header: 'Item',       key: 'name',      width: 60 },
    { header: 'Qty',        key: 'qty',       width: 18, align: 'right' },
    { header: 'Unit Price', key: 'unitPrice', width: 36, align: 'right', color: () => C.muted },
    { header: 'Subtotal',   key: 'subtotal',  width: 36, align: 'right', color: () => C.success },
  ], sale.items.map((i: any) => ({
    name:      i.product?.name ?? i.productName ?? '—',
    qty:       i.quantity,
    unitPrice: `TZS ${Number(i.unitPrice).toLocaleString()}`,
    subtotal:  `TZS ${Number(i.subtotal ?? i.quantity * i.unitPrice).toLocaleString()}`,
  })), y);

  // totals
  y += 4;
  const totals = [
    ['Total', `TZS ${Number(sale.totalAmount).toLocaleString()}`],
  ];
  for (const [k, v] of totals) {
    doc.setFillColor(...C.accentAlt);
    doc.roundedRect(W - 80, y - 5, 66, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text);
    doc.setFontSize(9);
    doc.text(k, W - 74, y + 2);
    doc.text(v, W - 14, y + 2, { align: 'right' });
    y += 14;
  }

  drawFooter(doc);
  doc.save(`receipt-${sale.invoiceNo}.pdf`);
}

/** Sales report PDF */
export async function generateSalesReportPDF(data: any, from: string, to: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W   = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const logoData = await getLogoDataUrl();

  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, PH, 'F');

  drawHeader(doc, logoData, 'SALES REPORT', `${from}  →  ${to}`);

  let y = 50;
  y = drawSummaryBox(doc, [
    { label: 'Total Revenue',   value: `TZS ${Number(data.summary.totalRevenue).toLocaleString()}` },
    { label: 'Transactions',    value: String(data.summary.totalTransactions) },
    { label: 'Completed',       value: String(data.summary.completedCount) },
    { label: 'Cancelled',       value: String(data.summary.cancelledCount) },
  ], y);

  y = drawTable(doc, [
    { header: 'Invoice #',    key: 'invoiceNo',  width: 36 },
    { header: 'Date',         key: 'date',       width: 46 },
    { header: 'Customer',     key: 'customer',   width: 52 },
    { header: 'Recorded By',  key: 'user',       width: 46 },
    { header: 'Total (TZS)',  key: 'total',      width: 44, align: 'right', color: () => C.success },
    { header: 'Status',       key: 'status',     width: 30 },
  ], data.sales.map((s: any) => ({
    invoiceNo: s.invoiceNo,
    date:      new Date(s.createdAt).toLocaleDateString(),
    customer:  s.customer?.name ?? 'Walk-in',
    user:      s.user?.name ?? '—',
    total:     Number(s.totalAmount).toLocaleString(),
    status:    s.status,
  })), y);

  drawFooter(doc);
  doc.save(`sales-report-${from}-${to}.pdf`);
}

/** Purchases report PDF */
export async function generatePurchasesReportPDF(data: any, from: string, to: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W   = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const logoData = await getLogoDataUrl();

  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, PH, 'F');

  drawHeader(doc, logoData, 'PURCHASES REPORT', `${from}  →  ${to}`);

  let y = 50;
  y = drawSummaryBox(doc, [
    { label: 'Total Cost',   value: `TZS ${Number(data.summary.totalCost).toLocaleString()}` },
    { label: 'Total Orders', value: String(data.summary.totalOrders) },
    { label: 'Received',     value: String(data.summary.receivedCount) },
  ], y);

  y = drawTable(doc, [
    { header: 'Reference #', key: 'referenceNo', width: 44 },
    { header: 'Date',        key: 'date',        width: 46 },
    { header: 'Supplier',    key: 'supplier',    width: 66 },
    { header: 'Total (TZS)', key: 'total',       width: 54, align: 'right', color: () => C.warning },
    { header: 'Status',      key: 'status',      width: 34 },
  ], data.purchases.map((p: any) => ({
    referenceNo: p.referenceNo,
    date:        new Date(p.createdAt).toLocaleDateString(),
    supplier:    p.supplier?.name ?? '—',
    total:       Number(p.totalAmount).toLocaleString(),
    status:      p.status,
  })), y);

  drawFooter(doc);
  doc.save(`purchases-report-${from}-${to}.pdf`);
}

/** Stock report PDF */
export async function generateStockReportPDF(data: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W   = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const logoData = await getLogoDataUrl();

  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, PH, 'F');

  drawHeader(doc, logoData, 'STOCK REPORT', new Date().toLocaleDateString());

  let y = 50;
  y = drawSummaryBox(doc, [
    { label: 'Total Products', value: String(data.summary.totalProducts) },
    { label: 'Low Stock',      value: String(data.summary.lowStock) },
    { label: 'Out of Stock',   value: String(data.summary.outOfStock) },
    { label: 'Stock Value',    value: `TZS ${Number(data.summary.totalStockValue).toLocaleString()}` },
  ], y);

  const statusColor = (v: string): [number,number,number] =>
    v === 'OK' ? C.success : v === 'LOW STOCK' ? C.warning : C.danger;

  y = drawTable(doc, [
    { header: 'Product',      key: 'name',       width: 64 },
    { header: 'SKU',          key: 'sku',        width: 36 },
    { header: 'Category',     key: 'category',   width: 40 },
    { header: 'Qty',          key: 'qty',        width: 22, align: 'right' },
    { header: 'Min Stock',    key: 'minStock',   width: 24, align: 'right' },
    { header: 'Cost Price',   key: 'costPrice',  width: 36, align: 'right' },
    { header: 'Stock Value',  key: 'stockValue', width: 40, align: 'right', color: () => C.text },
    { header: 'Status',       key: 'status',     width: 28, color: statusColor },
  ], data.products.map((p: any) => {
    const status = p.quantity === 0 ? 'OUT OF STOCK' : p.quantity <= p.minStock ? 'LOW STOCK' : 'OK';
    return {
      name:       p.name,
      sku:        p.sku,
      category:   p.category?.name ?? '—',
      qty:        p.quantity,
      minStock:   p.minStock,
      costPrice:  Number(p.costPrice).toLocaleString(),
      stockValue: (Number(p.costPrice) * p.quantity).toLocaleString(),
      status,
    };
  }), y);

  drawFooter(doc);
  doc.save(`stock-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

/** Purchase order receipt */
export async function generatePurchaseReceipt(purchase: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const W   = doc.internal.pageSize.getWidth();
  const logoData = await getLogoDataUrl();

  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, doc.internal.pageSize.getHeight(), 'F');

  drawHeader(doc, logoData, 'PURCHASE ORDER', purchase.referenceNo);

  let y = 50;
  const meta = [
    ['Date',     new Date(purchase.createdAt).toLocaleString()],
    ['Supplier', purchase.supplier?.name ?? '—'],
    ['Recorded', purchase.user?.name ?? '—'],
    ['Status',   purchase.status],
  ];
  doc.setFontSize(8);
  for (const [k, v] of meta) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.muted);  doc.text(k + ':', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text); doc.text(String(v), 48, y);
    y += 6;
  }
  y += 4;

  y = drawTable(doc, [
    { header: 'Product',    key: 'name',      width: 60 },
    { header: 'Qty',        key: 'qty',       width: 18, align: 'right' },
    { header: 'Unit Cost',  key: 'unitCost',  width: 36, align: 'right', color: () => C.muted },
    { header: 'Subtotal',   key: 'subtotal',  width: 36, align: 'right', color: () => C.warning },
  ], (purchase.items ?? []).map((i: any) => ({
    name:     i.product?.name ?? i.productName ?? '—',
    qty:      i.quantity,
    unitCost: `TZS ${Number(i.unitCost).toLocaleString()}`,
    subtotal: `TZS ${Number(i.subtotal ?? i.quantity * i.unitCost).toLocaleString()}`,
  })), y);

  y += 4;
  doc.setFillColor(...C.accentAlt);
  doc.roundedRect(W - 80, y - 5, 66, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text); doc.setFontSize(9);
  doc.text('Total', W - 74, y + 2);
  doc.text(`TZS ${Number(purchase.totalAmount).toLocaleString()}`, W - 14, y + 2, { align: 'right' });

  drawFooter(doc);
  doc.save(`purchase-order-${purchase.referenceNo}.pdf`);
}

/** Print a receipt (opens a print-friendly window) */
export function printReceiptHtml(sale: any) {
  const items = (sale.items ?? []).map((i: any) => `
    <tr>
      <td>${i.product?.name ?? i.productName ?? '—'}</td>
      <td style="text-align:center">${i.quantity}</td>
      <td style="text-align:right">TZS ${Number(i.unitPrice).toLocaleString()}</td>
      <td style="text-align:right">TZS ${Number(i.subtotal ?? i.quantity * i.unitPrice).toLocaleString()}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>Receipt ${sale.invoiceNo}</title>
  <style>
    body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 16px; max-width: 320px; }
    h2 { text-align:center; font-size:14px; margin:0 0 4px; }
    p  { text-align:center; margin:2px 0; font-size:11px; color:#555; }
    hr { border:none; border-top:1px dashed #999; margin:8px 0; }
    table { width:100%; border-collapse:collapse; font-size:11px; }
    th { text-align:left; border-bottom:1px solid #ccc; padding:3px 2px; }
    td { padding:2px; }
    .total { font-weight:bold; font-size:13px; }
    .footer { text-align:center; font-size:10px; color:#888; margin-top:12px; }
  </style></head><body>
  <h2>IAA Inventory IMS</h2>
  <p>Group 86 — Institute of Accountancy Arusha</p>
  <hr/>
  <p><strong>Invoice:</strong> ${sale.invoiceNo}</p>
  <p><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleString()}</p>
  <p><strong>Customer:</strong> ${sale.customer?.name ?? 'Walk-in'}</p>
  <p><strong>Cashier:</strong> ${sale.user?.name ?? '—'}</p>
  <hr/>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Sub</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <hr/>
  <table><tr class="total"><td>TOTAL</td><td colspan="3" style="text-align:right">TZS ${Number(sale.totalAmount).toLocaleString()}</td></tr></table>
  <div class="footer">Thank you for your purchase!</div>
  </body></html>`;

  const win = window.open('', '_blank', 'width=380,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}
