import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, ShoppingCart, TrendUp, Users, Warning, ShieldCheck, ArrowUp } from '@phosphor-icons/react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

/* ── reusable glass card ── */
const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('glass rounded-2xl', className)}>{children}</div>
);

/* ── stat card ── */
const StatCard = ({ title, value, sub, icon: Icon, glassClass, iconBg, iconColor, trend }: any) => (
  <div className={cn('glass rounded-2xl p-5 hover-lift', glassClass)}>
    <div className="flex items-start justify-between mb-4">
      <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center', iconBg)}>
        <Icon size={24} weight="bold" className={cn(iconColor)} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
          <ArrowUp size={14} weight="bold" />{trend}
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
    {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    <p className="text-xs font-medium text-white/50 mt-2 uppercase tracking-widest">{title}</p>
  </div>
);

export default function DashboardPage() {
  const { dashboardLevel, canViewPurchases, canViewReports, role } = usePermissions();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });
  const { data: chartData } = useQuery({
    queryKey: ['sales-chart'],
    queryFn: () => api.get('/dashboard/sales-chart').then((r) => r.data),
    enabled: canViewReports,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
    </div>
  );

  const roleBadge: Record<string, string> = {
    ADMIN:   'glass-rose   text-rose-300',
    MANAGER: 'glass-blue   text-blue-300',
    STAFF:   'glass-emerald text-emerald-300',
  };

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ── */}
      <div className="glass rounded-2xl p-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.12))', borderColor: 'rgba(99,102,241,0.25)' }}>
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">Good day</p>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm text-white/50 mt-1.5">Here's what's happening in your inventory today.</p>
        </div>
        <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm', roleBadge[role])}>
          <ShieldCheck size={16} weight="bold" />{role}
        </div>
      </div>

      {/* ══ STAFF view ══ */}
      {dashboardLevel === 'limited' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Record Sales', desc: 'As staff, you can record sales transactions for customers.', accentClass: 'glass-blue', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', icon: TrendUp,
                steps: ['Go to POS / Sales in the sidebar','Tap a product to add it to cart','Set quantity and payment method','Hit Charge to complete the sale'] },
              { title: 'View Inventory', desc: 'Browse products, categories, suppliers and customers.', accentClass: 'glass-emerald', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', icon: Package,
                steps: ['View available products & stock levels','Check product categories','View supplier information','Browse customer records'] },
            ].map((c) => (
              <div key={c.title} className={cn('glass rounded-2xl p-5 hover-lift', c.accentClass)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c.iconBg)}>
                    <c.icon size={22} weight="bold" className={cn(c.iconColor)} />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{c.title}</h3>
                </div>
                <p className="text-xs text-white/50 mb-3">{c.desc}</p>
                <ul className="space-y-1.5">
                  {c.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                      <span className="h-4 w-4 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i+1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Total Products',  value: stats?.totalProducts ?? 0,              icon: Package,       glassClass: 'glass-blue',   iconBg: 'bg-blue-500/20',   iconColor: 'text-blue-400' },
                { label: 'Low Stock Items', value: stats?.lowStockProducts?.length ?? 0,   icon: Warning, glassClass: 'glass-amber',  iconBg: 'bg-amber-500/20',  iconColor: 'text-amber-400' },
              { label: 'Customers',       value: stats?.totalSuppliers ?? 0,             icon: Users,         glassClass: 'glass-violet', iconBg: 'bg-violet-500/20', iconColor: 'text-violet-400' },
            ].map((c) => (
              <StatCard key={c.label} title={c.label} value={c.value} icon={c.icon}
                glassClass={c.glassClass} iconBg={c.iconBg} iconColor={c.iconColor} />
            ))}
          </div>
        </>
      )}

      {/* ══ ADMIN / MANAGER view ══ */}
      {dashboardLevel === 'full' && (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Products',   value: stats?.totalProducts ?? 0,                                     sub: null,                                            icon: Package,       glassClass: 'glass-blue',   iconBg: 'bg-blue-500/20',   iconColor: 'text-blue-300' },
              { title: 'Total Revenue',    value: formatCurrency(stats?.totalSalesAmount ?? 0),                  sub: `${stats?.totalSalesCount ?? 0} transactions`,   icon: TrendUp,    glassClass: 'glass-emerald',iconBg: 'bg-emerald-500/20',iconColor: 'text-emerald-300' },
              ...(canViewPurchases ? [
              { title: 'Total Purchases',  value: formatCurrency(stats?.totalPurchasesAmount ?? 0),              sub: `${stats?.totalPurchasesCount ?? 0} orders`,     icon: ShoppingCart,  glassClass: 'glass-orange', iconBg: 'bg-orange-500/20', iconColor: 'text-orange-300' },
              ] : []),
              { title: 'Suppliers',        value: stats?.totalSuppliers ?? 0,                                    sub: null,                                            icon: Users,         glassClass: 'glass-violet', iconBg: 'bg-violet-500/20', iconColor: 'text-violet-300' },
            ].map((c) => (
              <StatCard key={c.title} {...c} />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales Chart */}
            <GlassCard className="p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-white text-sm">Sales — Last 7 Days</h3>
                <p className="text-xs text-white/40 mt-0.5">Daily revenue overview</p>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData || []} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })}
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Revenue']}
                    labelFormatter={(l) => formatDate(l)}
                    contentStyle={{ background: 'rgba(12,18,45,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(20px)' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}
                  />
                  <Bar dataKey="amount" radius={[6,6,0,0]}
                    fill="url(#barGrad)" />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Low Stock */}
            <GlassCard className="p-5 glass-amber">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Warning className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Low Stock Alert</h3>
                  <p className="text-xs text-white/40">Products below minimum level</p>
                </div>
              </div>
              {!stats?.lowStockProducts?.length ? (
                <div className="flex items-center gap-2.5 py-3 text-sm text-white/50">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  All products are sufficiently stocked.
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.lowStockProducts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p className="text-sm font-medium text-white/80">{p.name}</p>
                        <p className="text-xs text-white/35">{p.sku}</p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full', p.quantity === 0 ? 'badge-danger' : 'badge-warning')}>
                        {p.quantity} left
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Recent activity */}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Recent Sales', data: stats?.recentSales, color: 'text-emerald-400', dotBg: 'bg-emerald-400', icon: TrendUp, glassClass: 'glass-emerald',
                renderAmount: (s: any) => formatCurrency(s.totalAmount), renderRef: (s: any) => s.invoiceNo, renderSub: (s: any) => `${s.user?.name} · ${formatDate(s.createdAt)}` },
              ...(canViewPurchases ? [{
                title: 'Recent Purchases', data: stats?.recentPurchases, color: 'text-orange-400', dotBg: 'bg-orange-400', icon: ShoppingCart, glassClass: 'glass-orange',
                renderAmount: (p: any) => formatCurrency(p.totalAmount), renderRef: (p: any) => p.referenceNo, renderSub: (p: any) => `${p.supplier?.name} · ${formatDate(p.createdAt)}` }
              ] : []),
            ].map((section) => (
              <GlassCard key={section.title} className={cn('p-5', section.glassClass)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', section.glassClass?.replace('glass-', 'bg-') + '-500/20')}>
                    <section.icon className={cn('h-4 w-4', section.color)} />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{section.title}</h3>
                </div>
                {!section.data?.length ? (
                  <p className="text-sm text-white/30 py-2">Nothing to show yet.</p>
                ) : (
                  <div className="space-y-0">
                    {section.data.map((item: any, i: number) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: i < section.data.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div className="flex items-center gap-3">
                          <div className={cn('h-2 w-2 rounded-full shrink-0', section.dotBg)} />
                          <div>
                            <p className="text-sm font-medium text-white/80">{section.renderRef(item)}</p>
                            <p className="text-xs text-white/35">{section.renderSub(item)}</p>
                          </div>
                        </div>
                        <span className={cn('text-sm font-bold', section.color)}>{section.renderAmount(item)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
