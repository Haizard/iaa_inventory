import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash, Shield, Eye, EyeSlash } from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permissions';
import RoleGuard from '@/components/RoleGuard';

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
});

const editSchema = z.object({
  name: z.string().min(1, 'Required'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
  password: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

export default function UsersPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { canManageUsers } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'STAFF' },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      createForm.reset();
      toast({ title: 'User created' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDialogOpen(false);
      setEditUser(null);
      editForm.reset();
      toast({ title: 'User updated' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User deleted' });
    },
    onError: (err: any) =>
      toast({ title: err.response?.data?.message || 'Error', variant: 'destructive' }),
  });

  const openEdit = (u: any) => {
    setEditUser(u);
    editForm.reset({ name: u.name, role: u.role, password: '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditUser(null);
    createForm.reset({ name: '', email: '', password: '', role: 'STAFF' });
    setDialogOpen(true);
  };

  const roleBadge = (role: string) => {
    if (role === 'ADMIN') return 'badge-danger text-[10px] font-bold px-2.5 py-1 rounded-full';
    if (role === 'MANAGER') return 'badge-info text-[10px] font-bold px-2.5 py-1 rounded-full';
    return 'badge-success text-[10px] font-bold px-2.5 py-1 rounded-full';
  };

  const stats = {
    total: users.length,
    admins: users.filter((u: any) => u.role === 'ADMIN').length,
    managers: users.filter((u: any) => u.role === 'MANAGER').length,
    staff: users.filter((u: any) => u.role === 'STAFF').length,
  };

  return (
    <RoleGuard allowed={canManageUsers} message="Only Admins can manage users.">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-sm text-white/50 mt-0.5">Manage system users and their roles</p>
          </div>
          <button
            onClick={openCreate}
            className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="glass glass-blue rounded-2xl p-5 hover-lift">
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Total Users</p>
          </div>
          <div className="glass glass-rose rounded-2xl p-5 hover-lift">
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-rose-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.admins}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Admins</p>
          </div>
          <div className="glass glass-orange rounded-2xl p-5 hover-lift">
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.managers}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Managers</p>
          </div>
          <div className="glass glass-emerald rounded-2xl p-5 hover-lift">
            <div className="flex items-start justify-between mb-4">
              <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{stats.staff}</p>
            <p className="text-xs text-white/40 mt-2 uppercase tracking-widest">Staff</p>
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-sm font-semibold text-white/80">System Users</h2>
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
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Role</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6">Joined</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-white/30 py-3 px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow key={u.id} className="glass-row border-b transition-colors" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white/90">{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-white/30 font-normal">(you)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{u.email}</TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">
                      <span className={roleBadge(u.role)}>{u.role}</span>
                    </TableCell>
                    <TableCell className="py-3 px-6 text-white/70 text-sm">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-blue-400 hover:bg-blue-500/10 border border-white/8 transition-all"
                        >
                          <PencilSimple className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={u.id === currentUser?.id}
                          onClick={() => deleteMutation.mutate(u.id)}
                          className="h-8 w-8 rounded-xl flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 border border-white/8 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-heavy rounded-2xl border-white/10 shadow-2xl p-0 overflow-hidden text-white max-w-md">
            <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-lg font-bold text-white">
                {editUser ? 'Edit User' : 'Create User'}
              </h2>
            </div>

            {editUser ? (
              <form
                onSubmit={editForm.handleSubmit((d) => updateMutation.mutate({ id: editUser.id, data: d }))}
              >
                <div className="px-6 py-5 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">User Details</p>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Name *</label>
                    <input
                      {...editForm.register('name')}
                      className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                    />
                    {editForm.formState.errors.name && (
                      <p className="text-xs text-rose-400 mt-1">{editForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Role *</label>
                    <Select
                      defaultValue={editUser.role}
                      onValueChange={(v) => editForm.setValue('role', v as any)}
                    >
                      <SelectTrigger className="input-glass h-10 rounded-xl border-0 text-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">
                      New Password <span className="text-white/30 text-xs font-normal">(leave blank to keep current)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...editForm.register('password')}
                        placeholder="••••••••"
                        className="input-glass h-10 w-full rounded-xl px-3 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
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
                    disabled={updateMutation.isPending}
                    className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))}
              >
                <div className="px-6 py-5 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">New User Details</p>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Name *</label>
                    <input
                      {...createForm.register('name')}
                      placeholder="Full name"
                      className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                    />
                    {createForm.formState.errors.name && (
                      <p className="text-xs text-rose-400 mt-1">{createForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Email *</label>
                    <input
                      {...createForm.register('email')}
                      type="email"
                      placeholder="user@inventory.com"
                      className="input-glass h-10 w-full rounded-xl px-3 text-sm"
                    />
                    {createForm.formState.errors.email && (
                      <p className="text-xs text-rose-400 mt-1">{createForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...createForm.register('password')}
                        placeholder="Min 6 characters"
                        className="input-glass h-10 w-full rounded-xl px-3 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {createForm.formState.errors.password && (
                      <p className="text-xs text-rose-400 mt-1">{createForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/60 mb-1.5 block">Role *</label>
                    <Select defaultValue="STAFF" onValueChange={(v) => createForm.setValue('role', v as any)}>
                      <SelectTrigger className="input-glass h-10 rounded-xl border-0 text-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                      </SelectContent>
                    </Select>
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
                    disabled={createMutation.isPending}
                    className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    Create User
                  </button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
