import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass, ShoppingCart, CreditCard, Money, DeviceMobile,
  User, X, Package, Receipt, Clock, Tag, Trash, Download, Printer,
} from '@phosphor-icons/react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { generateSaleReceipt, printReceiptHtml } from '@/lib/pdf';

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  imageUrl?: string;
}
type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE';

/* vivid glass accents per product slot */
const CARD_ACCENT = [
  { from: 'from-blue-600/70',   to: 'to-indigo-600/70',  icon: 'text-blue-200'   },
  { from: 'from-violet-600/70', to: 'to-purple-600/70',  icon: 'text-violet-200' },
  { from: 'from-emerald-600/70',to: 'to-teal-600/70',    icon: 'text-emerald-200'},
  { from: 'from-orange-500/70', to: 'to-rose-600/70',    icon: 'text-orange-200' },
  { from: 'from-pink-600/70',   to: 'to-fuchsia-600/70', icon: 'text-pink-200'   },
  { from: 'from-cyan-500/70',   to: 'to-blue-600/70',    icon: 'text-cyan-200'   },
  { from: 'from-amber-500/70',  to: 'to-orange-600/70',  icon: 'text-amber-200'  },
  { from: 'from-rose-500/70',   to: 'to-pink-600/70',    icon: 'text-rose-200'   },
];

const CAT_COLORS = [
  'bg-blue-500/20   border-blue-500/40   text-blue-300',
  'bg-violet-500/20 border-violet-500/40 text-violet-300',
  'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  'bg-orange-500/20 border-orange-500/40 text-orange-300',
  'bg-pink-500/20   border-pink-500/40   text-pink-300',
  'bg-cyan-500/20   border-cyan-500/40   text-cyan-300',
];

const CALC_KEYS = ['7','8','9','4','5','6','1','2','3','.','0','⌫'];

export default function SalesPage() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const { canCreateSale } = usePermissions();

  const [cart,      setCart]     = useState<CartItem[]>([]);
  const [custId,    setCustId]   = useState('');
  const [search,    setSearch]   = useState('');
  const [activeCat, setActiveCat]= useState('ALL');
  const [discount,  setDiscount] = useState(0);
  const [payMethod, setPayMethod]= useState<PaymentMethod>('CASH');
  const [amtPaid,   setAmtPaid]  = useState('');
  const [selItem,   setSelItem]  = useState<string | null>(null);
  const [calcBuf,   setCalcBuf]  = useState('');
  const [lastSale,  setLastSale] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const { data: products   = [] } = useQuery({ queryKey: ['products'],   queryFn: () => api.get('/products').then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
  const { data: customers  = [] } = useQuery({ queryKey: ['customers'],  queryFn: () => api.get('/customers').then(r => r.data) });

  const filtered = useMemo(() =>
    (products as any[]).filter(p =>
      (activeCat === 'ALL' || p.categoryId === activeCat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    ), [products, activeCat, search]);

  const subtotal    = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmt = (subtotal * discount) / 100;
  const total       = subtotal - discountAmt;
  const change      = Number(amtPaid) - total;
  const cartCount   = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (p: any) => {
    if (p.quantity === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) {
        if (ex.quantity >= p.quantity) { toast({ title: `Only ${p.quantity} in stock`, variant: 'destructive' }); return prev; }
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: p.id, productName: p.name, sku: p.sku, quantity: 1, unitPrice: Number(p.price), stock: p.quantity, imageUrl: p.imageUrl || undefined }];
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.productId !== id));
    if (selItem === id) { setSelItem(null); setCalcBuf(''); }
  };

  const clearCart = () => { setCart([]); setCustId(''); setDiscount(0); setAmtPaid(''); setPayMethod('CASH'); setSelItem(null); setCalcBuf(''); };

  const handleCalcKey = (key: string) => {
    if (!selItem) {
      if (key === '⌫') { setAmtPaid(p => p.slice(0, -1)); return; }
      if (key === '.' && amtPaid.includes('.')) return;
      setAmtPaid(p => p === '0' && key !== '.' ? key : p + key);
      return;
    }
    if (key === '⌫') {
      const next = calcBuf.slice(0, -1);
      setCalcBuf(next);
      const q = parseInt(next || '0', 10);
      if (!isNaN(q)) setCart(prev => prev.map(i => i.productId === selItem ? { ...i, quantity: Math.min(Math.max(q, 1), i.stock) } : i));
      return;
    }
    if (key === '.') return;
    const next = calcBuf + key;
    setCalcBuf(next);
    const q = parseInt(next, 10);
    if (!isNaN(q) && q > 0) setCart(prev => prev.map(i => i.productId === selItem ? { ...i, quantity: Math.min(q, i.stock) } : i));
  };

  const checkoutMutation = useMutation({
    mutationFn: () => api.post('/sales', {
      customerId: custId && custId !== 'walkin' ? custId : undefined,
      items: cart.map(({ productId, quantity, unitPrice }) => ({ productId, quantity, unitPrice })),
    }),
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      // fetch full sale with items for receipt
      api.get(`/sales/${res.data.id}`).then(r => {
        setLastSale(r.data);
        setReceiptOpen(true);
      }).catch(() => {
        // fallback: use response data directly
        setLastSale(res.data);
        setReceiptOpen(true);
      });
      toast({ title: `✓ Sale recorded — ${res.data.invoiceNo}`, description: `Total: ${formatCurrency(total)}` });
      clearCart();
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Checkout failed', variant: 'destructive' }),
  });

  const handleCheckout = () => {
    if (!cart.length) return;
    if (payMethod === 'CASH' && amtPaid && Number(amtPaid) < total) { toast({ title: 'Amount paid is less than total', variant: 'destructive' }); return; }
    checkoutMutation.mutate();
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-3 overflow-hidden">
      {/* ── Receipt Modal ─────────────────────────────────────── */}
      {receiptOpen && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-heavy rounded-2xl border border-white/10 shadow-2xl p-0 overflow-hidden text-white w-full max-w-sm mx-4">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(99,102,241,0.15))' }}>
              <span className="font-bold flex items-center gap-2 text-sm"><Receipt className="h-4 w-4 text-blue-400" /> Sale Receipt</span>
              <button onClick={() => setReceiptOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* body */}
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/50">Invoice</span><span className="font-mono font-bold text-blue-400">{lastSale.invoiceNo}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Customer</span><span>{lastSale.customer?.name ?? 'Walk-in'}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Cashier</span><span>{lastSale.user?.name ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Items</span><span>{lastSale.items?.length ?? '—'}</span></div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="font-bold text-white/80">Total</span>
                <span className="font-extrabold text-emerald-400 text-base">{formatCurrency(lastSale.totalAmount)}</span>
              </div>
            </div>
            {/* actions */}
            <div className="flex gap-2 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => printReceiptHtml(lastSale)}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold glass hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all">
                <Printer className="h-4 w-4" /> Print
              </button>
              <button onClick={() => generateSaleReceipt(lastSale)}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold btn-glow text-white transition-all">
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          LEFT — Product Browser (glass card)
      ══════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

        {/* top bar */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input type="text" placeholder="Search name or SKU…" value={search} onChange={e => setSearch(e.target.value)}
              className="input-glass h-9 w-full rounded-xl pl-9 pr-3 text-sm" />
          </div>
          <button onClick={() => navigate('/sales/history')}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-all shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <Clock className="h-3.5 w-3.5" /> Order History
          </button>
        </div>

        {/* category pills */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveCat('ALL')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 border transition-all',
              activeCat === 'ALL' ? 'btn-glow border-transparent text-white' : 'text-white/40 border-white/10 hover:text-white/70 hover:bg-white/8'
            )}>
            <Tag className="h-3 w-3" /> All Items
          </button>
          {(categories as any[]).map((cat, i) => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 border transition-all',
                activeCat === cat.id ? `${CAT_COLORS[i % CAT_COLORS.length]} shadow-sm` : 'text-white/40 border-white/10 hover:text-white/70 hover:bg-white/8'
              )}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
              <Package className="h-14 w-14 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((p: any, idx: number) => {
                const inCart   = cart.find(i => i.productId === p.id);
                const oos      = p.quantity === 0;
                const lowStock = !oos && p.quantity <= p.minStock;
                const ac       = CARD_ACCENT[idx % CARD_ACCENT.length];
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={oos}
                    className={cn(
                      'relative flex flex-col rounded-2xl text-left overflow-hidden transition-all duration-200 active:scale-[0.96]',
                      'hover:-translate-y-1',
                      oos ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      inCart
                        ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-transparent'
                        : ''
                    )}
                    style={{ background: 'rgba(255,255,255,0.06)', border: inCart ? 'none' : '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 20px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)' }}>

                    {/* image / gradient top */}
                    <div className={cn('w-full relative overflow-hidden', p.imageUrl ? 'h-44' : 'h-32')}>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-contain"
                          style={{ background: 'rgba(0,0,0,0.25)' }}
                        />
                      ) : (
                        <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', ac.from, ac.to)}>
                          <Package className={cn('h-12 w-12 opacity-80', ac.icon)} />
                        </div>
                      )}
                      {/* subtle bottom fade */}
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                    </div>

                    {/* stock badge */}
                    <span className={cn('absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm',
                      oos ? 'badge-danger' : lowStock ? 'badge-warning' : 'badge-success'
                    )}>{oos ? 'Out' : p.quantity}</span>

                    {/* cart qty bubble */}
                    {inCart && (
                      <span className="absolute top-2 left-2 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#3b82f6)', boxShadow: '0 2px 8px rgba(99,102,241,0.6)' }}>
                        {inCart.quantity}
                      </span>
                    )}

                    {/* info */}
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold leading-tight text-white/90 line-clamp-2">{p.name}</p>
                      <p className="text-[9px] text-white/35 mt-0.5">{p.sku}</p>
                      <p className="text-xs font-extrabold mt-1.5" style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {formatCurrency(p.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Cart / Order (dark glass)
      ══════════════════════════════════════════ */}
      <div className="w-full md:w-[320px] shrink-0 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,13,32,0.82)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 12px 40px rgba(0,0,0,0.55)' }}>

        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(99,102,241,0.18))', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-400" />
            <span className="font-bold text-sm text-white">Current Order</span>
            {cartCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-blue-200"
                style={{ background: 'rgba(99,102,241,0.35)', border: '1px solid rgba(99,102,241,0.4)' }}>
                {cartCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="flex items-center gap-1 text-white/30 hover:text-rose-400 text-xs font-medium transition-all">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* customer selector */}
        <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <User className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <Select value={custId} onValueChange={setCustId}>
              <SelectTrigger className="h-7 text-xs flex-1 rounded-xl border-white/10 bg-white/5 text-white/70 focus:ring-indigo-500/30">
                <SelectValue placeholder="Walk-in Customer" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1629] border-white/10 text-white">
                <SelectItem value="walkin">Walk-in Customer</SelectItem>
                {(customers as any[]).map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-white/80 focus:bg-white/10">{c.name}{c.phone ? ` · ${c.phone}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* cart items */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20 py-10">
              <ShoppingCart className="h-14 w-14 opacity-20" />
              <p className="text-xs">Cart is empty — tap a product</p>
            </div>
          ) : (
            <ul>
              {cart.map((item, idx) => {
                const isSelected = selItem === item.productId;
                const ac = CARD_ACCENT[idx % CARD_ACCENT.length];
                return (
                  <li key={item.productId}
                    onClick={() => { setSelItem(isSelected ? null : item.productId); setCalcBuf(String(item.quantity)); }}
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-all"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
                      borderLeft: isSelected ? '2px solid rgba(99,102,241,0.7)' : '2px solid transparent',
                    }}>
                    {/* thumb */}
                    <div className={cn('h-9 w-9 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br', ac.from, ac.to)}>
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className={cn('h-4 w-4', ac.icon)} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white/90 truncate">{item.productName}</p>
                      <p className="text-[9px] text-white/35 mt-0.5">{formatCurrency(item.unitPrice)} × {item.quantity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); removeItem(item.productId); }}
                        className="text-white/20 hover:text-rose-400 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs font-extrabold text-indigo-400">{formatCurrency(item.quantity * item.unitPrice)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* totals */}
        <div className="px-4 py-3 shrink-0 space-y-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex justify-between text-xs text-white/40">
            <span>Subtotal</span><span className="text-white/60 font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/40">Discount %</span>
            <div className="flex items-center gap-2">
              {discountAmt > 0 && <span className="text-[9px] font-bold text-rose-400">-{formatCurrency(discountAmt)}</span>}
              <input type="number" min={0} max={100} value={discount || ''} onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))} placeholder="0"
                className="w-14 h-6 text-xs text-right rounded-lg px-2 text-white bg-white/8 border border-white/10 focus:outline-none focus:border-indigo-500/50" />
            </div>
          </div>
          <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-sm font-bold text-white/70">Total</span>
            <span className="text-xl font-extrabold" style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* payment method */}
        <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-2">Payment Method</p>
          <div className="grid grid-cols-3 gap-1.5">
            {([['CASH','Cash',<Money className="h-3.5 w-3.5"/>],['CARD','Card',<CreditCard className="h-3.5 w-3.5"/>],['MOBILE','Mobile',<DeviceMobile className="h-3.5 w-3.5"/>]] as const).map(([val, lbl, ico]) => (
              <button key={val} onClick={() => setPayMethod(val as PaymentMethod)}
                className={cn('flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all',
                  payMethod === val
                    ? 'text-white border-transparent' : 'text-white/30 border-white/8 hover:text-white/60 hover:bg-white/5'
                )}
                style={payMethod === val ? { background: 'linear-gradient(135deg,rgba(59,130,246,0.5),rgba(99,102,241,0.4))', border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' } : {}}>
                {ico}{lbl}
              </button>
            ))}
          </div>
        </div>

        {/* calculator */}
        <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* display */}
          <div className="flex items-center justify-between rounded-xl px-3 py-2 mb-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <span className="text-[9px] text-white/30 font-medium truncate max-w-[120px]">
              {selItem ? (cart.find(i => i.productId === selItem)?.productName.slice(0, 16) + '…') : (payMethod === 'CASH' ? 'Amount Paid' : 'Ref / Note')}
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              {selItem ? (calcBuf || String(cart.find(i => i.productId === selItem)?.quantity ?? '')) : (amtPaid || '0')}
            </span>
          </div>
          {/* keys */}
          <div className="grid grid-cols-3 gap-1.5">
            {CALC_KEYS.map(k => (
              <button key={k} onClick={() => handleCalcKey(k)}
                className={cn('h-9 rounded-xl text-sm font-bold transition-all active:scale-95',
                  k === '⌫'
                    ? 'text-rose-400 hover:text-rose-300 flex items-center justify-center'
                    : 'text-white/70 hover:text-white'
                )}
                style={k === '⌫'
                  ? { background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {k === '⌫' ? <Trash className="h-4 w-4" /> : k}
              </button>
            ))}
          </div>
          {/* change display */}
          {payMethod === 'CASH' && amtPaid && Number(amtPaid) >= total && total > 0 && (
            <div className="flex justify-between text-xs font-bold mt-2 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7' }}>
              <span>Change</span><span>{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        {/* checkout */}
        <div className="px-3 py-3 shrink-0">
          <button onClick={handleCheckout}
            disabled={!cart.length || checkoutMutation.isPending || !canCreateSale}
            className={cn('w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all',
              cart.length && canCreateSale ? 'btn-glow text-white' : 'text-white/20 cursor-not-allowed'
            )}
            style={!(cart.length && canCreateSale) ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' } : {}}>
            {checkoutMutation.isPending
              ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><Receipt className="h-4 w-4" />{cart.length > 0 ? `Charge ${formatCurrency(total)}` : 'Add Items to Checkout'}</>
            }
          </button>
          {!canCreateSale && <p className="text-center text-[10px] text-white/25 mt-1.5">No permission to create sales</p>}
        </div>

      </div>
    </div>
  );
}
