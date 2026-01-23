
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
    <div className="p-8 flex flex-col gap-8 h-full overflow-y-auto" style={{ backgroundColor: '#dcdcdc' }}>
      <header>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter" style={{ color: '#333' }}>Economía del Club</h2>
        <p style={{ color: '#999' }}>Balance financiero y presupuestos de gestión.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Landmark style={{ color: '#666' }} />} 
          label="Saldo Bancario" 
          value={`£${balance.toLocaleString()}`} 
          color="#333"
        />
        <StatCard 
          icon={<PieChart style={{ color: '#666' }} />} 
          label="Presupuesto Fichajes" 
          value={`£${transferBudget.toLocaleString()}`} 
          color="#666"
        />
        <StatCard 
          icon={<Wallet style={{ color: '#666' }} />} 
          label="Presupuesto Salarial" 
          value={`£${wageBudget.toLocaleString()}/mes`} 
          color="#666"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
          <div className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
            <h3 className="font-black uppercase tracking-widest text-xs" style={{ color: '#333' }}>Previsión Mensual</h3>
            <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: netProfit >= 0 ? 'rgba(102, 102, 102, 0.1)' : 'rgba(153, 153, 153, 0.1)', color: netProfit >= 0 ? '#666' : '#999' }}>
              {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} / mes
            </span>
          </div>
          <div className="p-8 space-y-6">
            <FinanceRow label="Ingresos de Taquilla y Sponsors" value={monthlyIncome} type="INCOME" />
            <FinanceRow label="Sueldos de Jugadores y Staff" value={currentSalaries} type="EXPENSE" />
            <FinanceRow label="Mantenimiento de Instalaciones" value={club.reputation * 10} type="EXPENSE" />
            <div className="pt-6 border-t flex justify-between items-center" style={{ borderColor: '#999' }}>
              <span className="font-bold" style={{ color: '#666' }}>Balance Neto Mensual</span>
              <span className="text-xl font-black" style={{ color: netProfit >= 0 ? '#666' : '#999' }}>
                £{netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-8 shadow-xl flex flex-col justify-center items-center text-center" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
          <div className="p-6 rounded-full mb-6" style={{ backgroundColor: '#e8e8e8' }}>
            <PiggyBank size={48} style={{ color: '#666' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#333' }}>Salud Financiera</h3>
          <p className="text-sm max-w-xs mb-6" style={{ color: '#999' }}>
            {balance > 10000000 ? 'El club goza de una situación financiera excelente. Tienes libertad para buscar refuerzos de calidad.' : 
             balance > 1000000 ? 'La economía es estable, pero debes vigilar los gastos en sueldos para no comprometer el futuro.' : 
             'Situación precaria. Se recomienda vender jugadores para aumentar el balance.'}
          </p>
          <div className="w-full h-4 rounded-full overflow-hidden border" style={{ backgroundColor: '#1e293b', borderColor: '#999' }}>
             <div 
               className="h-full transition-all duration-1000"
               style={{ width: `${Math.min(100, (currentSalaries/wageBudget)*100)}%`, backgroundColor: currentSalaries > wageBudget ? '#999' : '#666' }}
             ></div>
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-widest" style={{ color: '#999' }}>
            Uso del Presupuesto Salarial: {((currentSalaries/wageBudget)*100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="p-6 rounded-2xl shadow-xl flex items-center gap-6" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
    <div className="p-4 rounded-xl shadow-inner" style={{ backgroundColor: '#e8e8e8' }}>{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#999' }}>{label}</p>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
  </div>
);

const FinanceRow = ({ label, value, type }: { label: string, value: number, type: 'INCOME' | 'EXPENSE' }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="font-medium" style={{ color: '#999' }}>{label}</span>
    <div className="flex items-center gap-2">
      {type === 'INCOME' ? <TrendingUp size={14} style={{ color: '#666' }} /> : <TrendingDown size={14} style={{ color: '#999' }} />}
      <span className="font-mono font-bold" style={{ color: type === 'INCOME' ? '#666' : '#ccc' }}>
        {type === 'EXPENSE' ? '-' : '+'}£{value.toLocaleString()}
      </span>
    </div>
  </div>
);
