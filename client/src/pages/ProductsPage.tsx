import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().min(0).optional()
);

const schema = z.object({
  name: z.string().min(1, 'Required'),
  sku: z.string().min(1, 'Required'),
  barcode: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  productType: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE', 'BUNDLE', 'VARIABLE']).default('PHYSICAL'),
  price: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  wholesalePrice: optionalNumber,
  minSellingPrice: optionalNumber,
  taxRate: optionalNumber,
  discountRate: optionalNumber,
  currency: z.string().default('TZS'),
  quantity: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  maxStock: optionalNumber,
  trackInventory: z.boolean().default(true),
  unit: z.string().default('pcs'),
  purchaseUnit: z.string().optional(),
  sellingUnit: z.string().optional(),
  unitConversion: z.string().optional(),
  warehouse: z.string().optional(),
  storageLocation: z.string().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED', 'DISCONTINUED']).default('ACTIVE'),
  canBeSold: z.boolean().default(true),
  featured: z.boolean().default(false),
  availableOnline: z.boolean().default(false),
  availableInStore: z.boolean().default(true),
  allowBackorders: z.boolean().default(false),
  brandId: z.string().optional(),
  categoryId: z.string().min(1, 'Required'),
  supplierId: z.string().optional(),
  supplierSku: z.string().optional(),
  supplierLeadTimeDays: optionalNumber,
  shippingWeight: optionalNumber,
  shippingLength: optionalNumber,
  shippingWidth: optionalNumber,
  shippingHeight: optionalNumber,
  shippingClass: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const productTypes = [
  { value: 'PHYSICAL', label: 'Physical Product' },
  { value: 'DIGITAL', label: 'Digital Product' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'BUNDLE', label: 'Bundle / Package' },
  { value: 'VARIABLE', label: 'Variable Product' },
] as const;

const productStatuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
] as const;

const units = ['pcs', 'kg', 'g', 'L', 'ml', 'm', 'cm', 'box', 'carton', 'pack', 'dozen'];

export default function ProductsPage() {
  const qc = useQueryClient();
  const perms = usePermissions();
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, lowStock],
    queryFn: () =>
      api
        .get('/products', { params: { search: search || undefined, lowStock: lowStock || undefined } })
        .then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/brands').then((r) => r.data),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/products', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Product added successfully' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setDialogOpen(false);
      setEditProduct(null);
      reset();
      toast({ title: 'Product updated' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product deleted' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const openEdit = (product: any) => {
    setEditProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      productType: product.productType || 'PHYSICAL',
      price: product.price,
      costPrice: product.costPrice,
      wholesalePrice: product.wholesalePrice ?? undefined,
      minSellingPrice: product.minSellingPrice ?? undefined,
      taxRate: product.taxRate ?? undefined,
      discountRate: product.discountRate ?? undefined,
      currency: product.currency || 'TZS',
      quantity: product.quantity,
      minStock: product.minStock,
      maxStock: product.maxStock ?? undefined,
      trackInventory: product.trackInventory ?? true,
      unit: product.unit,
      purchaseUnit: product.purchaseUnit || '',
      sellingUnit: product.sellingUnit || '',
      unitConversion: product.unitConversion || '',
      warehouse: product.warehouse || '',
      storageLocation: product.storageLocation || '',
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
      batchNumber: product.batchNumber || '',
      status: product.status || 'ACTIVE',
      canBeSold: product.canBeSold ?? true,
      featured: product.featured ?? false,
      availableOnline: product.availableOnline ?? false,
      availableInStore: product.availableInStore ?? true,
      allowBackorders: product.allowBackorders ?? false,
      brandId: product.brandId || '',
      categoryId: product.categoryId,
      supplierId: product.supplierId || '',
      supplierSku: product.supplierSku || '',
      supplierLeadTimeDays: product.supplierLeadTimeDays ?? undefined,
      shippingWeight: product.shippingWeight ?? undefined,
      shippingLength: product.shippingLength ?? undefined,
      shippingWidth: product.shippingWidth ?? undefined,
      shippingHeight: product.shippingHeight ?? undefined,
      shippingClass: product.shippingClass || '',
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditProduct(null);
    reset({
      name: '',
      sku: '',
      barcode: '',
      shortDescription: '',
      description: '',
      imageUrl: '',
      productType: 'PHYSICAL',
      price: 0,
      costPrice: 0,
      currency: 'TZS',
      quantity: 0,
      minStock: 10,
      trackInventory: true,
      unit: 'pcs',
      purchaseUnit: 'pcs',
      sellingUnit: 'pcs',
      status: 'ACTIVE',
      canBeSold: true,
      featured: false,
      availableOnline: false,
      availableInStore: true,
      allowBackorders: false,
      categoryId: '',
      brandId: '',
      supplierId: '',
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-white/50 mt-0.5">Manage your product inventory</p>
        </div>
        {perms.canCreateProduct && (
          <button
            onClick={openCreate}
            className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass h-9 w-full rounded-xl pl-9 pr-3 text-sm"
          />
        </div>
        <button
          onClick={() => setLowStock(!lowStock)}
          className={cn(
            'flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold border transition-all',
            lowStock
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
              : 'border-white/10 text-white/50 hover:bg-white/8 hover:text-white/80'
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          Low Stock
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold text-white/80">Products ({products.length})</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Image</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">SKU</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Category</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Brand</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Stock</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Cost Price</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Sell Price</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <div className="flex flex-col items-center justify-center py-16 text-white/25">
                      <Package className="h-12 w-12 mb-3 opacity-40" />
                      <p className="text-sm">No products found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product: any) => (
                  <TableRow key={product.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                          <Package className="h-5 w-5 text-white/30" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="font-semibold text-white/90">{product.name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{product.sku}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{product.category?.name}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{product.brand?.name || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      {product.quantity} <span className="text-white/30 text-xs">{product.unit}</span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      {product.quantity === 0 ? (
                        <span className="badge-danger text-[10px] font-bold px-2.5 py-1 rounded-full">Out of Stock</span>
                      ) : product.status !== 'ACTIVE' ? (
                        <span className="badge-neutral text-[10px] font-bold px-2.5 py-1 rounded-full">{product.status}</span>
                      ) : product.quantity <= product.minStock ? (
                        <span className="badge-warning text-[10px] font-bold px-2.5 py-1 rounded-full">Low Stock</span>
                      ) : (
                        <span className="badge-success text-[10px] font-bold px-2.5 py-1 rounded-full">In Stock</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm text-right">
                      <div className="flex justify-end gap-1.5">
                        {perms.canEditProduct && (
                          <button
                            onClick={() => openEdit(product)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-white/8 transition-all"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {perms.canDeleteProduct && (
                          <button
                            onClick={() => deleteMutation.mutate(product.id)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!perms.canEditProduct && !perms.canDeleteProduct && (
                          <span className="text-xs text-white/30">View only</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-heavy rounded-2xl border-white/10 shadow-2xl p-0 overflow-hidden text-white max-w-2xl">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-bold text-white">
              {editProduct ? 'Edit Product' : 'Add Product'}
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Basic Info</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Name *</label>
                  <input {...register('name')} placeholder="Product name" className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                  {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">SKU *</label>
                  <input {...register('sku')} placeholder="e.g. PROD-001" className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                  {errors.sku && <p className="text-xs text-rose-400 mt-1">{errors.sku.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Description</label>
                  <input {...register('description')} placeholder="Optional description" className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Product Image URL (optional)</label>
                  <input
                    {...register('imageUrl')}
                    placeholder="https://i.pinimg.com/... or any image URL"
                    className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                  />
                  {errors.imageUrl && <p className="text-xs text-rose-400 mt-1">{errors.imageUrl.message}</p>}
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 pt-2">Categorization</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Category *</label>
                  <Select
                    onValueChange={(v) => setValue('categoryId', v)}
                    defaultValue={editProduct?.categoryId}
                  >
                    <SelectTrigger className="input-glass h-10 rounded-xl border-0 text-white/80">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-xs text-rose-400 mt-1">{errors.categoryId.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Unit</label>
                  <input {...register('unit')} placeholder="pcs, kg, box..." className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 pt-2">Pricing & Stock</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Cost Price (TZS) *</label>
                  <input type="number" {...register('costPrice')} className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                  {errors.costPrice && <p className="text-xs text-rose-400 mt-1">{errors.costPrice.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Selling Price (TZS) *</label>
                  <input type="number" {...register('price')} className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                  {errors.price && <p className="text-xs text-rose-400 mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Quantity</label>
                  <input type="number" {...register('quantity')} className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block">Min Stock Alert</label>
                  <input type="number" {...register('minStock')} className="input-glass h-10 w-full rounded-xl px-3 text-sm" />
                </div>
              </div>
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
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {editProduct ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
