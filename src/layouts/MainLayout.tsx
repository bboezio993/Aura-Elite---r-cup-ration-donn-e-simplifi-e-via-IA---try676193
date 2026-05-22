import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Activity, 
  Heart, 
  Moon, 
  Zap, 
  Droplets,
  Brain,
  Calendar,
  Settings,
  User,
  ChevronRight,
  Link as LinkIcon,
  ShieldAlert,
  Cloud,
  CloudOff,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CloudMigrationAssistant } from '../components/CloudMigrationAssistant';
import { useStore } from '../store/useStore';

export function MainLayout() {
  const syncStatuses = useStore(state => state.syncStatuses) || {};
  const retrySync = useStore(state => state.retrySync);
  const isMigratedToCloud = useStore(state => state.isMigratedToCloud);

  const syncItems = Object.values(syncStatuses);
  const pendingCount = syncItems.filter(i => i.status === 'pending').length;
  const failedCount = syncItems.filter(i => i.status === 'failed').length;

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Cloud Migration Assistant */}
      <CloudMigrationAssistant />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border hidden md:flex flex-col p-6 gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="text-primary-foreground w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter">AURA ELITE</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem to="/" icon={<Activity size={20} />} label="Dashboard" />
          <NavItem to="/biometrics" icon={<Heart size={20} />} label="Biométrie" />
          <NavItem to="/sleep" icon={<Moon size={20} />} label="Sommeil" />
          <NavItem to="/cycle" icon={<Droplets size={20} className="text-[#FF2D55]" />} label="Cycle Menstruel" />
          <NavItem to="/training" icon={<Zap size={20} />} label="Entraînement" />
          <NavItem to="/nutrition" icon={<Droplets size={20} />} label="Nutrition" />
          <NavItem to="/mental" icon={<Brain size={20} />} label="Mental" />
          <Separator className="my-2" />
          <NavItem to="/connections" icon={<LinkIcon size={20} />} label="Sources & Données" />
          <NavItem to="/confidentiality" icon={<ShieldAlert size={20} />} label="Sécurité & Cloud" />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <Separator />
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${isActive ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Athlète Elite</p>
              <p className="text-xs text-muted-foreground truncate">Premium Plan</p>
            </div>
            <Settings size={18} className="text-muted-foreground shrink-0" />
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs font-mono">V1.0.4-ALPHA</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isMigratedToCloud && (
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                    failedCount > 0 
                      ? 'border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10'
                      : pendingCount > 0
                        ? 'border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10'
                        : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {failedCount > 0 ? (
                    <>
                      <CloudOff size={14} className="text-red-500" />
                      <span className="font-semibold">{failedCount} échecs</span>
                    </>
                  ) : pendingCount > 0 ? (
                    <>
                      <Loader2 size={14} className="text-amber-500 animate-spin" />
                      <span>{pendingCount} en attente</span>
                    </>
                  ) : (
                    <>
                      <Cloud size={14} className="text-emerald-500" />
                      <span>Cloud synchronisé</span>
                    </>
                  )}
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-xl rounded-xl p-4 z-50 text-xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">Statut Écritures Cloud</span>
                      <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">Fermer</button>
                    </div>

                    {syncItems.length === 0 ? (
                      <p className="text-muted-foreground italic text-[10px] text-center py-2">Aucune modification cloud mesurée lors de cette session.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {syncItems.map(item => (
                          <div key={item.id} className="p-2 bg-secondary/20 rounded-lg flex justify-between items-center gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[9px] uppercase text-foreground">{item.domain}</span>
                                <span className="text-[8px] text-muted-foreground font-mono">{new Date(item.updatedAt).toLocaleTimeString()}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground block truncate" title={item.id}>{item.id}</span>
                              {item.error && <span className="text-[9px] text-red-400 block break-words mt-0.5">{item.error}</span>}
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {item.status === 'pending' && (
                                <Loader2 size={12} className="animate-spin text-amber-500" />
                              )}
                              {item.status === 'synced' && (
                                <span className="text-emerald-500 font-bold text-[10px]">✔</span>
                              )}
                              {item.status === 'failed' && (
                                <button
                                  onClick={() => retrySync(item.id)}
                                  className="p-1 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded border border-red-500/20 cursor-pointer"
                                  title="Relancer l'écriture"
                                >
                                  <RefreshCw size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
        ${isActive ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}
      `}
    >
      {({ isActive }) => (
        <>
          {icon}
          <span className="text-sm">{label}</span>
          {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
        </>
      )}
    </NavLink>
  );
}
