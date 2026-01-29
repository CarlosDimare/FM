
import React from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { Wallet, TrendingUp, TrendingDown, PieChart, Landmark, PiggyBank, Info } from 'lucide-react';
import { FMBox } from './FMUI';

interface EconomyViewProps {
  club: Club;
}

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="bg-white border border-[#a0b0a0] rounded-sm shadow-sm flex items-center gap-4 p-4 group hover:border-[#3a4a3a] transition-all">
    <div className="p-3 bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border border-[#a0b0a0] rounded-sm group-hover:scale-105 transition-transform shadow-inner">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate mb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>{label}</p>
      <p className={`text-lg md:text-xl font-black truncate tracking-tighter ${color}`} style={{ fontFamily: 'Verdana, sans-serif' }}>{value}</p>
    </div>
  </div>
);

const FinanceRow = ({ label, value, type }: { label: string, value: number, type: 'INCOME' | 'EXPENSE' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-[#d0d8d0] last:border-0 hover:bg-[#ccd9cc] px-2 transition-colors">
    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wide" style={{ fontFamily: 'Verdana, sans-serif' }}>{label}</span>
    <div className="flex items-center gap-2">
      {type === 'INCOME' ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-600" />}
      <span className={`font-mono font-bold text-sm ${type === 'INCOME' ? 'text-green-700' : 'text-slate-700'}`}>
        {type === 'EXPENSE' ? '-' : '+'}£{value.toLocaleString()}
      </span>
    </div>
  </div>
);

export const EconomyView: React.FC<EconomyViewProps> = ({ club }) => {
  const { balance, transferBudget, wageBudget, monthlyIncome, monthlyExpenses } = club.finances;
  const currentSalaries = world.getPlayersByClub(club.id).reduce((s, p) => s + p.salary, 0) + 
                          world.getStaffByClub(club.id).reduce((s, st) => s + st.salary, 0);
  
  // Real net balance should include the current actual salaries, not just the static expenses
  const actualMonthlyExpenses = currentSalaries + (club.reputation * 10);
  const netProfit = monthlyIncome - actualMonthlyExpenses;

  return (
    <div className="p-2 md:p-4 flex flex-col gap-4 h-full overflow-hidden bg-[#d4dcd4]">
      <header className="shrink-0 flex flex-col gap-1">
        <h2 className="text-xl md:text-3xl font-black text-[#1a1a1a] uppercase italic tracking-tighter leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>Economía del Club</h2>
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic" style={{ fontFamily: 'Verdana, sans-serif' }}>Balance financiero y presupuestos de gestión.</p>
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        <StatCard 
          icon={<Landmark className="text-slate-700" size={24} />} 
          label="Saldo Bancario" 
          value={`£${balance.toLocaleString()}`} 
          color="text-[#1a1a1a]"
        />
        <StatCard 
          icon={<PieChart className="text-green-700" size={24} />} 
          label="Fichajes" 
          value={`£${transferBudget.toLocaleString()}`} 
          color="text-green-800"
        />
        <StatCard 
          icon={<Wallet className="text-amber-700" size={24} />} 
          label="Salarial" 
          value={`£${wageBudget.toLocaleString()}`} 
          color="text-amber-800"
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0">
        
        {/* Monthly Forecast Panel */}
        <FMBox 
          title="Previsión Mensual" 
          noPadding 
          className="flex flex-col h-full shadow-lg"
          headerRight={
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm border ${netProfit >= 0 ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} / mes
            </span>
          }
        >
          <div className="p-2 space-y-1 bg-white flex-1 overflow-y-auto custom-scroll">
            <FinanceRow label="Ingresos (Entradas/Sponsors)" value={monthlyIncome} type="INCOME" />
            <FinanceRow label="Sueldos (Plantel/Staff)" value={currentSalaries} type="EXPENSE" />
            <FinanceRow label="Gastos Operativos" value={club.reputation * 10} type="EXPENSE" />
            
            <div className="mt-8 px-2 py-6 bg-[#f0f4f0] border-t border-[#a0b0a0] rounded-b-sm flex justify-between items-center shadow-inner">
              <span className="font-black text-slate-500 text-[11px] uppercase tracking-tighter" style={{ fontFamily: 'Verdana, sans-serif' }}>Balance Mensual Neto</span>
              <span className={`text-3xl font-black italic tracking-tighter ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
                £{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </FMBox>

        {/* Financial Health Panel */}
        <FMBox title="Salud Financiera" className="h-full flex flex-col justify-center shadow-lg">
          <div className="flex flex-col items-center text-center py-6 h-full justify-between">
            <div className="relative group mb-4">
              <div className="p-6 bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] rounded-full shadow-xl border-2 border-[#a0b0a0] group-hover:scale-105 transition-transform duration-500">
                <PiggyBank size={48} className="text-[#1a2a1a] drop-shadow-sm" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#3a4a3a] text-white text-[8px] font-black px-2 py-1 rounded shadow-lg border border-white/20">ESTADO</div>
            </div>

            <div className="max-w-md px-4 mb-6">
              <h3 className="text-xl font-black text-[#1a1a1a] mb-2 uppercase italic tracking-tighter" style={{ fontFamily: 'Verdana, sans-serif' }}>Estado Financiero</h3>
              <p className="text-slate-700 text-xs font-bold uppercase leading-relaxed tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>
                {balance > 10000000 ? 'El club goza de una situación financiera excelente. Tienes libertad para buscar refuerzos de calidad.' : 
                 balance > 1000000 ? 'La economía es estable, pero debes vigilar los gastos en sueldos para no comprometer el futuro.' : 
                 'Situación precaria. Se recomienda vender jugadores para aumentar el balance de inmediato.'}
              </p>
            </div>
            
            <div className="w-full bg-white p-4 rounded-sm border border-[#a0b0a0] shadow-inner space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-tighter" style={{ fontFamily: 'Verdana, sans-serif' }}>
                  <span>Gasto Salarial Actual</span>
                  <span className={currentSalaries > wageBudget ? 'text-red-600' : 'text-blue-700'}>{((currentSalaries/wageBudget)*100).toFixed(1)}%</span>
               </div>
               <div className="w-full bg-slate-200 h-4 rounded-[1px] overflow-hidden border border-[#a0b0a0] relative">
                  <div 
                    className={`h-full transition-all duration-1000 ${currentSalaries > wageBudget ? 'bg-red-600' : 'bg-gradient-to-r from-blue-700 to-blue-500'}`} 
                    style={{ width: `${Math.min(100, (currentSalaries/wageBudget)*100)}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-pulse opacity-30"></div>
                  </div>
               </div>
               <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-1.5">
                    <Info size={12} className="text-slate-400" />
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Presupuesto Limite: £{wageBudget.toLocaleString()}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-700 uppercase">{currentSalaries.toLocaleString()} / £{wageBudget.toLocaleString()}</span>
               </div>
            </div>
          </div>
        </FMBox>
      </div>
    </div>
  );
};
