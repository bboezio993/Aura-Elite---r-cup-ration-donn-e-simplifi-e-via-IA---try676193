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
  ShieldAlert
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CloudMigrationAssistant } from '../components/CloudMigrationAssistant';

export function MainLayout() {
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
            {/* Header actions will be injected by pages if needed, or kept simple here */}
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
