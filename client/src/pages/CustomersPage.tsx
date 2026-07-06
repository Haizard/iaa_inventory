import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MagnifyingGlass, PencilSimple, Trash, Users } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CustomersPage() {
  const qc = useQueryClient();
  const perms = usePermissions();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () =>
      api.get('/customers', { params: { search: search || undefined } }).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/customers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Customer added' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      api.put(`/customers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setDialogOpen(false);
      setEditCustomer(null);
      reset();
      toast({ title: 'Customer updated' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: 'Customer removed' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const openEdit = (c: any) => {
    setEditCustomer(c);
    reset({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditCustomer(null);
    reset({ name: '', email: '', phone: '', address: '' });
    setDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editCustomer) updateMutation.mutate({ id: editCustomer.id, data });
    else createMutation.mutate(data);
  };

  const activeCount = customers.filter((c: any) => (c._count?.sales ?? 0) > 0).length;
  const totalSales = customers.reduce((sum: number, c: any) => sum + (c._count?.sales ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-xs text-white/50 mt-0.5">Manage your customer records</p>
        </div>
        {perms.canCreateCustomer && (
          <button
            onClick={openCreate}
            className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={20} weight="bold" /> Add Customer
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="glass glass-blue rounded-2xl p-5 hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">{customers.length}</p>
          <p className="text-[11px] text-white/40 mt-2 uppercase tracking-widest">Total Customers</p>
        </div>
        <div className="glass glass-emerald rounded-2xl p-5 hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{activeCount}</p>
          <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Active Customers</p>
        </div>
        <div className="glass glass-violet rounded-2xl p-5 hover-lift">
          <div className="flex items-start justify-between mb-4">
            <div className="h-11 w-11 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{totalSales}</p>
          <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Total Sales Made</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4 flex gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass h-9 w-full rounded-xl pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold text-white/80">All Customers ({customers.length})</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Email</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Phone</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Address</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Total Sales</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Joined</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-white/25">
                      <Users size={48} weight="bold" className="mb-3 opacity-40" />
                      <p className="text-sm">No customers found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c: any) => (
                  <TableRow key={c.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="font-semibold text-white/90">{c.name}</span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{c.email || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{c.phone || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm max-w-40 truncate">{c.address || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="badge-neutral text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {c._count?.sales ?? 0} sales
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{formatDate(c.createdAt)}</TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        {perms.canEditCustomer && (
                          <button
                            onClick={() => openEdit(c)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-white/8 transition-all"
                          >
                            <PencilSimple className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {perms.canDeleteCustomer && (
                          <button
                            onClick={() => deleteMutation.mutate(c.id)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 transition-all"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!perms.canEditCustomer && (
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
        <DialogContent className="glass-heavy rounded-2xl border-white/10 shadow-2xl p-0 overflow-hidden text-white max-w-xl mx-4">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-base font-bold text-white">
              {editCustomer ? 'Edit Customer' : 'Add Customer'}
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1 col-span-1 sm:col-span-2">Customer Details</p>
              <div>
                <label className="text-[11px] font-medium text-white/60 mb-1.5 block">Name *</label>
                <input
                  {...register('name')}
                  placeholder="Full name"
                  className="input-glass h-9 w-full rounded-xl px-3 text-xs"
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/60 mb-1.5 block">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="customer@example.com"
                  className="input-glass h-9 w-full rounded-xl px-3 text-xs"
                />
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/60 mb-1.5 block">Phone</label>
                <input
                  {...register('phone')}
                  placeholder="+255-..."
                  className="input-glass h-9 w-full rounded-xl px-3 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/60 mb-1.5 block">Address</label>
                <input
                  {...register('address')}
                  placeholder="City, Country"
                  className="input-glass h-9 w-full rounded-xl px-3 text-xs"
                />
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
                {editCustomer ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
