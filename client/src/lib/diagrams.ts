import jsPDF from 'jspdf';

// ── shared palette ────────────────────────────────────────────────────────────
const BG    : [number,number,number] = [8,  13, 32];
const CARD  : [number,number,number] = [18, 26, 58];
const ACC   : [number,number,number] = [59,130,246];
const ACC2  : [number,number,number] = [99,102,241];
const GREEN : [number,number,number] = [16,185,129];
const ORG   : [number,number,number] = [245,158, 11];
const ROSE  : [number,number,number] = [239, 68, 68];
const VIO   : [number,number,number] = [139, 92,246];
const WHITE : [number,number,number] = [255,255,255];
const MUTED : [number,number,number] = [150,160,190];
const DIV   : [number,number,number] = [40, 52, 90];

function pageSetup(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BG); doc.rect(0,0,W,H,'F');
}

function title(doc: jsPDF, text: string, sub: string) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ACC); doc.rect(0,0,W,3,'F');
  doc.setFillColor(18,26,58); doc.rect(0,3,W,40,'F');
  doc.setFontSize(20); doc.setFont('helvetica','bold');
  doc.setTextColor(...WHITE); doc.text(text, W/2, 22, {align:'center'});
  doc.setFontSize(10); doc.setFont('helvetica','normal');
  doc.setTextColor(...MUTED); doc.text(sub, W/2, 32, {align:'center'});
  doc.setDrawColor(...DIV); doc.setLineWidth(0.4);
  doc.line(14, 43, W-14, 43);
}

function footer(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BG); doc.rect(0,H-12,W,12,'F');
  doc.setDrawColor(...DIV); doc.line(14,H-12,W-14,H-12);
  doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text('IAA Inventory IMS — Group 86', W/2, H-4, {align:'center'});
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, H-4);
}

// ── drawing helpers ───────────────────────────────────────────────────────────
function box(doc: jsPDF, x:number, y:number, w:number, h:number,
  fill:[number,number,number], label:string, sublabel='', textColor:[number,number,number]=WHITE) {
  doc.setFillColor(...fill); doc.roundedRect(x,y,w,h,3,3,'F');
  doc.setDrawColor(...ACC); doc.setLineWidth(0.5); doc.roundedRect(x,y,w,h,3,3,'S');
  doc.setTextColor(...textColor); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text(label, x+w/2, sublabel ? y+h/2-2 : y+h/2+1, {align:'center', maxWidth: w-4});
  if (sublabel) {
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(sublabel, x+w/2, y+h/2+5, {align:'center', maxWidth: w-4});
  }
}

function arrow(doc: jsPDF, x1:number,y1:number, x2:number,y2:number,
  label='', color:[number,number,number]=MUTED) {
  doc.setDrawColor(...color); doc.setLineWidth(0.6);
  doc.line(x1,y1,x2,y2);
  // arrowhead
  const angle = Math.atan2(y2-y1, x2-x1);
  const s = 4;
  doc.line(x2,y2, x2-s*Math.cos(angle-0.5), y2-s*Math.sin(angle-0.5));
  doc.line(x2,y2, x2-s*Math.cos(angle+0.5), y2-s*Math.sin(angle+0.5));
  if (label) {
    const mx=(x1+x2)/2, my=(y1+y2)/2;
    doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.setFont('helvetica','normal');
    doc.text(label,mx,my-2,{align:'center'});
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. USE CASE DIAGRAM
// ════════════════════════════════════════════════════════════════════════════
export function generateUseCaseDiagram() {
  const doc = new jsPDF({unit:'mm', format:'a3', orientation:'landscape'});
  const W = doc.internal.pageSize.getWidth();
  pageSetup(doc);
  title(doc,'Use Case Diagram','IAA Inventory Management System — Actor & Use Case Relationships');

  // System boundary
  doc.setDrawColor(...ACC); doc.setLineWidth(1);
  doc.setFillColor(14,20,45);
  doc.roundedRect(70,50,W-140,175,6,6,'FD');
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...ACC);
  doc.text('«system»  IAA Inventory IMS', W/2, 58, {align:'center'});

  // Use case ellipses — helper
  const uc = (x:number,y:number,w:number,h:number,label:string, color:[number,number,number]=CARD) => {
    doc.setFillColor(...color); doc.setDrawColor(...ACC); doc.setLineWidth(0.5);
    doc.ellipse(x,y,w,h,'FD');
    doc.setTextColor(...WHITE); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.text(label,x,y+1,{align:'center', maxWidth: w*2-4});
  };

  // Actor — stick figure helper
  const actor = (x:number,y:number,label:string, color:[number,number,number]=ACC) => {
    doc.setDrawColor(...color); doc.setLineWidth(0.8);
    doc.circle(x,y,4,'S');           // head
    doc.line(x,y+4,x,y+14);         // body
    doc.line(x-6,y+8,x+6,y+8);      // arms
    doc.line(x,y+14,x-5,y+22);      // left leg
    doc.line(x,y+14,x+5,y+22);      // right leg
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...WHITE);
    doc.text(label,x,y+28,{align:'center'});
  };

  // Actors
  actor(22, 65,'Admin',    ROSE);
  actor(22,115,'Manager',  ORG);
  actor(22,165,'Staff',    GREEN);
  actor(W-22,80,'Customer',VIO);

  // Use cases — column 1 (auth & products)
  uc(120, 72, 28,6, 'Login / Logout');
  uc(120, 88, 28,6, 'Manage Products');
  uc(120,104, 28,6, 'Manage Categories');
  uc(120,120, 28,6, 'Manage Brands');
  uc(120,136, 28,6, 'Manage Suppliers');
  uc(120,152, 28,6, 'Manage Customers');
  uc(120,168, 28,6, 'Manage Users');
  uc(120,184, 28,6, 'View Dashboard');

  // Use cases — column 2 (transactions)
  uc(210, 72, 28,6, 'Record Sale (POS)');
  uc(210, 88, 28,6, 'View Order History');
  uc(210,104, 28,6, 'Print/PDF Receipt');
  uc(210,120, 28,6, 'Create Purchase Order');
  uc(210,136, 28,6, 'View Purchase History');
  uc(210,152, 28,6, 'Download PO Receipt');

  // Use cases — column 3 (reports)
  uc(300, 82, 30,6, 'View Sales Report');
  uc(300, 98, 30,6, 'View Purchases Report');
  uc(300,114, 30,6, 'View Stock Report');
  uc(300,130, 30,6, 'Export CSV / PDF');
  uc(300,150, 30,6, 'View System Diagrams');
  uc(300,166, 30,6, 'System Settings');

  // Lines — Admin (all)
  const adminX = 32;
  [72,88,104,120,136,152,168,184].forEach(y => doc.line(adminX,y+8,92,y));
  [72,88,104,120,136,152].forEach(y => doc.line(adminX,y+8,182,y));
  [82,98,114,130,150,166].forEach(y => doc.line(adminX,y+8,270,y));

  // Lines — Manager (no manage users, no settings)
  const manX = 32;
  [88,104,120,136,152,184].forEach(y => doc.line(manX,y+8,92,y));
  [72,88,104,120,136,152].forEach(y => doc.line(manX,y+8,182,y));
  [82,98,114,130].forEach(y => doc.line(manX,y+8,270,y));

  // Lines — Staff
  [72,184].forEach(y => doc.line(32,165+8,92,y));
  doc.line(32,165+8,182,72);  // record sale
  doc.line(32,165+8,182,88);  // order history
  doc.line(32,165+8,182,104); // print receipt

  // Customer line
  doc.line(W-32,80+8,182+28,88); // view order history

  // legend
  doc.setFillColor(...ROSE); doc.circle(16,215,3,'F');
  doc.setFillColor(...ORG);  doc.circle(16,222,3,'F');
  doc.setFillColor(...GREEN);doc.circle(16,229,3,'F');
  doc.setFontSize(7.5); doc.setTextColor(...MUTED);
  doc.text('Admin — full access',22,216);
  doc.text('Manager — no user management',22,223);
  doc.text('Staff — sales only',22,230);

  footer(doc);
  doc.save('use-case-diagram.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// 2. ENTITY RELATIONSHIP DIAGRAM (ERD)
// ════════════════════════════════════════════════════════════════════════════
export function generateERDiagram() {
  const doc = new jsPDF({unit:'mm', format:'a3', orientation:'landscape'});
  pageSetup(doc);
  title(doc,'Entity Relationship Diagram (ERD)','Database entities, attributes and relationships');

  // entity box helper: returns {x,y,w,h}
  const entity = (x:number,y:number,w:number,name:string,
    attrs:string[], color:[number,number,number]=CARD) => {
    const rowH = 7; const headH = 11;
    const h = headH + attrs.length * rowH + 3;
    // header
    doc.setFillColor(...color); doc.roundedRect(x,y,w,headH,3,3,'F');
    doc.setDrawColor(...ACC); doc.setLineWidth(0.6); doc.roundedRect(x,y,w,h,3,3,'S');
    doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(name, x+w/2, y+8, {align:'center'});
    // body
    doc.setFillColor(18,26,58); doc.rect(x,y+headH,w,h-headH,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    attrs.forEach((a,i)=>{
      const ay = y+headH+5+i*rowH;
      const isPK = a.startsWith('PK ');
      const isFK = a.startsWith('FK ');
      if (isPK) doc.setTextColor(...ORG);
      else if (isFK) doc.setTextColor(...VIO);
      else doc.setTextColor(...MUTED);
      doc.text((isPK||isFK) ? a : '  '+a, x+3, ay);
      if (i<attrs.length-1){
        doc.setDrawColor(...DIV); doc.setLineWidth(0.2);
        doc.line(x,ay+2,x+w,ay+2);
      }
    });
    return {x,y,w,h};
  };

  // relationship line
  const rel = (x1:number,y1:number,x2:number,y2:number,label:string,card='1:N') => {
    doc.setDrawColor(...ACC); doc.setLineWidth(0.5);
    doc.line(x1,y1,x2,y2);
    const mx=(x1+x2)/2, my=(y1+y2)/2;
    doc.setFillColor(...CARD); doc.setDrawColor(...ACC);
    doc.roundedRect(mx-8,my-4,16,7,2,2,'FD');
    doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(...GREEN);
    doc.text(card,mx,my+1,{align:'center'});
    doc.setFontSize(6); doc.setTextColor(...MUTED); doc.setFont('helvetica','normal');
    doc.text(label,mx,my+8,{align:'center'});
  };

  // Entities — positions chosen to avoid overlap
  const eUser = entity(14,52,52,'USER',['PK id: uuid','  name: string','  email: string (unique)','  password: hash','  role: ADMIN|MANAGER|STAFF','  createdAt','  updatedAt'],[30,40,90]);
  const eCat  = entity(14,145,52,'CATEGORY',['PK id: uuid','  name: string (unique)','  description?','  createdAt','  updatedAt'],[30,90,40]);
  const eBrand= entity(82,145,52,'BRAND',['PK id: uuid','  name: string (unique)','  description?','  createdAt','  updatedAt'],[90,40,30]);
  const eSupp = entity(150,145,58,'SUPPLIER',['PK id: uuid','  name','  email?','  phone?','  address?','  createdAt','  updatedAt'],[139,92,246]);
  const eProd = entity(82,52,58,'PRODUCT',['PK id: uuid','  name, sku (unique)','  price, costPrice','  quantity, minStock','  status, productType','FK categoryId','FK brandId?','FK supplierId?','  createdAt'],[59,130,246]);
  const eCust = entity(228,52,52,'CUSTOMER',['PK id: uuid','  name','  email? (unique)','  phone?','  address?','  createdAt'],[16,185,129]);
  const eSale = entity(228,130,58,'SALE',['PK id: uuid','  invoiceNo (unique)','  totalAmount','  status','FK userId','FK customerId?','  createdAt'],[245,158,11]);
  const eSItem= entity(228,210,52,'SALE_ITEM',['PK id: uuid','FK saleId','FK productId','  quantity','  unitPrice','  subtotal'],[200,120,10]);
  const ePurch= entity(82,210,58,'PURCHASE',['PK id: uuid','  referenceNo (unique)','  totalAmount','  status','FK supplierId','FK userId','  createdAt'],[139,92,246]);
  const ePItem= entity(150,210,55,'PURCHASE_ITEM',['PK id: uuid','FK purchaseId','FK productId','  quantity','  unitCost','  subtotal'],[100,70,200]);

  // Relationships
  // User → Sale (1:N)
  rel(eUser.x+eUser.w, eUser.y+eUser.h/2, eSale.x, eSale.y+eSale.h/2,'records','1:N');
  // User → Purchase (1:N)
  rel(eUser.x+eUser.w/2, eUser.y+eUser.h, ePurch.x+ePurch.w/2, ePurch.y,'creates','1:N');
  // Customer → Sale (1:N)
  rel(eCust.x+eCust.w/2, eCust.y+eCust.h, eSale.x+eSale.w/2, eSale.y,'places','0:N');
  // Sale → SaleItem (1:N)
  rel(eSale.x+eSale.w/2, eSale.y+eSale.h, eSItem.x+eSItem.w/2, eSItem.y,'contains','1:N');
  // Product → SaleItem
  rel(eProd.x+eProd.w, eProd.y+eProd.h/2, eSItem.x, eSItem.y+eSItem.h/2,'in','1:N');
  // Category → Product (1:N)
  rel(eCat.x+eCat.w/2, eCat.y, eProd.x+eProd.w/2-10, eProd.y+eProd.h,'classifies','1:N');
  // Brand → Product
  rel(eBrand.x+eBrand.w/2, eBrand.y, eProd.x+eProd.w/2+10, eProd.y+eProd.h,'brands','0:N');
  // Supplier → Product
  rel(eSupp.x+eSupp.w/2, eSupp.y, eProd.x+eProd.w, eProd.y+eProd.h,'supplies','0:N');
  // Supplier → Purchase
  rel(eSupp.x+eSupp.w/2, eSupp.y+eSupp.h, ePurch.x+ePurch.w, ePurch.y+ePurch.h/2,'fulfils','1:N');
  // Purchase → PurchaseItem
  rel(ePurch.x+ePurch.w, ePurch.y+ePurch.h/2, ePItem.x, ePItem.y+ePItem.h/2,'has','1:N');
  // Product → PurchaseItem
  rel(eProd.x+eProd.w/2, eProd.y+eProd.h, ePItem.x+ePItem.w/2, ePItem.y,'in','1:N');

  // Legend
  doc.setFontSize(7.5); doc.setTextColor(...ORG);  doc.text('PK = Primary Key', 14, 235);
  doc.setTextColor(...VIO); doc.text('FK = Foreign Key', 14, 241);
  doc.setTextColor(...MUTED); doc.text('? = nullable field', 14, 247);

  footer(doc);
  doc.save('erd-diagram.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// 3. SYSTEM FLOWCHART
// ════════════════════════════════════════════════════════════════════════════
export function generateFlowchart() {
  const doc = new jsPDF({unit:'mm', format:'a3', orientation:'portrait'});
  const W = doc.internal.pageSize.getWidth();
  pageSetup(doc);
  title(doc,'System Flowchart','End-to-end process flow: Login → Sales → Reporting');

  // flow helpers
  const rect  = (x:number,y:number,w:number,h:number,label:string,color:[number,number,number]=CARD) =>
    box(doc,x,y,w,h,color,label);
  const round = (x:number,y:number,w:number,h:number,label:string,color:[number,number,number]=ACC2) => {
    doc.setFillColor(...color); doc.roundedRect(x,y,w,h,h/2,h/2,'F');
    doc.setDrawColor(...ACC); doc.setLineWidth(0.5); doc.roundedRect(x,y,w,h,h/2,h/2,'S');
    doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    doc.text(label,x+w/2,y+h/2+1.5,{align:'center'});
  };
  const dec   = (cx:number,cy:number,hw:number,hh:number,label:string,color:[number,number,number]=ORG) => {
    doc.setFillColor(...color); doc.setDrawColor(...ACC); doc.setLineWidth(0.5);
    doc.line(cx,cy-hh, cx+hw,cy);
    doc.line(cx+hw,cy, cx,cy+hh);
    doc.line(cx,cy+hh, cx-hw,cy);
    doc.line(cx-hw,cy, cx,cy-hh);
    doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
    doc.text(label,cx,cy+1.5,{align:'center'});
  };
  const ln = (x1:number,y1:number,x2:number,y2:number,lbl='') =>
    arrow(doc,x1,y1,x2,y2,lbl,MUTED);
  const cx = W/2;

  // ── Flow 1: Authentication ──────────────────────
  round(cx-28,50,56,11,'START',GREEN);
  ln(cx,61,cx,72);
  rect(cx-32,72,64,12,'User visits app');
  ln(cx,84,cx,96);
  dec(cx,103,30,9,'Logged in?');
  doc.setFontSize(7); doc.setTextColor(...GREEN); doc.text('YES',cx+32,104);
  doc.setTextColor(...ROSE);  doc.text('NO', cx-32,104);
  // NO branch
  ln(cx-30,103,cx-65,103); ln(cx-65,103,cx-65,115);
  rect(cx-97,115,64,12,'Show Login Page');
  ln(cx-65,127,cx-65,139);
  dec(cx-65,146,30,9,'Valid Credentials?');
  doc.setFontSize(7); doc.setTextColor(...ROSE); doc.text('NO',cx-65+32,147);
  ln(cx-65+30,146,cx-65+30,160); ln(cx-65+30,160,cx-65-10,160); ln(cx-65-10,160,cx-65-10,127);
  doc.setTextColor(...GREEN); doc.text('YES',cx-65,146+11);
  ln(cx-65,155,cx-65,167);
  rect(cx-97,167,64,12,'Issue JWT Token');
  ln(cx-65,179,cx-65,191); ln(cx-65,191,cx,191);

  // YES branch
  ln(cx+30,103,cx,191);

  // ── Flow 2: Main App ────────────────────────────
  ln(cx,191,cx,203);
  rect(cx-36,203,72,12,'Load Dashboard',CARD);
  ln(cx,215,cx,227);
  dec(cx,234,36,9,'Select Module');
  // branches
  const modules = [
    {label:'POS/Sales',   x:cx-110},
    {label:'Purchases',   x:cx-55},
    {label:'Products',    x:cx},
    {label:'Reports',     x:cx+55},
  ];
  modules.forEach(m=>{
    ln(cx,243, m.x, 255);
    rect(m.x-27,255,54,11,m.label,CARD);
  });

  // POS branch detail
  ln(cx-110,266, cx-110, 278);
  rect(cx-137,278,54,11,'Add Items to Cart');
  ln(cx-110,289, cx-110,301);
  dec(cx-110,308,27,9,'Confirm?');
  doc.setFontSize(7); doc.setTextColor(...GREEN); doc.text('YES',cx-110,319);
  ln(cx-110,317,cx-110,329);
  rect(cx-137,329,54,11,'Record Sale + Stock↓',GREEN);
  ln(cx-110,340,cx-110,352);
  rect(cx-137,352,54,11,'Show Receipt',ACC);
  doc.setTextColor(...ROSE); doc.text('NO',cx-110+29,309);
  ln(cx-110+27,308,cx-70,308); ln(cx-70,308,cx-70,278); ln(cx-70,278,cx-84,278);

  // Reports branch detail
  ln(cx+55,266,cx+55,278);
  rect(cx+28,278,54,11,'Select Report Type');
  ln(cx+55,289,cx+55,301);
  rect(cx+28,301,54,11,'Apply Date Range');
  ln(cx+55,312,cx+55,324);
  rect(cx+28,324,54,11,'View Analytics');
  ln(cx+55,335,cx+55,347);
  rect(cx+28,347,54,11,'Export CSV / PDF',ACC2);

  // END
  ln(cx,266,cx,380);
  round(cx-28,380,56,11,'END',ROSE);

  footer(doc);
  doc.save('flowchart.pdf');
}

// ════════════════════════════════════════════════════════════════════════════
// 4. DATABASE DESIGN DOCUMENT
// ════════════════════════════════════════════════════════════════════════════
export function generateDatabaseDesign() {
  const doc = new jsPDF({unit:'mm', format:'a4', orientation:'portrait'});
  const W = doc.internal.pageSize.getWidth();
  const PH= doc.internal.pageSize.getHeight();
  pageSetup(doc);
  title(doc,'Database Design Document','Full schema specification — PostgreSQL via Prisma ORM');

  let y = 50;

  // section helper
  const section = (label:string) => {
    if (y > PH-30) { footer(doc); doc.addPage(); pageSetup(doc); y=16; }
    doc.setFillColor(...ACC); doc.rect(14,y,W-28,8,'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(label, 17, y+6);
    y += 12;
  };

  // table spec helper
  const tableSpec = (name:string, desc:string,
    cols:{col:string,type:string,notes:string}[]) => {
    if (y > PH-40) { footer(doc); doc.addPage(); pageSetup(doc); y=16; }
    // table header
    doc.setFillColor(...CARD); doc.roundedRect(14,y,W-28,10,2,2,'F');
    doc.setDrawColor(...ACC2); doc.setLineWidth(0.5); doc.roundedRect(14,y,W-28,10,2,2,'S');
    doc.setTextColor(...ACC); doc.setFont('helvetica','bold'); doc.setFontSize(9.5);
    doc.text(`Table: ${name}`, 18, y+7);
    doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.setFont('helvetica','normal');
    doc.text(desc, W-16, y+7, {align:'right'});
    y += 13;
    // column headers
    const cw = [38,40,40,W-28-118];
    const heads = ['Column','Type','Constraint','Notes'];
    doc.setFillColor(30,42,80);
    doc.rect(14,y,W-28,7,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
    let hx = 16;
    heads.forEach((h,i)=>{ doc.text(h,hx,y+5); hx+=cw[i]; });
    y += 7;
    // rows
    cols.forEach((c,i)=>{
      if (y > PH-16) { footer(doc); doc.addPage(); pageSetup(doc); y=16; }
      doc.setFillColor(i%2===0?18:22, i%2===0?26:32, i%2===0?58:68);
      doc.rect(14,y,W-28,7,'F');
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      const isPK = c.notes.includes('PK');
      const isFK = c.notes.includes('FK');
      doc.setTextColor(isPK ? ORG[0] : isFK ? VIO[0] : WHITE[0],
                       isPK ? ORG[1] : isFK ? VIO[1] : WHITE[1],
                       isPK ? ORG[2] : isFK ? VIO[2] : WHITE[2]);
      doc.text(c.col,  16,    y+5);
      doc.setTextColor(...GREEN); doc.text(c.type, 16+cw[0],  y+5);
      doc.setTextColor(...MUTED); doc.text(c.notes,16+cw[0]+cw[1], y+5);
      doc.setTextColor(...MUTED); doc.text(c.col.startsWith('//') ? '' : desc,
        16+cw[0]+cw[1]+cw[2], y+5, {maxWidth:cw[3]-4});
      y += 7;
    });
    y += 6;
  };

  // ── Overview ──────────────────────────────────────
  section('1. Overview');
  const overviewLines = [
    'Database: PostgreSQL (hosted on Supabase)',
    'ORM: Prisma v5 with auto-generated client',
    'Tables: users, categories, brands, suppliers, products,',
    '        customers, sales, sale_items, purchases, purchase_items',
    'Enums:  Role, SaleStatus, PurchaseStatus, ProductType, ProductStatus',
    'All primary keys are UUID (uuid_generate_v4)',
    'All tables have createdAt and updatedAt timestamps',
  ];
  doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
  overviewLines.forEach(l => { doc.text(l, 16, y); y+=7; });
  y += 4;

  // ── Tables ───────────────────────────────────────
  section('2. Table Specifications');

  tableSpec('users','Stores system users (staff, managers, admins)',[
    {col:'id',        type:'UUID',       notes:'PK, default uuid()'},
    {col:'name',      type:'VARCHAR',    notes:'NOT NULL'},
    {col:'email',     type:'VARCHAR',    notes:'UNIQUE, NOT NULL'},
    {col:'password',  type:'VARCHAR',    notes:'bcrypt hashed, NOT NULL'},
    {col:'role',      type:'Role enum',  notes:'DEFAULT STAFF'},
    {col:'createdAt', type:'TIMESTAMP',  notes:'DEFAULT now()'},
    {col:'updatedAt', type:'TIMESTAMP',  notes:'auto-updated'},
  ]);

  tableSpec('categories','Product classification groups',[
    {col:'id',         type:'UUID',    notes:'PK'},
    {col:'name',       type:'VARCHAR', notes:'UNIQUE, NOT NULL'},
    {col:'description',type:'TEXT',    notes:'nullable'},
    {col:'createdAt',  type:'TIMESTAMP',notes:'DEFAULT now()'},
    {col:'updatedAt',  type:'TIMESTAMP',notes:'auto-updated'},
  ]);

  tableSpec('brands','Product brand master',[
    {col:'id',         type:'UUID',    notes:'PK'},
    {col:'name',       type:'VARCHAR', notes:'UNIQUE, NOT NULL'},
    {col:'description',type:'TEXT',    notes:'nullable'},
    {col:'createdAt',  type:'TIMESTAMP',notes:'DEFAULT now()'},
    {col:'updatedAt',  type:'TIMESTAMP',notes:'auto-updated'},
  ]);

  tableSpec('suppliers','Vendor/supplier master',[
    {col:'id',       type:'UUID',      notes:'PK'},
    {col:'name',     type:'VARCHAR',   notes:'NOT NULL'},
    {col:'email',    type:'VARCHAR',   notes:'nullable'},
    {col:'phone',    type:'VARCHAR',   notes:'nullable'},
    {col:'address',  type:'TEXT',      notes:'nullable'},
    {col:'createdAt',type:'TIMESTAMP', notes:'DEFAULT now()'},
    {col:'updatedAt',type:'TIMESTAMP', notes:'auto-updated'},
  ]);

  tableSpec('products','Central product/inventory catalogue',[
    {col:'id',           type:'UUID',          notes:'PK'},
    {col:'name',         type:'VARCHAR',        notes:'NOT NULL'},
    {col:'sku',          type:'VARCHAR',        notes:'UNIQUE, NOT NULL'},
    {col:'barcode',      type:'VARCHAR',        notes:'UNIQUE, nullable'},
    {col:'price',        type:'DECIMAL(10,2)',  notes:'NOT NULL'},
    {col:'costPrice',    type:'DECIMAL(10,2)',  notes:'NOT NULL'},
    {col:'quantity',     type:'INTEGER',        notes:'DEFAULT 0'},
    {col:'minStock',     type:'INTEGER',        notes:'DEFAULT 10'},
    {col:'status',       type:'ProductStatus',  notes:'DEFAULT ACTIVE'},
    {col:'productType',  type:'ProductType',    notes:'DEFAULT PHYSICAL'},
    {col:'categoryId',   type:'UUID',           notes:'FK → categories.id'},
    {col:'brandId',      type:'UUID',           notes:'FK → brands.id, nullable'},
    {col:'supplierId',   type:'UUID',           notes:'FK → suppliers.id, nullable'},
    {col:'createdAt',    type:'TIMESTAMP',      notes:'DEFAULT now()'},
    {col:'updatedAt',    type:'TIMESTAMP',      notes:'auto-updated'},
  ]);

  tableSpec('customers','End-customer master',[
    {col:'id',       type:'UUID',      notes:'PK'},
    {col:'name',     type:'VARCHAR',   notes:'NOT NULL'},
    {col:'email',    type:'VARCHAR',   notes:'UNIQUE, nullable'},
    {col:'phone',    type:'VARCHAR',   notes:'nullable'},
    {col:'address',  type:'TEXT',      notes:'nullable'},
    {col:'createdAt',type:'TIMESTAMP', notes:'DEFAULT now()'},
  ]);

  tableSpec('sales','Sales transaction header',[
    {col:'id',          type:'UUID',         notes:'PK'},
    {col:'invoiceNo',   type:'VARCHAR',      notes:'UNIQUE, NOT NULL'},
    {col:'totalAmount', type:'DECIMAL(10,2)',notes:'NOT NULL'},
    {col:'status',      type:'SaleStatus',   notes:'DEFAULT COMPLETED'},
    {col:'userId',      type:'UUID',         notes:'FK → users.id'},
    {col:'customerId',  type:'UUID',         notes:'FK → customers.id, nullable'},
    {col:'createdAt',   type:'TIMESTAMP',    notes:'DEFAULT now()'},
  ]);

  tableSpec('sale_items','Line items for each sale',[
    {col:'id',        type:'UUID',         notes:'PK'},
    {col:'saleId',    type:'UUID',         notes:'FK → sales.id, CASCADE DELETE'},
    {col:'productId', type:'UUID',         notes:'FK → products.id'},
    {col:'quantity',  type:'INTEGER',      notes:'NOT NULL'},
    {col:'unitPrice', type:'DECIMAL(10,2)',notes:'NOT NULL'},
    {col:'subtotal',  type:'DECIMAL(10,2)',notes:'NOT NULL'},
  ]);

  tableSpec('purchases','Purchase order header',[
    {col:'id',          type:'UUID',         notes:'PK'},
    {col:'referenceNo', type:'VARCHAR',      notes:'UNIQUE, NOT NULL'},
    {col:'totalAmount', type:'DECIMAL(10,2)',notes:'NOT NULL'},
    {col:'status',      type:'PurchaseStatus',notes:'DEFAULT RECEIVED'},
    {col:'supplierId',  type:'UUID',         notes:'FK → suppliers.id'},
    {col:'userId',      type:'UUID',         notes:'FK → users.id'},
    {col:'createdAt',   type:'TIMESTAMP',    notes:'DEFAULT now()'},
  ]);

  tableSpec('purchase_items','Line items for each purchase order',[
    {col:'id',         type:'UUID',         notes:'PK'},
    {col:'purchaseId', type:'UUID',         notes:'FK → purchases.id, CASCADE DELETE'},
    {col:'productId',  type:'UUID',         notes:'FK → products.id'},
    {col:'quantity',   type:'INTEGER',      notes:'NOT NULL'},
    {col:'unitCost',   type:'DECIMAL(10,2)',notes:'NOT NULL'},
    {col:'subtotal',   type:'DECIMAL(10,2)',notes:'NOT NULL'},
  ]);

  section('3. Enumerations');
  const enums = [
    {name:'Role',          values:'ADMIN | MANAGER | STAFF'},
    {name:'SaleStatus',    values:'COMPLETED | PENDING | CANCELLED'},
    {name:'PurchaseStatus',values:'RECEIVED | PENDING | CANCELLED'},
    {name:'ProductType',   values:'PHYSICAL | DIGITAL | SERVICE | BUNDLE | VARIABLE'},
    {name:'ProductStatus', values:'ACTIVE | DRAFT | ARCHIVED | DISCONTINUED'},
  ];
  enums.forEach(e=>{
    doc.setFillColor(...CARD); doc.roundedRect(14,y,W-28,8,2,2,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...VIO);
    doc.text(e.name,18,y+6);
    doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
    doc.text(e.values, 62, y+6);
    y+=11;
  });

  section('4. Key Constraints & Indexes');
  const constraints = [
    'users.email — UNIQUE index',
    'categories.name — UNIQUE index',
    'brands.name — UNIQUE index',
    'products.sku — UNIQUE index',
    'products.barcode — UNIQUE index (nullable)',
    'customers.email — UNIQUE index (nullable)',
    'sales.invoiceNo — UNIQUE index',
    'purchases.referenceNo — UNIQUE index',
    'sale_items.saleId — CASCADE DELETE (when sale is deleted)',
    'purchase_items.purchaseId — CASCADE DELETE',
    'products.brandId — SET NULL on brand delete',
    'products.supplierId — SET NULL on supplier delete',
  ];
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...MUTED);
  constraints.forEach(c=>{ doc.text(`  • ${c}`,16,y); y+=7; });

  footer(doc);
  doc.save('database-design.pdf');
}
