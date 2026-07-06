import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Building2, ShoppingCart,
  TrendingUp, LogOut, Menu, X, Users, UserCog, FileBarChart2,
} from 'lucide-react';
import iaaLogo from '@/assets/iaa-logo.jpeg';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';

export default function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();
  const perms     = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPOS     = location.pathname === '/sales';

  const handleLogout = () => { logout(); navigate('/login'); };

  const mainNav = [
    { to: '/',           label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/products',   label: 'Products',    icon: Package,         end: false },
    { to: '/categories', label: 'Categories',  icon: Tag,             end: false },
    { to: '/suppliers',  label: 'Suppliers',   icon: Building2,       end: false },
    { to: '/sales',      label: 'POS / Sales', icon: TrendingUp,      end: false },
    ...(perms.canViewPurchases ? [{ to: '/purchases', label: 'Purchases', icon: ShoppingCart, end: false }] : []),
    { to: '/customers',  label: 'Customers',   icon: Users,           end: false },
    ...(perms.canViewReports  ? [{ to: '/reports',   label: 'Reports',   icon: FileBarChart2, end: false }] : []),
  ];

  const adminNav = perms.canManageUsers
    ? [{ to: '/users', label: 'Users', icon: UserCog, end: false }]
    : [];

  const roleBg: Record<string, string> = {
    ADMIN:   'bg-rose-500/15   border-rose-500/30   text-rose-300',
    MANAGER: 'bg-blue-500/15   border-blue-500/30   text-blue-300',
    STAFF:   'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  };

  const NavItem = ({ to, label, icon: Icon, end, onNav }: any) => (
    <NavLink to={to} end={end} onClick={onNav}
      className={({ isActive }) => cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-blue-600/80 to-indigo-600/60 text-white shadow-lg shadow-blue-900/40 border border-white/10'
          : 'text-white/50 hover:text-white/90 hover:bg-white/8'
      )}
    >
      {({ isActive }) => (
        <>
          <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all',
            isActive ? 'bg-white/15' : 'bg-transparent group-hover:bg-white/8'
          )}>
            <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80')} />
          </div>
          <span className="flex-1 truncate">{label}</span>
          {isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-300 shrink-0" />}
        </>
      )}
    </NavLink>
  );

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <div className="flex flex-col h-full"
      style={{
        background: 'linear-gradient(180deg, rgba(8,13,32,0.97) 0%, rgba(12,18,45,0.97) 100%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-10 w-10 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
          <img src={iaaLogo} alt="IAA Logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none tracking-wide">Inventory IMS</p>
          <p className="text-[11px] text-white/30 mt-1">IAA — Group 86</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-3 mb-3">Main</p>
        {mainNav.map(item => <NavItem key={item.to} {...item} onNav={onNav} />)}

        {adminNav.length > 0 && (
          <>
            <div className="my-3 mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 px-3 mb-3">Admin</p>
            {adminNav.map(item => <NavItem key={item.to} {...item} onNav={onNav} />)}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-default">
          <div className="h-9 w-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90 truncate leading-none">{user?.name}</p>
            <span className={cn('inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1', roleBg[perms.role])}>
              {perms.role}
            </span>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all shrink-0">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex flex-col w-60 shadow-2xl">
            <div className="absolute top-3 right-3 z-10">
              <button onClick={() => setMobileOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3"
          style={{ background: 'rgba(8,13,32,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setMobileOpen(true)}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-white/90 text-sm flex-1">Inventory IMS</span>
          <span className={cn('text-[9px] font-bold px-2 py-1 rounded-full border', roleBg[perms.role])}>{perms.role}</span>
        </header>

        <main className={cn(
          'flex-1 min-h-0',
          isPOS
            ? 'overflow-hidden flex flex-col p-3'
            : 'overflow-y-auto p-6'
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
