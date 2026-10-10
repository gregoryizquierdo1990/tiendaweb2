import React, { useState } from 'react';
import { 
  ClipboardList, CheckCircle2, XCircle, Clock, 
  Search, Filter, ExternalLink, Building, 
  Mail, Phone, Calendar, User, MessageSquare
} from 'lucide-react';
import { FranchiseApplication, FranchiseTenant } from '../types';

interface AdminFranchiseApplicationManagerProps {
  applications: FranchiseApplication[];
  onApprove: (app: FranchiseApplication) => void;
  onReject: (appId: string, reason: string) => void;
}

export const AdminFranchiseApplicationManager: React.FC<AdminFranchiseApplicationManagerProps> = ({
  applications,
  onApprove,
  onReject
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApp, setSelectedApp] = useState<FranchiseApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.businessName.toLowerCase().includes(search.toLowerCase()) ||
      app.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (app: FranchiseApplication) => {
    if (confirm(`¿Está seguro de aprobar la solicitud de "${app.businessName}"? Se generará su acceso administrativo automáticamente.`)) {
      onApprove(app);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    if (selectedApp) {
      onReject(selectedApp.id, rejectionReason);
      setIsRejecting(false);
      setRejectionReason('');
      setSelectedApp(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Pendientes</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {applications.filter(a => a.status === 'pending').length}
          </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Aprobadas</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {applications.filter(a => a.status === 'approved').length}
          </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Rechazadas</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {applications.filter(a => a.status === 'rejected').length}
          </div>
        </div>
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-slate-400 text-sm font-medium">Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{applications.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por negocio, dueño o correo..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Solo Pendientes</option>
            <option value="approved">Solo Aprobadas</option>
            <option value="rejected">Solo Rechazadas</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <div 
              key={app.id}
              className="bg-slate-800/40 rounded-2xl border border-slate-700/50 p-5 hover:border-indigo-500/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <Building className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {app.businessName}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(app.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {app.status === 'pending' ? 'Pendiente' : app.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">{app.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-sm truncate max-w-[150px]">{app.email}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">{app.phone}</span>
                  </div>
                  {app.telegramUser && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{app.telegramUser}</span>
                    </div>
                  )}
                </div>
              </div>

              {app.notes && (
                <div className="mb-5 p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 text-xs text-slate-400 italic">
                  "{app.notes}"
                </div>
              )}

              {app.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-slate-700/30">
                  <button
                    onClick={() => handleApprove(app)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprobar Solicitud
                  </button>
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setIsRejecting(true);
                    }}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              )}

              {app.status === 'rejected' && app.rejectionReason && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                  <span className="font-bold block mb-1">Razón del rechazo:</span>
                  {app.rejectionReason}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
            <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No se encontraron solicitudes</h3>
            <p className="text-slate-500">Intenta ajustar los filtros de búsqueda o estado.</p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {isRejecting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <XCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-white">Rechazar Solicitud</h2>
            </div>
            
            <p className="text-slate-400 mb-6 text-sm">
              Por favor, indique el motivo por el cual la solicitud de <strong>{selectedApp?.businessName}</strong> está siendo rechazada.
            </p>

            <textarea
              autoFocus
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-600 resize-none mb-6"
              placeholder="Ej: Información de contacto inválida, perfil no cumple con los requisitos, etc."
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsRejecting(false);
                  setRejectionReason('');
                  setSelectedApp(null);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={!rejectionReason.trim()}
                onClick={handleReject}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
