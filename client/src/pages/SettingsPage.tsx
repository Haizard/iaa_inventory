import { useState } from 'react';
import {
  Gear, FileText, GitBranch, Database, MonitorPlay,
  Download, CheckCircle, BookOpen, Shield, CloudArrowDown,
} from '@phosphor-icons/react';
import RoleGuard from '@/components/RoleGuard';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  generateUseCaseDiagram,
  generateERDiagram,
  generateFlowchart,
  generateDatabaseDesign,
} from '@/lib/diagrams';

interface DocItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  glass: string;
  iconBg: string;
  fn: () => void;
}

export default function SettingsPage() {
  const { canManageUsers } = usePermissions();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  const handleDownload = async (id: string, fn: () => void) => {
    setDownloading(id);
    try {
      await Promise.resolve(fn());
      setDone(prev => new Set([...prev, id]));
      setTimeout(() => setDone(prev => { const s = new Set(prev); s.delete(id); return s; }), 3000);
    } finally {
      setDownloading(null);
    }
  };

  const docs: DocItem[] = [
    {
      id: 'usecase',
      title: 'Use Case Diagram',
      description: 'Shows all system actors (Admin, Manager, Staff, Customer) and their interactions with every feature of the system.',
      icon: GitBranch,
      color: 'text-blue-400',
      glass: 'glass-blue',
      iconBg: 'bg-blue-500/20',
      fn: generateUseCaseDiagram,
    },
    {
      id: 'erd',
      title: 'Entity Relationship Diagram',
      description: 'Full ER diagram showing all 10 database entities, their attributes, primary keys, foreign keys and cardinality relationships.',
      icon: Database,
      color: 'text-violet-400',
      glass: 'glass-violet',
      iconBg: 'bg-violet-500/20',
      fn: generateERDiagram,
    },
    {
      id: 'flowchart',
      title: 'System Flowchart',
      description: 'End-to-end process flow covering authentication, dashboard navigation, POS sales checkout and reporting workflows.',
      icon: MonitorPlay,
      color: 'text-emerald-400',
      glass: 'glass-emerald',
      iconBg: 'bg-emerald-500/20',
      fn: generateFlowchart,
    },
    {
      id: 'dbdesign',
      title: 'Database Design Document',
      description: 'Complete schema specification: all tables, column types, constraints, indexes, enumerations and foreign key rules.',
      icon: FileText,
      color: 'text-orange-400',
      glass: 'glass-orange',
      iconBg: 'bg-orange-500/20',
      fn: generateDatabaseDesign,
    },
  ];

  const downloadAll = async () => {
    for (const d of docs) {
      await handleDownload(d.id, d.fn);
      await new Promise(r => setTimeout(r, 300));
    }
  };

  return (
    <RoleGuard allowed={canManageUsers} message="Settings are only accessible to Admins.">
      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-500/20 rounded-xl p-2.5">
              <Gear className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Settings</h1>
                <p className="text-xs text-white/50 mt-0.5">System documentation and project resources</p>
            </div>
          </div>
          <button
            onClick={downloadAll}
            disabled={!!downloading}
            className="btn-glow flex items-center gap-2 px-4 h-9 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download All Documents
          </button>
        </div>

        {/* Project Info Card */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Project Overview</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {[
              { label: 'Project', value: 'IAA Inventory Management System' },
              { label: 'Group', value: 'Group No. 86' },
              { label: 'Institution', value: 'Institute of Accountancy Arusha' },
              { label: 'Stack', value: 'React + Node.js + PostgreSQL' },
              { label: 'ORM', value: 'Prisma v5' },
              { label: 'Deployment', value: 'Vercel + Supabase' },
            ].map(item => (
              <div key={item.label} className="glass rounded-xl p-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">{item.label}</p>
                <p className="text-white/80 font-medium text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Info */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CloudArrowDown className="h-5 w-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">System Modules</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
            {[
              ['Authentication', 'JWT-based login with role guards (Admin / Manager / Staff)'],
              ['POS / Sales', 'Point-of-sale with cart, discounts, payment methods, receipt generation'],
              ['Purchases', 'Purchase order management with supplier tracking and stock updates'],
              ['Inventory', 'Products, categories, brands with stock level monitoring'],
              ['Customers', 'Customer master with sales history linkage'],
              ['Reports', 'Sales, Purchases and Stock reports with CSV & PDF export'],
              ['Users', 'User management with role-based access control'],
              ['Documents', 'Auto-generated system diagrams downloadable as PDF'],
            ].map(([mod, desc]) => (
              <div key={mod} className="flex gap-3 p-2 glass rounded-xl">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white/80 text-xs">{mod}</p>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Permissions */}
          <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-rose-400" />
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Role Permissions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="text-left py-2 px-3 text-white/40 font-bold uppercase tracking-widest">Permission</th>
                  {['Admin','Manager','Staff'].map(r => (
                    <th key={r} className="py-2 px-3 text-white/60 font-bold">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Manage Users',    true,  false, false],
                  ['Manage Products', true,  true,  false],
                  ['View Reports',    true,  true,  false],
                  ['Purchases',       true,  true,  false],
                  ['Record Sales',    true,  true,  true ],
                  ['Customers',       true,  true,  false],
                  ['Dashboard Full',  true,  true,  false],
                  ['Settings',        true,  false, false],
                ].map(([perm, ...vals], i) => (
                  <tr key={String(perm)} style={{ background: i%2===0?'rgba(255,255,255,0.02)':'transparent' }}>
                    <td className="py-2 px-3 text-white/60">{String(perm)}</td>
                    {(vals as boolean[]).map((v, vi) => (
                      <td key={vi} className="py-2 px-3 text-center">
                        {v
                          ? <span className="badge-success text-[10px] font-bold px-2 py-0.5 rounded-full">Yes</span>
                          : <span className="badge-danger text-[10px] font-bold px-2 py-0.5 rounded-full">No</span>
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documentation Downloads */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Project Documentation</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-info">PDF</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {docs.map(d => (
              <div key={d.id} className={`glass ${d.glass} rounded-2xl p-4 hover-lift flex flex-col gap-3`}>
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-2xl ${d.iconBg} flex items-center justify-center shrink-0`}>
                    <d.icon className={`h-5 w-5 ${d.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-xs">{d.title}</p>
                    <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{d.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(d.id, d.fn)}
                  disabled={!!downloading}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold transition-all border',
                    done.has(d.id)
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : 'border-white/10 glass text-white/70 hover:text-white hover:bg-white/10'
                  )}
                >
                  {downloading === d.id ? (
                    <><div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Generating…</>
                  ) : done.has(d.id) ? (
                    <><CheckCircle className="h-4 w-4" /> Downloaded!</>
                  ) : (
                    <><Download className="h-4 w-4" /> Download PDF</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}
