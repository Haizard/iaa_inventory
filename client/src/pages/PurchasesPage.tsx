import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ShoppingCart, Download } from 'lucide-react';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import RoleGuard from '@/components/RoleGuard';
import { generatePurchaseReceipt } from '@/lib/pdf';

interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export default function PurchasesPage() {
  const qc = useQueryClient();
  const { canViewPurchases, canCreatePurchase } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/purchases').then((r) => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/purchases', {
        supplierId,
        items: items.map(({ productId, quantity, unitCost }) => ({
          productId,
          quantity,
          unitCost,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
      setItems([]);
      setSupplierId('');
      toast({ title: 'Purchase order created' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const addItem = () => {
    if (!selectedProduct || qty < 1) return;
    const product = products.find((p: any) => p.id === selectedProduct);
    if (!product) return;
    const cost = unitCost || Number(product.costPrice);
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === selectedProduct);
      if (existing) {
        return prev.map((i) =>
          i.productId === selectedProduct ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        { productId: selectedProduct, productName: product.name, quantity: qty, unitCost: cost },
      ];
    });
    setSelectedProduct('');
    setQty(1);
    setUnitCost(0);
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  return (
    <RoleGuard allowed={canViewPurchases} message="Purchases are only accessible to Managers and Admins.">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Purchases</h1>
            <p className="text-sm text-white/50 mt-0.5">Manage stock purchase orders</p>
          </div>
          {canCreatePurchase && (
            <button
              onClick={() => { setItems([]); setSupplierId(''); setDialogOpen(true); }}
              className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <Plus className="h-4 w-4" /> New Purchase
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-sm font-semibold text-white/80">Purchase Orders ({purchases.length})</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Reference #</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Supplier</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Items</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Total Cost</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-white/25">
                        <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
                        <p className="text-sm">No purchases yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((p: any) => (
                    <TableRow key={p.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <TableCell className="py-3 px-6 text-white/70 text-sm">
                        <span className="font-semibold text-white/90">{p.referenceNo}</span>
                      </TableCell>
                      <TableCell className="py-3 px-6 text-white/70 text-sm">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="py-3 px-6 text-white/70 text-sm">{p.supplier?.name}</TableCell>
                      <TableCell className="py-3 px-6 text-white/70 text-sm">
                        <span className="badge-neutral text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {p.items?.length} item(s)
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-6 text-white/70 text-sm font-semibold text-orange-400">
                        {formatCurrency(p.totalAmount)}
                      </TableCell>
                      <TableCell className="py-3 px-6 text-white/70 text-sm">
                        {p.status === 'RECEIVED' ? (
                          <span className="badge-success text-[10px] font-bold px-2.5 py-1 rounded-full">{p.status}</span>
                        ) : p.status === 'CANCELLED' ? (
                          <span className="badge-danger text-[10px] font-bold px-2.5 py-1 rounded-full">{p.status}</span>
                        ) : (
                          <span className="badge-warning text-[10px] font-bold px-2.5 py-1 rounded-full">{p.status}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => generatePurchaseReceipt(p)}
                            title="Download Purchase Order PDF"
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

        {/* New Purchase Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-heavy rounded-2xl border-white/10 shadow-2xl p-0 overflow-hidden text-white max-w-2xl">
            <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
                New Purchase Order
              </h2>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Supplier */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Supplier</p>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="input-glass h-10 rounded-xl border-0 text-white/80">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add item */}
              <div className="glass rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Add Item</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <Select value={selectedProduct} onValueChange={(v) => {
                      setSelectedProduct(v);
                      const prod = products.find((p: any) => p.id === v);
                      if (prod) setUnitCost(Number(prod.costPrice));
                    }}>
                      <SelectTrigger className="input-glass h-10 rounded-xl border-0 text-white/80">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={qty}
                      min={1}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Unit cost"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!selectedProduct}
                  className="btn-glow flex items-center gap-1.5 px-3 h-8 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>

              {items.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-2 px-4">Product</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-2 px-4">Qty</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-2 px-4">Unit Cost</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-2 px-4">Subtotal</TableHead>
                        <TableHead className="py-2 px-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.productId} className="glass-row border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <TableCell className="py-2 px-4 text-white/70 text-sm font-medium">{item.productName}</TableCell>
                          <TableCell className="py-2 px-4 text-white/70 text-sm">{item.quantity}</TableCell>
                          <TableCell className="py-2 px-4 text-white/70 text-sm">{formatCurrency(item.unitCost)}</TableCell>
                          <TableCell className="py-2 px-4 font-semibold text-white/90 text-sm">{formatCurrency(item.quantity * item.unitCost)}</TableCell>
                          <TableCell className="py-2 px-4">
                            <button
                              onClick={() => removeItem(item.productId)}
                              className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <TableCell colSpan={3} className="py-3 px-4 font-bold text-white/80">Total</TableCell>
                        <TableCell className="py-3 px-4 font-bold text-orange-400 text-base">
                          {formatCurrency(total)}
                        </TableCell>
                        <TableCell className="py-3 px-4" />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={items.length === 0 || !supplierId || createMutation.isPending}
                className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Create Purchase Order
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
