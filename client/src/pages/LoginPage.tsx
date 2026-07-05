import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="glass-heavy rounded-3xl overflow-hidden border-white/10">
          {/* Top color bar */}
          <div style={{ background: 'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6)', height: '3px' }} />

          <div className="px-8 pt-8 pb-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="rounded-2xl p-4 mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
              >
                <Package className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Inventory System</h1>
              <p className="text-sm text-white/50 mt-1">Institute of Accountancy Arusha</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@inventory.com"
                    {...register('email')}
                    className="input-glass h-10 w-full rounded-xl pl-9 pr-3 text-sm"
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="input-glass h-10 w-full rounded-xl pl-9 pr-3 text-sm"
                  />
                </div>
                {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-glow w-full h-11 rounded-xl text-white font-semibold mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="text-center text-xs text-white/30 mt-5 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              Default: <span className="font-medium text-white/50">admin@inventory.com</span> / <span className="font-medium text-white/50">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          © {new Date().getFullYear()} IAA Inventory Management System
        </p>
      </div>
    </div>
  );
}
