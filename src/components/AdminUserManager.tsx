import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Check,
  Search,
  Phone,
  Mail,
  UserCheck,
  RotateCcw,
  Edit3,
  MessageCircle,
  Briefcase,
  Layers,
  Save,
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  Trash2,
  KeyRound,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { CustomerUser, FranchiseTenant, UserRole } from '../types';
import { logAuditEvent } from '../services/auditLogger';
import { useAppStore } from '../store/useAppStore';
import { 
  updateUserRoleByAdmin, 
  claimInitialAdminRole, 
  isMasterCodeValid, 
  ADMIN_MASTER_CODE 
} from '../services/firebaseAuthService';

export interface AdminUserData {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  authMethod: 'google_oauth';
}

interface AdminUserManagerProps {
  customers: CustomerUser[];
  franchises: FranchiseTenant[];
  onResetPassword: (userId: string, newPass: string, userType: 'admin' | 'customer' | 'franchise' | 'seller') => void;
}

const PRIMARY_GOOGLE_ADMIN: AdminUserData = {
  id: 'admin-maxter',
  name: 'Gregory Izquierdo',
  role: 'Administrador Maestro & Propietario (Acceso Total)',
  phone: '+584241983648',
  email: 'emprendimientogregoryizquierdo@gmail.com',
  status: 'Activo & Verificado por Google',
  authMethod: 'google_oauth'
};

export const AdminUserManager: React.FC<AdminUserManagerProps> = ({
  customers: propCustomers,
  franchises: propFranchises,
  onResetPassword
}) => {
  const storeCustomers = useAppStore((state) => state.customers);
  const storeFranchises = useAppStore((state) => state.franchises);
  const setStoreCustomers = useAppStore((state) => state.setCustomers);
  const setStoreFranchises = useAppStore((state) => state.setFranchises);

  const customers = storeCustomers && storeCustomers.length > 0 ? storeCustomers : propCustomers;
  const franchises = storeFranchises && storeFranchises.length > 0 ? storeFranchises : propFranchises;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForReset, setSelectedUserForReset] = useState<{
    id: string;
    name: string;
    type: 'customer' | 'franchise' | 'sub';
    phone: string;
    email: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Perfil del Administrador Único de Google (Persistido)
  const [adminProfile, setAdminProfile] = useState<AdminUserData>(() => {
    try {
      const saved = localStorage.getItem('streamsync_primary_google_admin_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return PRIMARY_GOOGLE_ADMIN;
  });

  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [adminEditForm, setAdminEditForm] = useState({
    name: adminProfile.name,
    phone: adminProfile.phone,
    email: adminProfile.email
  });

  // Purgar credenciales maestras inseguras y operadores huérfanos al inicializar
  useEffect(() => {
    try {
      localStorage.removeItem('portal_staff_members');
      localStorage.removeItem('streamsync_staff_members');
      // Guardar perfil limpio consolidado
      localStorage.setItem('streamsync_primary_google_admin_v2', JSON.stringify(adminProfile));
      // Mantener sincronizado el email en la lista para validación de googleAuth
      localStorage.setItem('streamsync_master_admins_v1', JSON.stringify([{
        id: adminProfile.id,
        name: adminProfile.name,
        email: adminProfile.email,
        authMethod: 'google_oauth'
      }]));
    } catch (e) {
      console.error('Error purgando operadores anteriores:', e);
    }
  }, [adminProfile]);

  // Modal to edit full user data ficha (Clients, Sellers, Resellers, Franchises, Sub-franchises, Sub-clients)
  const [editingFicha, setEditingFicha] = useState<{
    roleType: 'customer' | 'seller' | 'reseller' | 'franchise' | 'subfranchise' | 'sub_client';
    id: string;
    name: string;
    ownerName?: string;
    phone: string;
    email: string;
    grpayBalance?: number;
    commissionPercent?: number;
    notes?: string;
    parentFranchiseId?: string;
    parentFranchiseName?: string;
    status?: string;
    isSuspended?: boolean;
    role?: UserRole;
  } | null>(null);

  // Sub-franchises across franchises
  const allSubFranchises = franchises.flatMap((f: FranchiseTenant) =>
    (f.subFranchises || []).map((sub: any) => ({
      ...sub,
      parentFranchiseId: f.id,
      parentFranchiseName: f.businessName
    }))
  );

  // Sub-clients
  const [subClients] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('gi_subclients_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Estados para Cambio de Rol Protegido por Administrador (Cliente <-> Vendedor)
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: CustomerUser;
    targetRole: 'cliente' | 'vendedor';
  } | null>(null);
  const [roleMasterCode, setRoleMasterCode] = useState('');
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);
  const [isSubmittingRoleChange, setIsSubmittingRoleChange] = useState(false);

  // Estados para Aprovisionar / Confirmar Rol Administrador Inicial
  const [isAdminClaimOpen, setIsAdminClaimOpen] = useState(false);
  const [adminClaimCode, setAdminClaimCode] = useState('');
  const [adminClaimError, setAdminClaimError] = useState<string | null>(null);
  const [isSubmittingAdminClaim, setIsSubmittingAdminClaim] = useState(false);

  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeTarget) return;
    setRoleChangeError(null);

    if (!isMasterCodeValid(roleMasterCode)) {
      setRoleChangeError('Código maestro de administrador inválido. Autorización denegada.');
      return;
    }

    try {
      setIsSubmittingRoleChange(true);
      await updateUserRoleByAdmin(
        roleChangeTarget.user.id,
        roleChangeTarget.targetRole,
        roleMasterCode,
        adminProfile.name
      );

      // Actualizar estado local inmediatamente
      const updated = customers.map((c) =>
        c.id === roleChangeTarget.user.id
          ? { ...c, role: roleChangeTarget.targetRole }
          : c
      );
      setStoreCustomers(updated);

      setSuccessNotice(
        `¡Rol de ${roleChangeTarget.user.name} actualizado exitosamente a ${roleChangeTarget.targetRole.toUpperCase()} en Firestore y el panel!`
      );
      setRoleChangeTarget(null);
      setRoleMasterCode('');
      setTimeout(() => setSuccessNotice(null), 4500);
    } catch (err: any) {
      console.error('Error changing user role in Firestore:', err);
      setRoleChangeError(err?.message || 'Error al actualizar rol en Firestore.');
    } finally {
      setIsSubmittingRoleChange(false);
    }
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminClaimError(null);

    if (!isMasterCodeValid(adminClaimCode)) {
      setAdminClaimError('Código maestro inválido. Autorización denegada.');
      return;
    }

    try {
      setIsSubmittingAdminClaim(true);
      await claimInitialAdminRole(
        adminProfile.id,
        adminClaimCode,
        adminProfile.email,
        adminProfile.name
      );

      setSuccessNotice(
        `¡Rol de Administrador inicial aprovisionado con éxito en Firestore ('users' y 'admins') para ${adminProfile.email}!`
      );
      setIsAdminClaimOpen(false);
      setAdminClaimCode('');
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      console.error('Error claiming admin role in Firestore:', err);
      setAdminClaimError(err?.message || 'Error al aprovisionar rol de administrador en Firestore.');
    } finally {
      setIsSubmittingAdminClaim(false);
    }
  };

  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminUserData = {
      ...adminProfile,
      name: adminEditForm.name.trim() || 'Gregory Izquierdo',
      phone: adminEditForm.phone.trim() || '+584241983648',
      email: adminEditForm.email.trim().toLowerCase() || PRIMARY_GOOGLE_ADMIN.email
    };
    setAdminProfile(updated);
    setIsEditingAdmin(false);

    logAuditEvent({
      action: 'UPDATE_ADMIN_PROFILE',
      description: `Datos de contacto del administrador único actualizados: ${updated.name} (${updated.email})`,
      severity: 'info',
      actorRole: 'admin',
      actor: 'Administrador Maestro'
    });

    setSuccessNotice('¡Datos del Administrador Maestro actualizados con éxito!');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPassword) return;

    onResetPassword(
      selectedUserForReset.id,
      newPassword,
      selectedUserForReset.type === 'sub' ? 'franchise' : selectedUserForReset.type
    );

    logAuditEvent({
      action: 'RESET_PASSWORD_CUSTOM',
      description: `Contraseña modificada para ${selectedUserForReset.type} (${selectedUserForReset.name})`,
      severity: 'success',
      actorRole: 'admin',
      actor: 'Administrador Maestro'
    });

    setSuccessNotice(`¡Contraseña restablecida con éxito para ${selectedUserForReset.name}! Registrado en bitácora.`);
    setSelectedUserForReset(null);
    setNewPassword('');
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleSaveFicha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFicha) return;

    if (editingFicha.roleType === 'customer' || editingFicha.roleType === 'seller' || editingFicha.roleType === 'reseller') {
      const updated = customers.map((c) => {
        if (c.id === editingFicha.id) {
          return {
            ...c,
            name: editingFicha.name,
            phone: editingFicha.phone,
            email: editingFicha.email,
            grpayBalance: editingFicha.grpayBalance !== undefined ? editingFicha.grpayBalance : (c.grpayBalance || c.zenyBalance),
            zenyBalance: editingFicha.grpayBalance !== undefined ? editingFicha.grpayBalance : (c.zenyBalance || c.grpayBalance),
            role: editingFicha.role || c.role || 'cliente',
            isSuspended: editingFicha.isSuspended !== undefined ? editingFicha.isSuspended : c.isSuspended,
            notes: editingFicha.notes !== undefined ? editingFicha.notes : c.notes
          };
        }
        return c;
      });
      setStoreCustomers(updated);

      logAuditEvent({
        actor: 'Administrador',
        actorRole: 'admin',
        action: 'MODIFICAR_CLIENTE',
        description: `Modificó datos de ${editingFicha.roleType} "${editingFicha.name}" (${editingFicha.email}).`,
        severity: 'info',
        metadata: { 
          targetId: editingFicha.id, 
          role: editingFicha.role, 
          balance: editingFicha.grpayBalance 
        }
      });
    } else if (editingFicha.roleType === 'franchise') {
      const updated = franchises.map((f: FranchiseTenant) => {
        if (f.id === editingFicha.id) {
          return {
            ...f,
            businessName: editingFicha.name,
            ownerName: editingFicha.ownerName || f.ownerName,
            phone: editingFicha.phone,
            email: editingFicha.email,
            availableMasterBalanceUsd:
              editingFicha.grpayBalance !== undefined ? editingFicha.grpayBalance : f.availableMasterBalanceUsd,
            notes: editingFicha.notes || f.notes
          };
        }
        return f;
      });
      setStoreFranchises(updated);
    } else if (editingFicha.roleType === 'subfranchise') {
      const updated = franchises.map((f: FranchiseTenant) => {
        const subList = (f.subFranchises || []).map((sub: any) => {
          if (sub.id === editingFicha.id) {
            return {
              ...sub,
              businessName: editingFicha.name,
              ownerName: editingFicha.ownerName || sub.ownerName,
              phone: editingFicha.phone,
              email: editingFicha.email
            };
          }
          return sub;
        });
        return { ...f, subFranchises: subList };
      });
      setStoreFranchises(updated);
    }

    logAuditEvent({
      action: 'UPDATE_USER_FICHA',
      description: `Ficha editada para ${editingFicha.roleType}: ${editingFicha.name}`,
      severity: 'info',
      actorRole: 'admin',
      actor: 'Administrador Maestro'
    });

    setSuccessNotice(`¡Ficha de datos de ${editingFicha.name} actualizada correctamente en el sistema!`);
    setEditingFicha(null);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* SECTION 1: UNIQUE GOOGLE ADMINISTRATOR */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Administrador Único del Sistema</span>
            </h3>
            <p className="text-xs text-slate-400">
              Acceso blindado y exclusivo mediante el botón de autenticación oficial de Google. Operadores secundarios y contraseñas maestras eliminados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Google OAuth 2.0 Activo</span>
            </span>
          </div>
        </div>

        {/* Master Admin Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Admin identity */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-xl shadow-indigo-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-white">{adminProfile.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                    Super Admin • Dueño
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-mono flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Acceso Único por Correo Gmail Autorizado</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdminClaimOpen(true);
                  setAdminClaimCode('');
                  setAdminClaimError(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Asignar Rol Admin Inicial</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminEditForm({
                    name: adminProfile.name,
                    phone: adminProfile.phone,
                    email: adminProfile.email
                  });
                  setIsEditingAdmin(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Actualizar Datos de Contacto</span>
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Correo Electrónico Autorizado Google:
              </span>
              <div className="font-mono text-emerald-300 font-extrabold text-xs break-all flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{adminProfile.email}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Teléfono de Contacto / Soporte:
              </span>
              <div className="font-mono text-white font-bold text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{adminProfile.phone}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Políticas de Seguridad:
              </span>
              <div className="text-indigo-300 font-bold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Credenciales maestras eliminadas • Sin contraseñas débiles</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: EDITABLE DIRECTORY - CLIENTS, SELLERS, RESELLERS, FRANCHISES, SUB-FRANCHISES & SUB-CLIENTS */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Directorio General de Clientes & Franquicias</span>
            </h3>
            <p className="text-xs text-slate-400">
              Administración de cuentas de clientes, vendedores, revendedores y redes de franquicias.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* 1. FRANCHISES DIRECTORY */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Franquicias Registradas ({franchises.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {franchises
              .filter(
                (f: FranchiseTenant) =>
                  f.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  f.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  f.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((fran: FranchiseTenant) => (
                <div key={fran.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs font-extrabold">{fran.businessName}</strong>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      Franquicia
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <div>Titular: <span className="text-white font-semibold">{fran.ownerName}</span></div>
                    <div>Teléfono: <span className="text-white">{fran.phone}</span></div>
                    <div>Correo: <span className="text-white truncate block max-w-[180px]">{fran.email}</span></div>
                    <div>Saldo Master: <span className="text-emerald-400 font-bold">${fran.availableMasterBalanceUsd.toFixed(2)}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingFicha({
                          roleType: 'franchise',
                          id: fran.id,
                          name: fran.businessName,
                          ownerName: fran.ownerName,
                          phone: fran.phone,
                          email: fran.email,
                          grpayBalance: fran.availableMasterBalanceUsd,
                          notes: fran.notes || ''
                        })
                      }
                      className="py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUserForReset({
                          id: fran.id,
                          name: fran.businessName,
                          type: 'franchise',
                          phone: fran.phone,
                          email: fran.email
                        })
                      }
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Clave
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 2. SUB-FRANCHISES & RESELLERS DIRECTORY */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Sub-Franquiciados & Revendedores Oficiales ({allSubFranchises.length})</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allSubFranchises
              .filter(
                (sub: any) =>
                  sub.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sub.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((sub: any) => (
                <div key={sub.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs font-extrabold">{sub.businessName}</strong>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Sub-Franquicia
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                    <div>Red Matriz: <span className="text-purple-300 font-semibold">{sub.parentFranchiseName}</span></div>
                    <div>Titular: <span className="text-white font-semibold">{sub.ownerName}</span></div>
                    <div>Teléfono: <span className="text-white">{sub.phone}</span></div>
                    <div>Correo: <span className="text-white truncate block max-w-[180px]">{sub.email}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingFicha({
                          roleType: 'subfranchise',
                          id: sub.id,
                          name: sub.businessName,
                          ownerName: sub.ownerName,
                          phone: sub.phone,
                          email: sub.email,
                          parentFranchiseId: sub.parentFranchiseId,
                          parentFranchiseName: sub.parentFranchiseName
                        })
                      }
                      className="py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUserForReset({
                          id: sub.id,
                          name: sub.businessName,
                          type: 'sub',
                          phone: sub.phone,
                          email: sub.email
                        })
                      }
                      className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Clave
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 3. CLIENTS OF SUB-FRANCHISES DIRECTORY */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-teal-400 uppercase flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Clientes de los Sub-Franquiciados ({subClients.length})</span>
          </h4>

          {subClients.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-center py-6">
              <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No hay clientes de sub-redes registrados aún.</p>
              <p className="text-[11px] text-slate-500 mt-1">Los clientes asociados a franquiciados o sub-redes aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subClients
                .filter(
                  (sc) =>
                    sc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    sc.email.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((sc) => (
                  <div key={sc.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-xs font-extrabold">{sc.name}</strong>
                      <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                        Cliente de Sub-Red
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      <div>Sub-Franquicia: <span className="text-amber-300">{sc.subFranchiseName}</span></div>
                      <div>Teléfono: <span className="text-white">{sc.phone}</span></div>
                      <div>Correo: <span className="text-white truncate block max-w-[180px]">{sc.email}</span></div>
                      <div>Notas: <span className="text-slate-300 truncate block">{sc.notes}</span></div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingFicha({
                          roleType: 'sub_client',
                          id: sc.id,
                          name: sc.name,
                          phone: sc.phone,
                          email: sc.email,
                          notes: sc.notes
                        })
                      }
                      className="w-full py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Ficha de Cliente de Sub-Franquicia</span>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 4. CUSTOMERS & SELLERS / RESELLERS DIRECTORY */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Clientes & Vendedores Registrados en Tienda ({customers.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.phone.includes(searchTerm)
              )
              .slice(0, 15)
              .map((cust) => {
                const isSeller = cust.role === 'vendedor';
                return (
                  <div key={cust.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-white text-xs font-bold truncate">{cust.name}</strong>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                          isSeller 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isSeller ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                            <span>Vendedor</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-2.5 h-2.5 text-blue-400" />
                            <span>Cliente</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                      <div>Correo: <span className="text-white truncate block max-w-[170px]">{cust.email}</span></div>
                      <div>Teléfono: <span className="text-white">{cust.phone}</span></div>
                      <div>
                        Billetera Zeny:{' '}
                        <span className="text-emerald-400 font-bold">${(cust.grpayBalance || cust.zenyBalance || 0).toFixed(2)}</span>
                      </div>
                      {cust.notes && (
                        <div className="text-[10px] text-slate-500 truncate">Nota: {cust.notes}</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingFicha({
                            roleType: isSeller ? 'seller' : 'customer',
                            id: cust.id,
                            name: cust.name,
                            phone: cust.phone,
                            email: cust.email,
                            grpayBalance: cust.grpayBalance || cust.zenyBalance,
                            role: cust.role,
                            notes: cust.notes || '',
                            isSuspended: cust.isSuspended
                          })
                        }
                        className="py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Ficha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUserForReset({
                            id: cust.id,
                            name: cust.name,
                            type: 'customer',
                            phone: cust.phone,
                            email: cust.email
                          })
                        }
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Clave
                      </button>
                    </div>

                    {/* Botón de Gestión de Rol (Solo Administrador con Código Maestro) */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setRoleChangeTarget({
                            user: cust,
                            targetRole: isSeller ? 'cliente' : 'vendedor'
                          });
                          setRoleMasterCode('');
                          setRoleChangeError(null);
                        }}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                          isSeller
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {isSeller ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span>Degradar a Cliente</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Promover a Vendedor</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* MODAL: RESET PASSWORD (PARA CLIENTES Y FRANQUICIAS) */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Restablecer Contraseña para: {selectedUserForReset.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForReset(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nueva Contraseña:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. claveSegura2026"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Al confirmar:</div>
                <div className="text-emerald-400">• Se actualizará la clave del usuario en el sistema.</div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirmar Cambio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MASTER ADMIN CONTACT DATA */}
      {isEditingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Datos del Administrador Maestro</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingAdmin(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  value={adminEditForm.name}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico de Google Autorizado:
                </label>
                <input
                  type="email"
                  required
                  value={adminEditForm.email}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Solo esta cuenta de Google podrá acceder al portal administrativo.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono de Soporte / Contacto:</label>
                <input
                  type="text"
                  required
                  value={adminEditForm.phone}
                  onChange={(e) => setAdminEditForm({ ...adminEditForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingAdmin(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FICHA (CLIENTS, FRANCHISES, RESELLERS) */}
      {editingFicha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Editar Ficha: {editingFicha.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingFicha(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFicha} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre / Razón Social:</label>
                <input
                  type="text"
                  required
                  value={editingFicha.name}
                  onChange={(e) => setEditingFicha({ ...editingFicha, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              {editingFicha.ownerName !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Titular:</label>
                  <input
                    type="text"
                    value={editingFicha.ownerName}
                    onChange={(e) => setEditingFicha({ ...editingFicha, ownerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    value={editingFicha.phone}
                    onChange={(e) => setEditingFicha({ ...editingFicha, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Correo:</label>
                  <input
                    type="email"
                    value={editingFicha.email}
                    onChange={(e) => setEditingFicha({ ...editingFicha, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {editingFicha.grpayBalance !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Saldo Billetera / Master (USD):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFicha.grpayBalance}
                    onChange={(e) => setEditingFicha({ ...editingFicha, grpayBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {editingFicha.notes !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notas Internas:</label>
                  <textarea
                    rows={2}
                    value={editingFicha.notes}
                    onChange={(e) => setEditingFicha({ ...editingFicha, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFicha(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Ficha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: CAMBIO DE ROL AUTORIZADO POR ADMINISTRADOR (CLIENTE <-> VENDEDOR) */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Gestión de Rol de Usuario
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Autorización exclusiva de Administrador
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* User Target Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{roleChangeTarget.user.name}</span>
                <span className="text-[10px] font-mono text-slate-400">{roleChangeTarget.user.phone || roleChangeTarget.user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Rol actual:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  {roleChangeTarget.user.role === 'vendedor' ? 'Vendedor' : 'Cliente'}
                </span>
                <span className="text-indigo-400">➔</span>
                <span className="text-slate-400">Nuevo rol:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  roleChangeTarget.targetRole === 'vendedor'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {roleChangeTarget.targetRole === 'vendedor' ? 'Vendedor' : 'Cliente'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Para proteger la plataforma, solo el usuario con rol de Administrador puede asignar o revocar el rol de <strong>Vendedor</strong> en Firestore.
              </span>
            </div>

            <form onSubmit={handleConfirmRoleChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Código Maestro de Administrador *</span>
                </label>
                <input
                  type="password"
                  required
                  value={roleMasterCode}
                  onChange={(e) => setRoleMasterCode(e.target.value)}
                  placeholder="Ingresa el código maestro de administrador..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono tracking-wider"
                />
              </div>

              {roleChangeError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{roleChangeError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleChangeTarget(null)}
                  disabled={isSubmittingRoleChange}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoleChange || !roleMasterCode}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/20"
                >
                  {isSubmittingRoleChange ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Confirmar y Sincronizar en Firestore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APROVISIONAR / CONFIRMAR ROL DE ADMINISTRADOR INICIAL EN FIRESTORE */}
      {isAdminClaimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Aprovisionar Administrador Inicial
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Registro de rol maestro en Firestore (/users)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminClaimOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-slate-400 font-medium">Cuenta a configurar:</div>
              <div className="text-white font-bold">{adminProfile.name}</div>
              <div className="text-emerald-300 font-mono text-[11px]">{adminProfile.email}</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ingresa el código maestro de seguridad para registrar el documento del administrador en la colección <code>users</code> de Firestore con <code>role: 'admin'</code>. Esto otorga los permisos necesarios para la gestión completa de vendedores.
            </p>

            <form onSubmit={handleClaimAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Código Maestro de Administrador *</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminClaimCode}
                  onChange={(e) => setAdminClaimCode(e.target.value)}
                  placeholder="Ingresa el código maestro..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono tracking-wider"
                />
              </div>

              {adminClaimError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adminClaimError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdminClaimOpen(false)}
                  disabled={isSubmittingAdminClaim}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdminClaim || !adminClaimCode}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  {isSubmittingAdminClaim ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Aprovisionar Rol Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
