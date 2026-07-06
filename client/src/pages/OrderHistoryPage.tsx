import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MagnifyingGlass, Receipt, TrendUp, Package, Calendar, Download, Printer,
} from '@phosphor-icons/react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { generateSaleReceipt, printReceiptHtml } from '@/lib/pdf';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => api.get('/sales').then(r => r.data),
  });

  const filtered = (sales as any[]).filter(s => {
    const matchSearch =
      s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.user?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = (sales as any[])
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  const statusBadge = (status: string) => {
    if (status === 'COMPLETED') return 'badge-success text-[10px] font-bold px-2.5 py-1 rounded-full';
    if (status === 'CANCELLED') return 'badge-danger text-[10px] font-bold px-2.5 py-1 rounded-full';
    return 'badge-warning text-[10px] font-bold px-2.5 py-1 rounded-full';
  };

  const statusLabel: Record<string, string> = {
    COMPLETED: 'Completed',
    PENDING: 'Pending',
    CANCELLED: 'Cancelled',
  };

  return (
    <div className="space-y-5">

      {/* page header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition font-medium"
        >
          <ArrowLeft size={20} weight="bold" /> Back to POS
        </button>
        <div className="h-4 w-px bg-white/10" />
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-400" /> Order History
          </h1>
          <p className="text-sm text-white/50 mt-0.5">All sales transactions</p>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass glass-blue rounded-2xl p-5 hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{(sales as any[]).length}</p>
          <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Total Orders</p>
        </div>
        <div className="glass glass-emerald rounded-2xl p-5 hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <TrendUp className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Total Revenue</p>
        </div>
        <div className="glass glass-violet rounded-2xl p-5 hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <Package className="h-5 w-5 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {(sales as any[]).filter(s => s.status === 'COMPLETED').length}
          </p>
          <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Completed</p>
        </div>
      </div>

      {/* filters */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by invoice, customer, cashier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-glass h-9 w-full rounded-xl pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
                statusFilter === s
                  ? 'btn-glow text-white'
                  : 'glass text-white/50 hover:text-white'
              )}
            >{s === 'ALL' ? 'All' : statusLabel[s]}</button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Transactions ({filtered.length})
          </h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Invoice #</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Date &amp; Time</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Items</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Total</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Cashier</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-16 text-white/25">
                      <Receipt size={48} weight="bold" className="mb-3 opacity-40" />
                      <p className="text-sm">No orders found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s: any) => (
                  <TableRow key={s.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="font-mono text-xs font-semibold text-blue-400">{s.invoiceNo}</span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{formatDate(s.createdAt)}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      {s.customer?.name || <span className="text-white/30 italic">Walk-in</span>}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="badge-neutral text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {s.items?.length} item{s.items?.length !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm font-bold text-emerald-400">
                      {formatCurrency(s.totalAmount)}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{s.user?.name}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className={statusBadge(s.status)}>
                        {statusLabel[s.status] ?? s.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-6">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => printReceiptHtml(s)}
                          title="Print Receipt"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 border border-white/8 transition-all"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => generateSaleReceipt(s)}
                          title="Download PDF"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-white/8 transition-all"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
