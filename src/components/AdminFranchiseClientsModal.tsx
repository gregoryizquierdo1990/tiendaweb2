import React from 'react';
import { Users, Building, X, Phone, Mail, DollarSign, Calendar, Tv, ShieldCheck } from 'lucide-react';
import { FranchiseTenant } from '../types';
import { useAppStore } from '../store/useAppStore';

interface AdminFranchiseClientsModalProps {
  franchise: FranchiseTenant;
  customers?: any[];
  orders?: any[];
  onClose: () => void;
}

export const AdminFranchiseClientsModal: React.FC<AdminFranchiseClientsModalProps> = ({
  franchise,
  customers: propCustomers,
  orders: propOrders,
  onClose
}) => {
  // Use global store
  const { customers: storeCustomers, orders: storeOrders } = useAppStore();
  const customers = propCustomers || storeCustomers;
  const orders = propOrders || storeOrders;

  // Filter orders or customers assigned to this franchise or matching its name/phone/id
  const franchiseOrders = orders.filter(
    (o) => o.assignedSellerId === franchise.id || o.assignedSellerName?.toLowerCase().includes(franchise.businessName.toLowerCase())
  );


  const subFranchises = franchise.subFranchises || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Ficha de Clientes & Red de Franquicia</h3>
              <p className="text-slate-300 text-xs">
                {franchise.businessName} • Propietario: {franchise.ownerName} ({franchise.phone})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 bg-slate-50 flex-1">
          {/* Section 1: Sub-Franchises / Resellers */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-600" />
              <span>Sub-Franquiciados / Revendedores de la Red ({subFranchises.length})</span>
            </h4>

            {subFranchises.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No hay sub-franquiciados registrados en esta red actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subFranchises.map((sub: any) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-xs font-black">{sub.businessName}</strong>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Titular: <strong>{sub.ownerName}</strong></p>
                    <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                      <div>Tel: {sub.phone}</div>
                      <div>Email: {sub.email}</div>
                      <div>Registro: {sub.createdAt}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Clients / Orders under this franchise */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-600" />
              <span>Clientes & Suscriptores Registrados ({franchiseOrders.length})</span>
            </h4>

            {franchiseOrders.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No hay pedidos o clientes vinculados directamente a esta franquicia todavía.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Contacto</th>
                      <th className="p-3">Servicio Contratado</th>
                      <th className="p-3">Total / Moneda</th>
                      <th className="p-3">Fecha Orden</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {franchiseOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{ord.customerName}</td>
                        <td className="p-3 font-mono text-[11px]">
                          <div>{ord.customerPhone}</div>
                          <div className="text-slate-400">{ord.customerEmail}</div>
                        </td>
                        <td className="p-3 font-semibold text-indigo-600">{ord.productName} ({ord.duration})</td>
                        <td className="p-3 font-mono font-bold">${ord.total.toFixed(2)} {ord.currency}</td>
                        <td className="p-3 text-slate-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'confirmed' || ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
