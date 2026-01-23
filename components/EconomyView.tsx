
import React from 'react';
// Fix: Import world from services/worldManager instead of types
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
    <div className="p-8 flex flex-col gap-8 h-full overflow-y-auto">
      <header>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Economía del Club</h2>
        <p className="text-slate-400">Balance financiero y presupuestos de gestión.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Landmark className="text-blue-400" />} 
          label="Saldo Bancario" 
          value={`£${balance.toLocaleString()}`} 
          color="text-white"
        />
        <StatCard 
          icon={<PieChart className="text-green-400" />} 
          label="Presupuesto Fichajes" 
          value={`£${transferBudget.toLocaleString()}`} 
          color="text-green-400"
        />
        <StatCard 
          icon={<Wallet className="text-yellow-400" />} 
          label="Presupuesto Salarial" 
          value={`£${wageBudget.toLocaleString()}/mes`} 
          color="text-yellow-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-xs text-white">Previsión Mensual</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded ${netProfit >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} / mes
            </span>
          </div>
          <div className="p-8 space-y-6">
            <FinanceRow label="Ingresos de Taquilla y Sponsors" value={monthlyIncome} type="INCOME" />
            <FinanceRow label="Sueldos de Jugadores y Staff" value={currentSalaries} type="EXPENSE" />
            <FinanceRow label="Mantenimiento de Instalaciones" value={club.reputation * 10} type="EXPENSE" />
            <div className="pt-6 border-t border-slate-700 flex justify-between items-center">
              <span className="font-bold text-slate-300">Balance Neto Mensual</span>
              <span className={`text-xl font-black ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                £{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl flex flex-col justify-center items-center text-center">
          <div className="p-6 bg-blue-600/10 rounded-full mb-6">
            <PiggyBank size={48} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Salud Financiera</h3>
          <p className="text-slate-400 text-sm max-w-xs mb-6">
            {balance > 10000000 ? 'El club goza de una situación financiera excelente. Tienes libertad para buscar refuerzos de calidad.' : 
             balance > 1000000 ? 'La economía es estable, pero debes vigilar los gastos en sueldos para no comprometer el futuro.' : 
             'Situación precaria. Se recomienda vender jugadores para aumentar el balance.'}
          </p>
          <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-700">
             <div 
               className={`h-full transition-all duration-1000 ${currentSalaries > wageBudget ? 'bg-red-500' : 'bg-blue-500'}`} 
               style={{ width: `${Math.min(100, (currentSalaries/wageBudget)*100)}%` }}
             ></div>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Uso del Presupuesto Salarial: {((currentSalaries/wageBudget)*100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-6">
    <div className="p-4 bg-slate-900 rounded-xl shadow-inner">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);

const FinanceRow = ({ label, value, type }: { label: string, value: number, type: 'INCOME' | 'EXPENSE' }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-400 font-medium">{label}</span>
    <div className="flex items-center gap-2">
      {type === 'INCOME' ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
      <span className={`font-mono font-bold ${type === 'INCOME' ? 'text-green-500' : 'text-slate-200'}`}>
        {type === 'EXPENSE' ? '-' : '+'}£{value.toLocaleString()}
      </span>
    </div>
  </div>
);
