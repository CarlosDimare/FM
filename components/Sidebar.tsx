
import React, { useState } from 'react';
import { Home, Users, Trophy, Calendar, Clipboard, ListOrdered, Sun, Info, ShoppingBag, Search, Wallet, X, MessageSquare, Inbox, ChevronDown, ChevronRight, Globe, Briefcase, Building2 } from 'lucide-react';
import { Club, SquadType, Competition } from '../types';
import { world } from '../services/worldManager';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  club: Club;
  onVacation: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, club, onVacation, isSidebarOpen, setIsSidebarOpen }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'SENIOR': true,
    'RESERVE': false,
    'U20': false,
    'MARKET': false,
    'TORNEOS': false
  });

  const unreadMessages = world.inbox.filter(m => !m.isRead).length;

  const clubTournaments = world.competitions.filter(comp => {
     if (comp.id === club.leagueId) return true;
     if (comp.type === 'CUP' && comp.country === world.competitions.find(l => l.id === club.leagueId)?.country) return true;
     if (comp.type.startsWith('CONTINENTAL')) return true;
     return false;
  });

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSquadSubMenu = (squadType: SquadType, label: string) => {
    const isOpen = openMenus[squadType];
    return (
      <div className="mb-1">
        <button 
           onClick={() => toggleMenu(squadType)}
           className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2"><Users size={14} /> {label}</div>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {isOpen && (
          <div className="mt-1 ml-4 space-y-1 border-l border-slate-300 animate-in slide-in-from-left-2 duration-200">
            <SubNavItem id={`${squadType}_SQUAD`} label="Plantel" icon={Users} active={currentView === `${squadType}_SQUAD`} onClick={() => setView(`${squadType}_SQUAD`)} />
            <SubNavItem id={`${squadType}_TACTICS`} label="Tácticas" icon={Clipboard} active={currentView === `${squadType}_TACTICS`} onClick={() => setView(`${squadType}_TACTICS`)} />
            <SubNavItem id={`${squadType}_SCHEDULE`} label="Partidos" icon={Calendar} active={currentView === `${squadType}_SCHEDULE`} onClick={() => setView(`${squadType}_SCHEDULE`)} />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-[90] lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
      <div className={`fixed lg:static top-0 lg:top-0 left-0 bottom-0 z-[100] w-64 bg-slate-100 border-r border-slate-300 h-full flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="lg:hidden p-4 border-b border-slate-300 flex justify-between items-center shrink-0">
          <span className="font-bold text-slate-900 text-sm">Menú</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-600"><X size={20} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
          <div className="mb-2">
             <NavItem id="HOME" label="Inicio" icon={Home} active={currentView === 'HOME'} onClick={() => setView('HOME')} />
             <NavItem id="INBOX" label="Buzón" icon={Inbox} active={currentView === 'INBOX'} onClick={() => setView('INBOX')} badge={unreadMessages} />
          </div>

          <div className="h-px bg-slate-300 mx-4 my-2"></div>

          {renderSquadSubMenu('SENIOR', 'Primer Equipo')}
          {renderSquadSubMenu('RESERVE', 'Reserva')}
          {renderSquadSubMenu('U20', 'Sub 20')}

          <div className="h-px bg-slate-300 mx-4 my-2"></div>

          <div className="mb-1">
            <button onClick={() => toggleMenu('TORNEOS')} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
              <div className="flex items-center gap-2"><Trophy size={14} /> Competiciones</div>
              {openMenus['TORNEOS'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {openMenus['TORNEOS'] && (
              <div className="mt-1 ml-4 space-y-1 border-l border-slate-300">
                {clubTournaments.map(comp => (
                  <SubNavItem key={comp.id} id={`COMP_${comp.id}`} label={comp.name} icon={comp.type.startsWith('CONT') ? Globe : Trophy} active={currentView === `COMP_${comp.id}`} onClick={() => setView(`COMP_${comp.id}`)} />
                ))}
              </div>
            )}
          </div>

          <div className="mb-1">
            <button onClick={() => toggleMenu('MARKET')} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
              <div className="flex items-center gap-2"><Globe size={14} /> Ojeo y Fichajes</div>
              {openMenus['MARKET'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {openMenus['MARKET'] && (
              <div className="mt-1 ml-4 space-y-1 border-l border-slate-300">
                 <SubNavItem id="MARKET" label="Mercado" icon={ShoppingBag} active={currentView === 'MARKET'} onClick={() => setView('MARKET')} />
                 <SubNavItem id="SEARCH" label="Buscar Jugador" icon={Search} active={currentView === 'SEARCH'} onClick={() => setView('SEARCH')} />
                 <SubNavItem id="NEGOTIATIONS" label="Negociaciones" icon={MessageSquare} active={currentView === 'NEGOTIATIONS'} onClick={() => setView('NEGOTIATIONS')} />
                 <SubNavItem id="CLUBS_LIST" label="Clubes" icon={Building2} active={currentView === 'CLUBS_LIST'} onClick={() => setView('CLUBS_LIST')} />
              </div>
            )}
          </div>

          <div className="h-px bg-slate-300 mx-4 my-2"></div>

          <NavItem id="ECONOMY" label="Economía" icon={Wallet} active={currentView === 'ECONOMY'} onClick={() => setView('ECONOMY')} />
          <NavItem id="STAFF" label="Empleados" icon={Briefcase} active={currentView === 'STAFF'} onClick={() => setView('STAFF')} />
          <NavItem id="CLUB_REPORT" label="Información Club" icon={Info} active={currentView === 'CLUB_REPORT'} onClick={() => setView('CLUB_REPORT')} />

          <div className="mt-auto pt-6 px-4 pb-4">
             <button onClick={onVacation} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded border border-slate-300 shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest active:scale-95">
                <Sun size={14} /> Ir de Vacaciones
             </button>
          </div>
        </nav>
      </div>
    </>
  );
};

const NavItem = ({ id, label, icon: Icon, active, onClick, badge }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-6 py-2.5 text-xs font-bold transition-colors border-l-4 ${active ? 'bg-white text-slate-950 border-slate-950' : 'border-transparent text-slate-500 hover:bg-white hover:text-slate-900'}`}>
    <div className="flex items-center"><Icon className={`w-4 h-4 mr-3 ${active ? 'text-slate-950' : 'text-slate-400'}`} /> {label}</div>
    {badge > 0 && <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 rounded-sm">{badge}</span>}
  </button>
);

const SubNavItem = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center px-4 py-2 text-[10px] font-bold transition-colors ${active ? 'text-slate-950 bg-white rounded-r' : 'text-slate-500 hover:text-slate-900'}`}><Icon className={`w-3 h-3 mr-2 ${active ? 'text-slate-950' : ''}`} /> <span className="truncate">{label}</span></button>
);
