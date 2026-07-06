import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash, Tag } from '@phosphor-icons/react';
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
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CategoriesPage() {
  const qc = useQueryClient();
  const perms = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      reset();
      toast({ title: 'Category created' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.put(`/categories/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDialogOpen(false);
      setEditCategory(null);
      reset();
      toast({ title: 'Category updated' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Category deleted' });
    },
    onError: (err: any) => toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const openEdit = (cat: any) => {
    setEditCategory(cat);
    reset({ name: cat.name, description: cat.description || '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditCategory(null);
    reset({ name: '', description: '' });
    setDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editCategory) updateMutation.mutate({ id: editCategory.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-sm text-white/50 mt-0.5">Organize your products by category</p>
        </div>
        {perms.canCreateCategory && (
          <button
            onClick={openCreate}
            className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus size={20} weight="bold" /> Add Category
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold text-white/80">All Categories ({categories.length})</h2>
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
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Description</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Products</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-16 text-white/25">
                      <Tag size={48} weight="bold" className="mb-3 opacity-40" />
                      <p className="text-sm">No categories yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat: any) => (
                  <TableRow key={cat.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-blue-500/20 rounded-lg p-1.5">
                          <Tag className="h-3.5 w-3.5 text-blue-400" />
                        </div>
                        <span className="font-semibold text-white/90">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      {cat.description || <span className="text-white/20">—</span>}
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className="badge-neutral text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {cat._count?.products ?? 0} products
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        {perms.canEditCategory && (
                          <button
                            onClick={() => openEdit(cat)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-white/8 transition-all"
                          >
                            <PencilSimple className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {perms.canDeleteCategory && (
                          <button
                            onClick={() => deleteMutation.mutate(cat.id)}
                            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 transition-all"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!perms.canEditCategory && (
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
              {editCategory ? 'Edit Category' : 'Add Category'}
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Name *</label>
                <input
                  {...register('name')}
                  placeholder="Category name"
                  className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Description</label>
                <input
                  {...register('description')}
                  placeholder="Optional description"
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
                {editCategory ? 'Save Changes' : 'Add Category'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
