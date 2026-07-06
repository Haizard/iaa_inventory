import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash, Building } from '@phosphor-icons/react';
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
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SuppliersPage() {
  const qc = useQueryClient();
  const perms = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/suppliers', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Supplier added' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      api.put(`/suppliers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setDialogOpen(false);
      setEditSupplier(null);
      reset();
      toast({ title: 'Supplier updated' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: 'Supplier removed' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const openEdit = (s: any) => {
    setEditSupplier(s);
    reset({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditSupplier(null);
    reset({ name: '', email: '', phone: '', address: '' });
    setDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editSupplier) updateMutation.mutate({ id: editSupplier.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suppliers</h1>
          <p className="text-sm text-white/50 mt-0.5">Manage your product suppliers</p>
        </div>
        {perms.canCreateSupplier && (
          <button
            onClick={openCreate}
            className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={20} weight="bold" /> Add Supplier
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold text-white/80">All Suppliers ({suppliers.length})</h2>
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
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Purchases</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-white/25">
                      <Building className="h-12 w-12 mb-3 opacity-40" />
                      <p className="text-sm">No suppliers yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((s: any) => (
                  <TableRow key={s.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-violet-500/20 rounded-lg p-1.5">
                          <Building className="h-3.5 w-3.5 text-violet-400" />
                        </div>
                        <span className="font-semibold text-white/90">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{s.email || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{s.phone || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm max-w-40 truncate">{s.address || <span className="text-white/20">—</span>}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="badge-neutral text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {s._count?.purchases ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        {perms.canEditSupplier && (
                          <button
                            onClick={() => openEdit(s)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-white/8 transition-all"
                          >
                            <PencilSimple className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {perms.canDeleteSupplier && (
                          <button
                            onClick={() => deleteMutation.mutate(s.id)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 transition-all"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!perms.canEditSupplier && (
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
        <DialogContent className="glass-heavy rounded-2xl border-white/10 shadow-2xl p-0 overflow-hidden text-white max-w-md">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-lg font-bold text-white">
              {editSupplier ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Supplier Details</p>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Name *</label>
                <input
                  {...register('name')}
                  placeholder="Supplier name"
                  className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="supplier@example.com"
                  className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                />
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Phone</label>
                <input
                  {...register('phone')}
                  placeholder="+255-..."
                  className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Address</label>
                <input
                  {...register('address')}
                  placeholder="City, Country"
                  className="input-glass h-10 w-full rounded-xl px-3 text-sm"
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
                {editSupplier ? 'Save Changes' : 'Add Supplier'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
