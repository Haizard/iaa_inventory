import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download, TrendingUp, ShoppingCart, Package, FileText, Calendar } from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import RoleGuard from '@/components/RoleGuard';
import { cn } from '@/lib/utils';
import { generateSalesReportPDF, generatePurchasesReportPDF, generateStockReportPDF } from '@/lib/pdf';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type ReportTab = 'sales' | 'purchases' | 'stock';

function exportCSV(filename: string, headers: string[], rows: any[][]) {
  const lines = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(12,18,45,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px',
    color: '#fff',
  },
};

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
  </div>
);

// ─────────────────────────────────────────────────
// Sales Report
// ─────────────────────────────────────────────────
function SalesReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-sales', from, to],
    queryFn: () => api.get('/reports/sales', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  });

  const handleExportCSV = () => {
    if (!data) return;
    exportCSV(
      `sales-report-${from}-${to}.csv`,
      ['Invoice No', 'Date', 'Customer', 'Recorded By', 'Total (TZS)', 'Status'],
      data.sales.map((s: any) => [s.invoiceNo, formatDate(s.createdAt), s.customer?.name || 'Walk-in', s.user?.name, Number(s.totalAmount), s.status])
    );
  };

  const handleExportPDF = () => {
    if (!data) return;
    generateSalesReportPDF(data, from, to);
  };

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const salesStatCards = [
    { label: 'Total Revenue',  value: formatCurrency(data.summary.totalRevenue),  icon: TrendingUp, glass: 'glass-emerald', bg: 'bg-emerald-500/20', color: 'text-emerald-400' },
    { label: 'Transactions',   value: data.summary.totalTransactions,              icon: FileText,   glass: 'glass-blue',    bg: 'bg-blue-500/20',    color: 'text-blue-400' },
    { label: 'Completed',      value: data.summary.completedCount,                icon: TrendingUp, glass: 'glass-violet',  bg: 'bg-violet-500/20',  color: 'text-violet-400' },
    { label: 'Cancelled',      value: data.summary.cancelledCount,                icon: TrendingUp, glass: 'glass-rose',    bg: 'bg-rose-500/20',    color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {salesStatCards.map((s) => (
          <div key={s.label} className={`glass ${s.glass} rounded-2xl p-5 hover-lift`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`h-11 w-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {data.chartData.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white/80 mb-1 text-sm">Revenue Over Time</h3>
          <p className="text-xs text-white/40 mb-4">Daily revenue in selected period</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickFormatter={(v) => formatDate(v)} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']} labelFormatter={(l) => formatDate(l)} {...tooltipStyle} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {data.chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={`url(#barGrad-${i})`} />
                ))}
                <defs>
                  <linearGradient id="barGradMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-white/80">Top Selling Products</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6 w-8">#</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Product</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Qty Sold</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topProducts.map((p: any, i: number) => (
                <TableRow key={p.sku} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <TableCell className="py-3 px-6 text-white/30 font-medium text-sm">{i + 1}</TableCell>
                  <TableCell className="py-3 px-6 text-white/70 text-sm">
                    <p className="font-semibold text-white/90">{p.name}</p>
                    <p className="text-xs text-white/30">{p.sku}</p>
                  </TableCell>
                  <TableCell className="py-3 px-6 text-white/70 text-sm">
                    <span className="badge-info text-[10px] font-bold px-2.5 py-1 rounded-full">{p.qty} units</span>
                  </TableCell>
                  <TableCell className="py-3 px-6 font-bold text-emerald-400 text-sm">{formatCurrency(p.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-white/80">Sales Transactions</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                <FileText className="h-3 w-3" /> PDF
              </button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Invoice</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Amount</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sales.slice(0, 10).map((s: any) => (
                <TableRow key={s.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <TableCell className="py-3 px-6 text-white/70 text-sm">
                    <p className="text-xs font-semibold text-blue-400">{s.invoiceNo}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{formatDate(s.createdAt)}</p>
                  </TableCell>
                  <TableCell className="py-3 px-6 text-white/70 text-sm">{s.customer?.name || <span className="italic text-white/30">Walk-in</span>}</TableCell>
                  <TableCell className="py-3 px-6 font-bold text-emerald-400 text-sm">{formatCurrency(s.totalAmount)}</TableCell>
                  <TableCell className="py-3 px-6 text-sm">
                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full',
                      s.status === 'COMPLETED' ? 'badge-success' :
                      s.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                    )}>{s.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Purchases Report
// ─────────────────────────────────────────────────
function PurchasesReport({ from, to }: { from: string; to: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-purchases', from, to],
    queryFn: () => api.get('/reports/purchases', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  });

  const handleExportCSV = () => {
    if (!data) return;
    exportCSV(
      `purchases-report-${from}-${to}.csv`,
      ['Reference', 'Date', 'Supplier', 'Total (TZS)', 'Status'],
      data.purchases.map((p: any) => [p.referenceNo, formatDate(p.createdAt), p.supplier?.name, Number(p.totalAmount), p.status])
    );
  };

  const handleExportPDF = () => {
    if (!data) return;
    generatePurchasesReportPDF(data, from, to);
  };

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const purchStatCards = [
    { label: 'Total Cost',   value: formatCurrency(data.summary.totalCost), glass: 'glass-orange',  bg: 'bg-orange-500/20', color: 'text-orange-400' },
    { label: 'Total Orders', value: data.summary.totalOrders,               glass: 'glass-blue',    bg: 'bg-blue-500/20',   color: 'text-blue-400' },
    { label: 'Received',     value: data.summary.receivedCount,             glass: 'glass-emerald', bg: 'bg-emerald-500/20',color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {purchStatCards.map((s) => (
          <div key={s.label} className={`glass ${s.glass} rounded-2xl p-5 hover-lift`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`h-11 w-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <ShoppingCart className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {data.bySupplier.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Cost by Supplier</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.bySupplier} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                  label={({ name, percent }) => `${name} ${((Number(percent ?? 0)) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}>
                  {data.bySupplier.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-white/80">Purchase Orders</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                <FileText className="h-3 w-3" /> PDF
              </button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Reference</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Supplier</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Amount</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.purchases.slice(0, 10).map((p: any) => (
                <TableRow key={p.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <TableCell className="py-3 px-6 text-white/70 text-sm">
                    <p className="text-xs font-semibold text-blue-400">{p.referenceNo}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{formatDate(p.createdAt)}</p>
                  </TableCell>
                  <TableCell className="py-3 px-6 text-white/70 text-sm">{p.supplier?.name}</TableCell>
                  <TableCell className="py-3 px-6 font-bold text-orange-400 text-sm">{formatCurrency(p.totalAmount)}</TableCell>
                  <TableCell className="py-3 px-6 text-sm">
                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full',
                      p.status === 'RECEIVED' ? 'badge-success' :
                      p.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                    )}>{p.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Stock Report
// ─────────────────────────────────────────────────
function StockReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-stock'],
    queryFn: () => api.get('/reports/stock').then((r) => r.data),
  });

  const handleExportCSV = () => {
    if (!data) return;
    exportCSV(
      'stock-report.csv',
      ['Name', 'SKU', 'Category', 'Qty', 'Min Stock', 'Cost Price', 'Sell Price', 'Stock Value', 'Status'],
      data.products.map((p: any) => [p.name, p.sku, p.category?.name, p.quantity, p.minStock,
        Number(p.costPrice), Number(p.price), Number(p.costPrice) * p.quantity,
        p.quantity === 0 ? 'OUT OF STOCK' : p.quantity <= p.minStock ? 'LOW STOCK' : 'OK'])
    );
  };

  const handleExportPDF = () => {
    if (!data) return;
    generateStockReportPDF(data);
  };

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const stockStatCards = [
    { label: 'Total Products', value: data.summary.totalProducts,                  glass: 'glass-blue',    bg: 'bg-blue-500/20',    color: 'text-blue-400' },
    { label: 'Low Stock',      value: data.summary.lowStock,                        glass: 'glass-amber',   bg: 'bg-amber-500/20',   color: 'text-amber-400' },
    { label: 'Out of Stock',   value: data.summary.outOfStock,                      glass: 'glass-rose',    bg: 'bg-rose-500/20',    color: 'text-rose-400' },
    { label: 'Stock Value',    value: formatCurrency(data.summary.totalStockValue),  glass: 'glass-emerald', bg: 'bg-emerald-500/20', color: 'text-emerald-400' },
    { label: 'Retail Value',   value: formatCurrency(data.summary.totalRetailValue), glass: 'glass-violet',  bg: 'bg-violet-500/20',  color: 'text-violet-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stockStatCards.map((s) => (
          <div key={s.label} className={`glass ${s.glass} rounded-2xl p-5 hover-lift`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`h-11 w-11 rounded-2xl ${s.bg} flex items-center justify-center`}>
                <Package className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-4">Value by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                {data.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} {...tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-semibold text-white/80">Stock List</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                <Download className="h-3 w-3" /> CSV
              </button>
              <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 h-7 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 border border-white/10 transition-all">
                <FileText className="h-3 w-3" /> PDF
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Product</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Category</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Qty</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Cost Value</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((p: any) => (
                  <TableRow key={p.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <p className="font-semibold text-white/90">{p.name}</p>
                      <p className="text-xs text-white/30">{p.sku}</p>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{p.category?.name}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{p.quantity} <span className="text-white/30 text-xs">{p.unit}</span></TableCell>
                    <TableCell className="py-3 px-6 font-semibold text-white/80 text-sm">{formatCurrency(Number(p.costPrice) * p.quantity)}</TableCell>
                    <TableCell className="py-3 px-6 text-sm">
                      <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full',
                        p.quantity === 0         ? 'badge-danger' :
                        p.quantity <= p.minStock ? 'badge-warning' : 'badge-success'
                      )}>
                        {p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStock ? 'Low Stock' : 'OK'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Reports Page
// ─────────────────────────────────────────────────
export default function ReportsPage() {
  const { canViewReports, role } = usePermissions();
  const [tab, setTab] = useState<ReportTab>('sales');
  const today       = new Date().toISOString().split('T')[0];
  const firstOfYear = `${new Date().getFullYear()}-01-01`;
  const [from, setFrom] = useState(firstOfYear);
  const [to,   setTo]   = useState(today);

  const tabs: { key: ReportTab; label: string; icon: React.ElementType }[] = [
    { key: 'sales',     label: 'Sales Report',     icon: TrendingUp },
    ...(role !== 'STAFF' ? [{ key: 'purchases' as ReportTab, label: 'Purchases Report', icon: ShoppingCart }] : []),
    { key: 'stock',     label: 'Stock Report',     icon: Package },
  ];

  return (
    <RoleGuard allowed={canViewReports} message="Reports are only available to Managers and Admins.">
      <div className="space-y-6">

        {/* header */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 rounded-xl p-2.5">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-sm text-white/50 mt-0.5">Analytics and exportable reports</p>
          </div>
        </div>

        {/* tab bar */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold transition-all',
                tab === key
                  ? 'btn-glow text-white'
                  : 'glass text-white/50 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* date range filter */}
        {tab !== 'stock' && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 flex items-center gap-1 block">
                  <Calendar className="h-3 w-3" /> From
                </label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="input-glass h-10 w-40 rounded-xl px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 flex items-center gap-1 block">
                  <Calendar className="h-3 w-3" /> To
                </label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="input-glass h-10 w-40 rounded-xl px-3 text-sm" />
              </div>
              <div className="flex gap-2 pb-0.5">
                {[
                  { label: 'This Month',   fn: () => { const n = new Date(); setFrom(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`); setTo(today); } },
                  { label: 'This Year',    fn: () => { setFrom(firstOfYear); setTo(today); } },
                  { label: 'Last 30 Days', fn: () => { const d = new Date(); d.setDate(d.getDate()-30); setFrom(d.toISOString().split('T')[0]); setTo(today); } },
                ].map((p) => (
                  <button key={p.label} onClick={p.fn}
                    className="px-3 h-10 rounded-xl text-xs font-semibold text-white/50 hover:text-white glass hover:bg-white/10 transition-all">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* report content */}
        {tab === 'sales'     && <SalesReport     from={from} to={to} />}
        {tab === 'purchases' && <PurchasesReport from={from} to={to} />}
        {tab === 'stock'     && <StockReport />}
      </div>
    </RoleGuard>
  );
}
