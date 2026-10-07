import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  Lock,
  Check,
  Search,
  Phone,
  Mail,
  UserCheck,
  RotateCcw,
  Edit3,
  Send,
  MessageCircle,
  FileText,
  Settings,
  QrCode,
  Smartphone,
  HelpCircle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  Save,
  X
} from 'lucide-react';
import { CustomerUser, FranchiseTenant } from '../types';
import { logAuditEvent } from '../services/auditLogger';
import { useAppStore } from '../store/useAppStore';

export type AdminSecurityAuthMethod = 'google_authenticator' | 'whatsapp' | 'telegram' | 'email' | 'security_question';

export interface AdminUserData {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  authMethod: AdminSecurityAuthMethod;
  googleAuthSecret?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  telegramChatId?: string;
}

interface AdminUserManagerProps {
  customers: CustomerUser[];
  franchises: FranchiseTenant[];
  onResetPassword: (userId: string, newPass: string, userType: 'admin' | 'customer' | 'franchise' | 'seller') => void;
}

const DEFAULT_ADMINS: AdminUserData[] = [
  {
    id: 'admin-maxter',
    username: 'maxter',
    password: 'nolimits.10',
    name: 'Gregory Izquierdo',
    role: 'Administrador Maestro (Dueño)',
    phone: '+584241983648',
    email: 'emprendimientogregoryizquierdo@gmail.com',
    status: 'Activo',
    authMethod: 'google_authenticator',
    googleAuthSecret: 'JBSWY3DPEHPK3PXP',
    securityQuestion: '¿Cuál es el nombre de tu primera mascota?',
    securityAnswer: 'Max',
    telegramChatId: '@gregory_streaming'
  },
  {
    id: 'admin-neron',
    username: 'neron',
    password: 'nero090889',
    name: 'Pablo Gonzalez',
    role: 'Administrador Maestro (Equipo)',
    phone: '+584241983648',
    email: 'emprendimientogregoryizquierdo@gmail.com',
    status: 'Activo',
    authMethod: 'google_authenticator',
    googleAuthSecret: 'HXDMVJECJJWSRZ3U',
    securityQuestion: '¿En qué ciudad naciste?',
    securityAnswer: 'Caracas',
    telegramChatId: '@pablo_gonzalez'
  }
];

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
    type: 'admin' | 'customer' | 'franchise' | 'sub';
    phone: string;
    email: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Editable Notification Message Template
  const [notificationTemplate, setNotificationTemplate] = useState(
    `Hola {nombre}, tus datos de acceso al sistema han sido actualizados.\nUsuario / Correo: {usuario}\nNueva Contraseña: {clave}\nSoporte Oficial: 04241983648 / +584241983648`
  );
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Master Admin State (Editable & Persisted)
  const [masterAdmins, setMasterAdmins] = useState<AdminUserData[]>(() => {
    try {
      const saved = localStorage.getItem('streamsync_master_admins_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ADMINS;
  });

  const [editingAdmin, setEditingAdmin] = useState<AdminUserData | null>(null);
  const [showQrModalForAdmin, setShowQrModalForAdmin] = useState<AdminUserData | null>(null);

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
    role?: 'cliente' | 'vendedor';
  } | null>(null);

  // Save master admins to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem('streamsync_master_admins_v1', JSON.stringify(masterAdmins));
    } catch (e) {
      console.error('Error saving master admins', e);
    }
  }, [masterAdmins]);

  // Collect all sub-franchises across franchises
  const allSubFranchises = franchises.flatMap((f) =>
    (f.subFranchises || []).map((sub: any) => ({
      ...sub,
      parentFranchiseId: f.id,
      parentFranchiseName: f.businessName
    }))
  );

  // Real subfranchise clients (persisted in localStorage, clean default)
  const [subClients, setSubClients] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('gi_subclients_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForReset || !newPassword) return;

    if (selectedUserForReset.type === 'admin') {
      setMasterAdmins((prev) =>
        prev.map((a) => (a.id === selectedUserForReset.id ? { ...a, password: newPassword } : a))
      );
    }

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

  const handleSaveAdminEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setMasterAdmins((prev) => prev.map((a) => (a.id === editingAdmin.id ? editingAdmin : a)));
    setEditingAdmin(null);
    setSuccessNotice(`¡Ficha de seguridad y método de acceso del administrador ${editingAdmin.name} actualizados con éxito!`);
    setTimeout(() => setSuccessNotice(null), 4000);
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
            grpayBalance: editingFicha.grpayBalance !== undefined ? editingFicha.grpayBalance : c.grpayBalance,
            role: editingFicha.role || c.role || 'cliente',
            isSuspended: editingFicha.isSuspended !== undefined ? editingFicha.isSuspended : c.isSuspended,
            notes: editingFicha.notes !== undefined ? editingFicha.notes : c.notes
          };
        }
        return c;
      });
      setStoreCustomers(updated);
    } else if (editingFicha.roleType === 'franchise') {
      const updated = franchises.map((f) => {
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
      const updated = franchises.map((f) => {
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

  const formatCustomMessage = (name: string, identifier: string, pass: string) => {
    return notificationTemplate
      .replace(/{nombre}/g, name)
      .replace(/{usuario}/g, identifier)
      .replace(/{clave}/g, pass);
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
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* SECTION 1: MASTER ADMINS WITH AUTHENTICATION METHOD SETTINGS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Administradores Maestros & Métodos de Autenticación 2FA</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configura el método de seguridad preferido de cada administrador (Google Authenticator, WhatsApp, Telegram, Email o Pregunta Secreta).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>Editar Plantilla de Notificación</span>
          </button>
        </div>

        {/* Template Editor Collapsible */}
        {showTemplateEditor && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
            <label className="block text-xs font-bold text-slate-300">
              Plantilla de Mensaje para Envío de Credenciales:
            </label>
            <textarea
              rows={3}
              value={notificationTemplate}
              onChange={(e) => setNotificationTemplate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">Variables disponibles: {'{nombre}'}, {'{usuario}'}, {'{clave}'}</p>
          </div>
        )}

        {/* Master Admins Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {masterAdmins.map((adm) => (
            <div
              key={adm.id}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 space-y-4 shadow-xl relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-white font-extrabold text-sm">{adm.name}</span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-mono">{adm.role}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingAdmin(adm)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Configurar 2FA & Ficha</span>
                </button>
              </div>

              {/* Security Method Badge */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Método de Acceso Seguro 2FA:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {adm.authMethod === 'google_authenticator' && (
                      <>
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">Google Authenticator (TOTP 6 Dígitos)</span>
                      </>
                    )}
                    {adm.authMethod === 'whatsapp' && (
                      <>
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-300">Código OTP vía WhatsApp</span>
                      </>
                    )}
                    {adm.authMethod === 'telegram' && (
                      <>
                        <Send className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-bold text-sky-300">Código OTP vía Telegram</span>
                      </>
                    )}
                    {adm.authMethod === 'email' && (
                      <>
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-300">Código OTP vía Correo</span>
                      </>
                    )}
                    {adm.authMethod === 'security_question' && (
                      <>
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300">Pregunta de Seguridad Secreta</span>
                      </>
                    )}
                  </div>
                </div>

                {adm.authMethod === 'google_authenticator' && (
                  <button
                    type="button"
                    onClick={() => setShowQrModalForAdmin(adm)}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Ver QR y Clave Secreta"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver QR</span>
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="text-xs font-mono space-y-1 text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-500">Usuario:</span>
                  <span className="text-white font-bold">{adm.username}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="text-slate-300">{adm.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Correo:</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[180px]">{adm.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedUserForReset({
                      id: adm.id,
                      name: adm.name,
                      type: 'admin',
                      phone: adm.phone,
                      email: adm.email
                    })
                  }
                  className="py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cambiar Clave</span>
                </button>

                <div className="flex items-center gap-1">
                  <a
                    href={`https://wa.me/${adm.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      formatCustomMessage(adm.name, adm.username, adm.password || '')
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={`mailto:${adm.email}?subject=${encodeURIComponent(
                      'Credenciales Actualizadas - Sistema'
                    )}&body=${encodeURIComponent(formatCustomMessage(adm.name, adm.username, adm.password || ''))}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Enviar por Correo"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: EDITABLE DIRECTORY - CLIENTS, SELLERS, RESELLERS, FRANCHISES, SUB-FRANCHISES & SUB-CLIENTS */}
      <div className="space-y-6 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Directorio Completo con Edición de Fichas</span>
            </h3>
            <p className="text-xs text-slate-400">
              Edita datos de clientes, vendedores, revendedores, franquiciados, subfranquiciados y clientes de subfranquiciados.
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
                (f) =>
                  f.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  f.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  f.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((fran) => (
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
                (sub) =>
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
                  <div key={cust.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-xs font-bold">{cust.name}</strong>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSeller ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {isSeller ? 'Vendedor / Revendedor' : 'Cliente'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                      <div>Correo: <span className="text-white truncate block max-w-[170px]">{cust.email}</span></div>
                      <div>Teléfono: <span className="text-white">{cust.phone}</span></div>
                      <div>
                        Billetera GRPAY:{' '}
                        <span className="text-emerald-400 font-bold">${cust.grpayBalance.toFixed(2)}</span>
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
                            grpayBalance: cust.grpayBalance,
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
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* MODAL: RESET PASSWORD */}
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
                className="text-slate-400 hover:text-white"
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
                <div className="text-emerald-400">• Se registrará automáticamente en la Bitácora (Audit Log).</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForReset(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Confirmar & Registrar en Bitácora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER FICHA (CLIENTS, SELLERS, RESELLERS, FRANCHISES, SUB-FRANCHISES, SUB-CLIENTS) */}
      {editingFicha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Editar Ficha de {editingFicha.roleType === 'franchise' ? 'Franquicia' : editingFicha.roleType === 'subfranchise' ? 'Sub-Franquicia' : editingFicha.roleType === 'seller' ? 'Vendedor / Revendedor' : 'Cliente'}
                  </h3>
                  <p className="text-xs text-slate-400">{editingFicha.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFicha(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFicha} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre / Razón Social:</label>
                  <input
                    type="text"
                    required
                    value={editingFicha.name}
                    onChange={(e) => setEditingFicha({ ...editingFicha, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                {(editingFicha.roleType === 'franchise' || editingFicha.roleType === 'subfranchise') && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Titular Responsable:</label>
                    <input
                      type="text"
                      value={editingFicha.ownerName || ''}
                      onChange={(e) => setEditingFicha({ ...editingFicha, ownerName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Teléfono Móvil (WhatsApp):</label>
                  <input
                    type="text"
                    required
                    value={editingFicha.phone}
                    onChange={(e) => setEditingFicha({ ...editingFicha, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    required
                    value={editingFicha.email}
                    onChange={(e) => setEditingFicha({ ...editingFicha, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Roles & Balances */}
              {(editingFicha.roleType === 'customer' || editingFicha.roleType === 'seller' || editingFicha.roleType === 'reseller') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Tipo de Usuario:</label>
                    <select
                      value={editingFicha.role || 'cliente'}
                      onChange={(e) =>
                        setEditingFicha({
                          ...editingFicha,
                          role: e.target.value as 'cliente' | 'vendedor'
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="cliente">Cliente Regular</option>
                      <option value="vendedor">Vendedor / Revendedor Oficial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Saldo en Billetera GRPAY ($ USD):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editingFicha.grpayBalance ?? 0}
                        onChange={(e) =>
                          setEditingFicha({
                            ...editingFicha,
                            grpayBalance: parseFloat(e.target.value) || 0
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Franchise Balance */}
              {editingFicha.roleType === 'franchise' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Saldo Master Billetera USD:</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingFicha.grpayBalance ?? 0}
                      onChange={(e) =>
                        setEditingFicha({
                          ...editingFicha,
                          grpayBalance: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notas Internas de la Ficha:</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre compras frecuentes, convenios especiales o descuentos..."
                  value={editingFicha.notes || ''}
                  onChange={(e) => setEditingFicha({ ...editingFicha, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFicha(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Ficha en Base de Datos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADMIN 2FA & SECURITY METHOD */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configuración de Seguridad & 2FA: {editingAdmin.name}
                  </h3>
                  <p className="text-xs text-slate-400">Escoge el método de autenticación preferido para este administrador</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Usuario de Acceso:</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.username}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* METHOD SELECTION */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block font-bold text-slate-200">
                  Método de Autenticación de Seguridad (2FA):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin({ ...editingAdmin, authMethod: 'google_authenticator' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      editingAdmin.authMethod === 'google_authenticator'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Google Authenticator</div>
                      <div className="text-[10px] text-slate-400">Token TOTP de 6 dígitos</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAdmin({ ...editingAdmin, authMethod: 'whatsapp' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      editingAdmin.authMethod === 'whatsapp'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">WhatsApp</div>
                      <div className="text-[10px] text-slate-400">Código OTP por mensaje</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAdmin({ ...editingAdmin, authMethod: 'telegram' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      editingAdmin.authMethod === 'telegram'
                        ? 'bg-sky-600/20 border-sky-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Send className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Telegram</div>
                      <div className="text-[10px] text-slate-400">Código vía bot/chat</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAdmin({ ...editingAdmin, authMethod: 'email' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      editingAdmin.authMethod === 'email'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Email</div>
                      <div className="text-[10px] text-slate-400">Código OTP por correo</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAdmin({ ...editingAdmin, authMethod: 'security_question' })}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 sm:col-span-2 transition cursor-pointer ${
                      editingAdmin.authMethod === 'security_question'
                        ? 'bg-amber-600/20 border-amber-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">Preguntas de Seguridad</div>
                      <div className="text-[10px] text-slate-400">Respuesta a pregunta secreta personalizada</div>
                    </div>
                  </button>
                </div>

                {/* Conditional Fields based on method */}
                {editingAdmin.authMethod === 'google_authenticator' && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">Clave Secreta TOTP:</span>
                      <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded text-white font-bold border border-slate-800">
                        {editingAdmin.googleAuthSecret || 'JBSWY3DPEHPK3PXP'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Escanea el código QR con Google Authenticator o introduce la clave secreta directamente en la aplicación.
                    </p>
                  </div>
                )}

                {editingAdmin.authMethod === 'security_question' && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <div>
                      <label className="block text-slate-400 mb-1">Pregunta Secreta:</label>
                      <input
                        type="text"
                        value={editingAdmin.securityQuestion || ''}
                        onChange={(e) => setEditingAdmin({ ...editingAdmin, securityQuestion: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Respuesta Secreta:</label>
                      <input
                        type="text"
                        value={editingAdmin.securityAnswer || ''}
                        onChange={(e) => setEditingAdmin({ ...editingAdmin, securityAnswer: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.phone}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Correo:</label>
                  <input
                    type="email"
                    required
                    value={editingAdmin.email}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Configuración 2FA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE GOOGLE AUTHENTICATOR SETUP */}
      {showQrModalForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Google Authenticator 2FA</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQrModalForAdmin(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* QR Code graphic */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `otpauth://totp/GregoryIzquierdo:${showQrModalForAdmin.username}?secret=${
                    showQrModalForAdmin.googleAuthSecret || 'JBSWY3DPEHPK3PXP'
                  }&issuer=StreamSync`
                )}`}
                alt="QR Code Google Authenticator"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="text-xs space-y-1.5">
              <div className="text-slate-400">Clave secreta manual:</div>
              <div className="font-mono text-emerald-300 font-bold bg-slate-950 p-2 rounded-xl border border-slate-800 select-all">
                {showQrModalForAdmin.googleAuthSecret || 'JBSWY3DPEHPK3PXP'}
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Abre la app de Google Authenticator en tu teléfono, pulsa "+" y selecciona "Escanear código QR".
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModalForAdmin(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Listo, Ya lo Escaneé
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
