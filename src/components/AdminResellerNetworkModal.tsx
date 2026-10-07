import React, { useState } from 'react';
import { Users, Plus, Check, Trash2, X, Building, Phone, Mail } from 'lucide-react';
import { FranchiseTenant } from '../types';

interface AdminResellerNetworkModalProps {
  franchise: FranchiseTenant;
  onUpdateFranchise: (updated: FranchiseTenant) => void;
  onClose: () => void;
}

export const AdminResellerNetworkModal: React.FC<AdminResellerNetworkModalProps> = ({
  franchise,
  onUpdateFranchise,
  onClose
}) => {
  const [subFranchises, setSubFranchises] = useState<any[]>(franchise.subFranchises || []);
  const [bizName, setBizName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Module Permissions Cascading states
  const [subSelectedModules, setSubSelectedModules] = useState<Record<string, boolean>>({});

  // Filter modules actually enabled in the parent franchise
  const parentEnabledModules = Object.entries(franchise.enabledModules || {})
    .filter(([_, enabled]) => enabled === true)
    .map(([key]) => key);

  const handleAddSubFranchise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName || !ownerName || !phone) return;

    // Build sub-franchise enabled modules dict restricting it to what parent has enabled
    const subEnabledModules: Record<string, boolean> = {};
    parentEnabledModules.forEach((key) => {
      subEnabledModules[key] = Boolean(subSelectedModules[key]);
    });

    const newSub = {
      id: `sub-${Date.now()}`,
      businessName: bizName,
      ownerName,
      phone,
      email: email || `${bizName.toLowerCase().replace(/\s+/g, '')}@reseller.com`,
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0],
      enabledModules: subEnabledModules
    };

    const updatedList = [...subFranchises, newSub];
    setSubFranchises(updatedList);
    onUpdateFranchise({
      ...franchise,
      subFranchises: updatedList
    });

    setBizName('');
    setOwnerName('');
    setPhone('');
    setEmail('');
    setSubSelectedModules({});
  };

  const handleDeleteSub = (subId: string) => {
    const updatedList = subFranchises.filter((s: any) => s.id !== subId);
    setSubFranchises(updatedList);
    onUpdateFranchise({
      ...franchise,
      subFranchises: updatedList
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="p-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Red de Revendedores & Sub-Franquiciados</h3>
              <p className="text-slate-300 text-xs">
                {franchise.businessName} • Gestión de red comercial descendiente
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

        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleAddSubFranchise} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Registrar Nuevo Sub-Franquiciado / Revendedor</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre Comercial / Negocio:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Streaming Caracas Este"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre del Propietario:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Gomez"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Teléfono / WhatsApp:</label>
                <input
                  type="text"
                  required
                  placeholder="+58 412..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Correo Electrónico:</label>
                <input
                  type="email"
                  placeholder="revendedor@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-mono"
                />
              </div>
            </div>

            {/* Permisos en Cascada PRO */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/50 space-y-2">
              <h5 className="text-[10px] font-black uppercase text-purple-950 flex items-center gap-1">
                <span>⚡ Cascada de Permisos PRO (Módulos Heredados de la Matriz)</span>
              </h5>
              <p className="text-[9px] text-slate-500 leading-normal">
                Como franquiciado matriz, puedes habilitarle a tus sub-franquiciados únicamente los módulos Pro que tú posees activos.
              </p>

              {parentEnabledModules.length === 0 ? (
                <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                  ⚠️ Tu franquicia matriz no posee ningún módulo PRO activo. No hay opciones seleccionables para sub-franquiciados.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {parentEnabledModules.map((moduleKey) => (
                    <label key={moduleKey} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-purple-300 transition cursor-pointer text-[10px]">
                      <input
                        type="checkbox"
                        checked={Boolean(subSelectedModules[moduleKey])}
                        onChange={(e) => {
                          setSubSelectedModules(prev => ({
                            ...prev,
                            [moduleKey]: e.target.checked
                          }));
                        }}
                        className="rounded border-slate-300 bg-white text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-extrabold capitalize text-slate-700">{moduleKey}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Sub-Franquicia</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Sub-Franquiciados Activos ({subFranchises.length})
            </h4>

            {subFranchises.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                No hay sub-franquiciados registrados en esta red comercial todavía.
              </div>
            ) : (
              <div className="space-y-2.5">
                {subFranchises.map((sub: any) => (
                  <div key={sub.id} className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                        <Building className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <strong className="text-slate-900 text-xs block font-extrabold">{sub.businessName}</strong>
                        <span className="text-[11px] text-slate-500 block">Titular: {sub.ownerName} • Tel: {sub.phone}</span>
                        {/* Render inherited PRO modules cascading badges */}
                        {sub.enabledModules && Object.entries(sub.enabledModules).filter(([_, v]) => v).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(sub.enabledModules)
                              .filter(([_, active]) => active)
                              .map(([modKey]) => (
                                <span key={modKey} className="px-1.5 py-0.5 rounded text-[8px] bg-purple-50 border border-purple-200 text-purple-700 font-black uppercase">
                                  PRO: {modKey}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {sub.status.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSub(sub.id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Eliminar sub-franquicia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
