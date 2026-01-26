
import React from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { Wallet, TrendingUp, TrendingDown, PieChart, Landmark, PiggyBank } from 'lucide-react';

interface EconomyViewProps {
  club: Club;
}

export const EconomyView: React.FC<EconomyViewProps> = ({ club }) => {
  const { balance, transferBudget, wageBudget, monthlyIncome, monthlyExpenses } = club.finances;
  const netProfit = monthlyIncome - monthlyExpenses;

  const currentSalaries = world.getPlayersByClub(club.id).reduce((s, p) => s + p.salary, 0) + 
                          world.getStaffByClub(club.id).reduce((s, st) => s + st.salary, 0);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 h-full overflow-hidden bg-slate-300">
      <header className="shrink-0 border-b border-slate-400 pb-2">
        <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">Economía del Club</h2>
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Balance financiero y presupuestos de gestión.</p>
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 shrink-0">
        <StatCard 
          icon={<Landmark className="text-slate-700" size={18} />} 
          label="Saldo Bancario" 
          value={`£${balance.toLocaleString()}`} 
          color="text-slate-950"
        />
        <StatCard 
          icon={<PieChart className="text-green-700" size={18} />} 
          label="Fichajes" 
          value={`£${transferBudget.toLocaleString()}`} 
          color="text-green-800"
        />
        <StatCard 
          icon={<Wallet className="text-amber-700" size={18} />} 
          label="Salarial" 
          value={`£${wageBudget.toLocaleString()}`} 
          color="text-amber-800"
        />
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        
        {/* Monthly Forecast Panel */}
        <div className="bg-slate-200 rounded-sm border border-slate-400 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-slate-300 px-4 py-2 border-b border-slate-400 flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-700">Previsión Mensual</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${netProfit >= 0 ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} / mes
            </span>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            <FinanceRow label="Ingresos (Entradas/Sponsors)" value={monthlyIncome} type="INCOME" />
            <FinanceRow label="Sueldos (Plantel/Staff)" value={currentSalaries} type="EXPENSE" />
            <FinanceRow label="Gastos Operativos" value={club.reputation * 10} type="EXPENSE" />
            
            <div className="h-px bg-slate-300 my-2"></div>
            
            <div className="flex justify-between items-center">
              <span className="font-black text-slate-500 text-[10px] uppercase">Balance Neto</span>
              <span className={`text-lg font-black ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                £{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Health Panel */}
        <div className="bg-slate-200 rounded-sm border border-slate-400 p-6 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-slate-300 rounded-full mb-4 shadow-inner border border-slate-400">
            <PiggyBank size={32} className="text-slate-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1 uppercase italic tracking-tight">Estado Financiero</h3>
          <p className="text-slate-600 text-[10px] font-bold uppercase max-w-xs mb-6 leading-relaxed">
            {balance > 10000000 ? 'El club goza de una situación financiera excelente. Tienes libertad para buscar refuerzos de calidad.' : 
             balance > 1000000 ? 'La economía es estable, pero debes vigilar los gastos en sueldos para no comprometer el futuro.' : 
             'Situación precaria. Se recomienda vender jugadores para aumentar el balance.'}
          </p>
          
          <div className="w-full space-y-1">
             <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 px-1">
                <span>Gasto Salarial Actual</span>
                <span>{((currentSalaries/wageBudget)*100).toFixed(1)}%</span>
             </div>
             <div className="w-full bg-slate-300 h-3 rounded-full overflow-hidden border border-slate-400">
                <div 
                  className={`h-full transition-all duration-1000 ${currentSalaries > wageBudget ? 'bg-red-600' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(100, (currentSalaries/wageBudget)*100)}%` }}
                ></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="bg-slate-100 p-3 rounded-sm border border-slate-400 shadow-sm flex items-center gap-3">
    <div className="p-2 bg-slate-200 rounded-sm border border-slate-300">{icon}</div>
    <div className="min-w-0">
      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">{label}</p>
      <p className={`text-sm md:text-base font-black truncate ${color}`}>{value}</p>
    </div>
  </div>
);

const FinanceRow = ({ label, value, type }: { label: string, value: number, type: 'INCOME' | 'EXPENSE' }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-wide">{label}</span>
    <div className="flex items-center gap-1">
      {type === 'INCOME' ? <TrendingUp size={12} className="text-green-600" /> : <TrendingDown size={12} className="text-red-600" />}
      <span className={`font-mono font-bold ${type === 'INCOME' ? 'text-green-700' : 'text-slate-700'}`}>
        {type === 'EXPENSE' ? '-' : '+'}£{value.toLocaleString()}
      </span>
    </div>
  </div>
);
