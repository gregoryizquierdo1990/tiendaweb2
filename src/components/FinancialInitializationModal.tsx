import React, { useState } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

interface FinancialInitializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const FinancialInitializationModal: React.FC<FinancialInitializationModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'balances' | 'cxc' | 'cxp'>('balances');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="text-xl font-black">Inicialización Contable</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X /></button>
        </div>
        
        <div className="flex border-b">
          {(['balances', 'cxc', 'cxp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold text-xs ${activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
            >
              {tab === 'balances' ? 'Saldos Iniciales' : tab === 'cxc' ? 'Cuentas por Cobrar' : 'Cuentas por Pagar'}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Content based on activeTab will go here */}
          <div className="p-8 text-center text-slate-400 text-sm">
            <p>Configuración de {activeTab}. (Interfaz en desarrollo)</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 font-bold cursor-pointer">Cancelar</button>
          <button onClick={() => onSave({})} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold cursor-pointer">Guardar Configuración</button>
        </div>
      </div>
    </div>
  );
};
