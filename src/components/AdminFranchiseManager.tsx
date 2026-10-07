import React, { useState } from 'react';
import {
  Building,
  Users,
  Wallet,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Clock,
  ExternalLink,
  MessageCircle,
  Send,
  Plus,
  Edit2,
  Check,
  X,
  FileText,
  Upload,
  Image as ImageIcon,
  Copy,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import {
  FranchiseTenant,
  FranchiseTopupReport,
  FranchiseSubscriptionStatus,
  FranchiseStatus,
  FranchiseModulePermission,
  CustomerUser,
  MessageTemplate,
  Order
} from '../types';
import {
  renderTemplate,
  generateTelegramUrl,
  DOMAIN_OFFICIAL
} from '../utils/messageTemplates';
import { AdminFranchiseManualModal } from './AdminFranchiseManualModal';
import { AdminResellerNetworkModal } from './AdminResellerNetworkModal';
import { AdminFranchiseClientsModal } from './AdminFranchiseClientsModal';

interface AdminFranchiseManagerProps {
  franchises: FranchiseTenant[];
  topupReports: FranchiseTopupReport[];
  bcvRate: number;
  customers: CustomerUser[];
  orders: Order[];
  onUpdateFranchise: (updated: FranchiseTenant) => void;
  onAddFranchise: (newFranq: FranchiseTenant) => void;
  onDeleteFranchise?: (id: string) => void;
  onApproveTopup: (reportId: string, reviewedBy: string) => void;
  onRejectTopup: (reportId: string, reason: string) => void;
  onCreateTopupReport: (newReport: FranchiseTopupReport) => void;
  onAssignBalanceToCustomer?: (franchiseId: string, customerId: string, amountUsd: number) => void;
  templates?: MessageTemplate[];
  onOpenContractModal?: () => void;
}

export const AdminFranchiseManager: React.FC<AdminFranchiseManagerProps> = ({
  franchises,
  topupReports,
  bcvRate,
  customers,
  orders,
  onUpdateFranchise,
  onAddFranchise,
  onDeleteFranchise,
  onApproveTopup,
  onRejectTopup,
  onCreateTopupReport,
  onAssignBalanceToCustomer,
  templates = [],
  onOpenContractModal
}) => {
  const [activeTab, setActiveTab] = useState<'franchises' | 'topups' | 'report_simulator'>('franchises');
  const [searchQuery, setSearchQuery] = useState('');
  const [topupFilter, setTopupFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modals & form state
  const [isAddFranchiseModalOpen, setIsAddFranchiseModalOpen] = useState(false);
  const [selectedReportForReview, setSelectedReportForReview] = useState<FranchiseTopupReport | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [approvedReportModalData, setApprovedReportModalData] = useState<{
    report: FranchiseTopupReport;
    franchise: FranchiseTenant;
    messageText: string;
    customerMessageText: string;
  } | null>(null);

  // Quick edit state for monthly fee or wallet name
  const [editingFranchiseId, setEditingFranchiseId] = useState<string | null>(null);
  const [editFeeVal, setEditFeeVal] = useState<number>(25);
  const [editWalletNameVal, setEditWalletNameVal] = useState<string>('StreamPay');

  // Assign balance modal
  const [assignModalFranchise, setAssignModalFranchise] = useState<FranchiseTenant | null>(null);
  const [assignCustomerId, setAssignCustomerId] = useState<string>(customers[0]?.id || '');
  const [assignAmountUsd, setAssignAmountUsd] = useState<number>(5);
  const [assignCustomerNotice, setAssignCustomerNotice] = useState<string | null>(null);

  // Pro Modules & Add-ons configuration state
  const [modulesModalFranchise, setModulesModalFranchise] = useState<FranchiseTenant | null>(null);
  const [manualModalFranchise, setManualModalFranchise] = useState<FranchiseTenant | null>(null);
  const [resellerModalFranchise, setResellerModalFranchise] = useState<FranchiseTenant | null>(null);
  const [clientsModalFranchise, setClientsModalFranchise] = useState<FranchiseTenant | null>(null);
  const [selectedModules, setSelectedModules] = useState<FranchiseModulePermission>({
    calendar: false,
    credits: false,
    reminders: false,
    botAutomation: false,
    supplierPurchases: false,
    customDomain: false,
    branding: false,
    installments: false,
    resellers: false
  });
  const [baseFee, setBaseFee] = useState<number>(25);
  const [modulePrices, setModulePrices] = useState<Record<keyof FranchiseModulePermission, number>>({
    calendar: 5,
    credits: 8,
    reminders: 5,
    botAutomation: 10,
    supplierPurchases: 15,
    customDomain: 12,
    branding: 10,
    installments: 10,
    resellers: 20
  });

  const handleOpenModules = (f: FranchiseTenant) => {
    setModulesModalFranchise(f);
    setSelectedModules(f.enabledModules || {
      calendar: false,
      credits: false,
      reminders: false,
      botAutomation: false,
      supplierPurchases: false,
      customDomain: false,
      branding: false,
      installments: false,
      resellers: false
    });
    setBaseFee(25);
  };

  const handleSaveModules = () => {
    if (!modulesModalFranchise) return;
    let extra = 0;
    if (selectedModules.calendar) extra += modulePrices.calendar;
    if (selectedModules.credits) extra += modulePrices.credits;
    if (selectedModules.reminders) extra += modulePrices.reminders;
    if (selectedModules.botAutomation) extra += modulePrices.botAutomation;
    if (selectedModules.supplierPurchases) extra += modulePrices.supplierPurchases;
    if (selectedModules.customDomain) extra += modulePrices.customDomain;
    if (selectedModules.branding) extra += modulePrices.branding;
    if (selectedModules.installments) extra += modulePrices.installments;
    if (selectedModules.resellers) extra += modulePrices.resellers;

    const updated: FranchiseTenant = {
      ...modulesModalFranchise,
      enabledModules: selectedModules,
      extraAddonsMonthlyUsd: extra,
      monthlyFeeUsd: baseFee + extra
    };

    onUpdateFranchise(updated);
    setModulesModalFranchise(null);
  };

  // New Franchise Form State
  const [newBizName, setNewBizName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTelegram, setNewTelegram] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCustomDomain, setNewCustomDomain] = useState('');
  const [newWalletName, setNewWalletName] = useState('StreamPay');
  const [newMonthlyFee, setNewMonthlyFee] = useState<number>(25);
  const [newSubStatus, setNewSubStatus] = useState<FranchiseSubscriptionStatus>('pagado');

  // Simulator Form State (Franchisee Reporting Topup)
  const [simFranchiseId, setSimFranchiseId] = useState<string>(franchises[0]?.id || '');
  const [simCustomerName, setSimCustomerName] = useState('');
  const [simAmountUsd, setSimAmountUsd] = useState<number>(15);
  const [simPaymentMethod, setSimPaymentMethod] = useState('Pago Móvil (Banesco)');
  const [simReference, setSimReference] = useState('');
  const [simNotes, setSimNotes] = useState('');
  const [simScreenshotUrl, setSimScreenshotUrl] = useState('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80');
  const [simSuccessNotice, setSimSuccessNotice] = useState(false);

  // Metrics
  const totalFranchises = franchises.length;
  const activeFranchises = franchises.filter((f) => f.status === 'active').length;
  const pausedFranchises = franchises.filter((f) => f.status === 'paused').length;
  const pendingTopupsCount = topupReports.filter((r) => r.status === 'pending').length;
  const totalCustodyBalance = franchises.reduce((acc, f) => acc + (f.availableMasterBalanceUsd || 0), 0);

  // Filtered lists
  const filteredFranchises = franchises.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.businessName.toLowerCase().includes(q) ||
      f.ownerName.toLowerCase().includes(q) ||
      f.phone.toLowerCase().includes(q) ||
      (f.telegramUser && f.telegramUser.toLowerCase().includes(q))
    );
  });

  const filteredTopups = topupReports.filter((r) => {
    if (topupFilter !== 'all' && r.status !== topupFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.franchiseName.toLowerCase().includes(q) ||
      r.referenceNumber.toLowerCase().includes(q) ||
      (r.targetCustomerName && r.targetCustomerName.toLowerCase().includes(q))
    );
  });

  // Handle Approve Topup
  const handleConfirmApproval = (report: FranchiseTopupReport) => {
    onApproveTopup(report.id, 'Gregori Izquierdo (Master)');
    const franq = franchises.find((f) => f.id === report.franchiseId);
    if (!franq) return;

    const newBalance = (franq.availableMasterBalanceUsd || 0) + report.amountUsd;

    // Build Master -> Franchisee WhatsApp & Telegram message
    const masterTmpl = templates.find((t) => t.id === 'confirmacion_abono_master_a_franquicia');
    const defaultMasterContent = `*GREGORI IZQUIERDO STREAMING — ACREDITACIÓN MASTER*
Hola *{titular_franquicia}* (*{franquicia}*),

Tu reporte de abono ha sido verificado y acreditado exitosamente en tu pool de franquicia:
💵 *Monto Acreditado:* \${monto_usd} USD (Bs. {monto_bs})
🏦 *Método / Banco:* {banco}
🔢 *Nro. de Referencia:* {referencia}
👤 *Destinado a:* {cliente_destino}

💼 *Billetera:* {billetera_nombre}
💰 *Nuevo Saldo Total Disponible:* \${saldo_total_disponible} USD

Ya puedes asignar o utilizar este saldo con tu cliente final en tu plataforma:
🌐 {dominio}

¡Gracias por tu compromiso y crecimiento!`;

    const masterMessageText = renderTemplate(masterTmpl ? masterTmpl.content : defaultMasterContent, {
      franquicia: franq.businessName,
      titular_franquicia: franq.ownerName,
      monto_usd: report.amountUsd.toFixed(2),
      monto_bs: report.amountBs.toFixed(2),
      banco: report.paymentMethod,
      referencia: report.referenceNumber,
      saldo_total_disponible: newBalance.toFixed(2),
      billetera_nombre: franq.walletCustomName,
      cliente_destino: report.targetCustomerName || 'Cliente Final',
      dominio: franq.customDomain || DOMAIN_OFFICIAL
    });

    // Build Franchisee -> Customer message
    const custTmpl = templates.find((t) => t.id === 'confirmacion_abono_franquicia_a_cliente');
    const defaultCustContent = `*RECARGA EXITOSA EN {billetera_nombre}*
Hola *{cliente}*, te confirmamos que tu abono ha sido validado y acreditado con éxito.

💵 *Monto Recargado:* \${monto_usd} USD (Bs. {monto_bs})
🔢 *Referencia:* {referencia}
💼 *Billetera:* {billetera_nombre}
💰 *Tu Saldo Disponible:* \${saldo_actual} USD

Ya puedes usar tu saldo para activar o renovar cualquiera de nuestros servicios de streaming en:
🌐 {dominio}

¡Gracias por confiar en *{franquicia}*!`;

    const custMessageText = renderTemplate(custTmpl ? custTmpl.content : defaultCustContent, {
      cliente: report.targetCustomerName || 'Estimado Cliente',
      franquicia: franq.businessName,
      billetera_nombre: franq.walletCustomName,
      monto_usd: report.amountUsd.toFixed(2),
      monto_bs: report.amountBs.toFixed(2),
      saldo_actual: report.amountUsd.toFixed(2),
      referencia: report.referenceNumber,
      dominio: franq.customDomain || DOMAIN_OFFICIAL
    });

    setSelectedReportForReview(null);
    setApprovedReportModalData({
      report,
      franchise: franq,
      messageText: masterMessageText,
      customerMessageText: custMessageText
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Tenant Metrics */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2.5 border border-indigo-500/30">
            <Building className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gestión Multi-Sede & Franquicias Digitales</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black">
            Control de Franquiciados, Suscripciones y Recaudación Central
          </h3>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Administra tus franquicias aliadas, establece su tarifa mensual, gestiona cobros y audita los reportes de abono que entran directamente a tus cuentas bancarias.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenContractModal && (
            <button
              type="button"
              onClick={onOpenContractModal}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Contrato & Tarifas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddFranchiseModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Franquicia</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Franquicias
          </span>
          <div className="text-2xl font-black text-slate-900">{totalFranchises}</div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>{activeFranchises} activas</span>
            {pausedFranchises > 0 && (
              <span className="text-amber-600">· {pausedFranchises} en pausa</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Abonos por Auditar
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingTopupsCount}</span>
            {pendingTopupsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                Acción req.
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Comprobantes recibidos</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Saldo Central en Custodia
          </span>
          <div className="text-2xl font-black text-indigo-700">
            ${totalCustodyBalance.toFixed(2)} <span className="text-xs font-normal text-slate-500">USD</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Bs. {(totalCustodyBalance * bcvRate).toFixed(2)} BCV
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tasa Oficial BCV
          </span>
          <div className="text-2xl font-black text-slate-900">
            {bcvRate.toFixed(2)} <span className="text-xs font-normal text-slate-500">Bs/USD</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Banco Central de Venezuela</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('franchises')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'franchises'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Directorio de Franquicias ({franchises.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('topups')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'topups'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span>📥 Bandeja de Abonos a Cuenta Maestra</span>
            {pendingTopupsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                {pendingTopupsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report_simulator')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'report_simulator'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>📱 Reportar Abono (Simulador Franquiciado)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar franquicia o ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* TAB 1: DIRECTORIO DE FRANQUICIAS */}
      {activeTab === 'franchises' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFranchises.map((f) => {
              const isPaused = f.status === 'paused';
              const isEditing = editingFranchiseId === f.id;

              return (
                <div
                  key={f.id}
                  className={`rounded-3xl border transition-all p-5 space-y-4 bg-white ${
                    isPaused
                      ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                      : 'border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">
                          {f.businessName}
                        </span>
                        {isPaused ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Pause className="w-2.5 h-2.5" />
                            <span>Pausada</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Activa</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Titular: <strong>{f.ownerName}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {f.phone} {f.telegramUser && `· ${f.telegramUser}`}
                      </p>
                    </div>

                    {/* Quick Pause/Unpause Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newStatus: FranchiseStatus = isPaused ? 'active' : 'paused';
                        onUpdateFranchise({
                          ...f,
                          status: newStatus
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                        isPaused
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      }`}
                      title={isPaused ? 'Reactivar acceso al panel' : 'Bloquear acceso por mora o mantenimiento'}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Reactivar' : 'Pausar'}</span>
                    </button>
                  </div>

                  {/* Financial & Wallet Details */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Billetera Privada:</span>
                      <span className="font-extrabold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                        {f.walletCustomName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Tarifa Mensual:</span>
                      <div className="text-right">
                        <strong className="text-slate-900 font-bold">${f.monthlyFeeUsd.toFixed(2)} USD / mes</strong>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (Bs. {(f.monthlyFeeUsd * bcvRate).toFixed(2)})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Estado de Suscripción:</span>
                      <select
                        value={f.subscriptionStatus}
                        onChange={(e) => {
                          const val = e.target.value as FranchiseSubscriptionStatus;
                          onUpdateFranchise({
                            ...f,
                            subscriptionStatus: val
                          });
                        }}
                        className={`text-[11px] font-bold rounded-lg px-2 py-1 border ${
                          f.subscriptionStatus === 'pagado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : f.subscriptionStatus === 'credito'
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="pagado">🟢 Pagado</option>
                        <option value="credito">🟡 A Crédito</option>
                        <option value="pendiente">⚪ Pendiente</option>
                        <option value="vencido">🔴 Vencido</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-600 font-bold">Saldo Central Master:</span>
                      <span className="font-extrabold text-emerald-700 text-sm">
                        ${f.availableMasterBalanceUsd.toFixed(2)} USD
                      </span>
                    </div>

                    {/* Active Modules Badges */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Módulos Pro Asignados:</span>
                        {f.extraAddonsMonthlyUsd && f.extraAddonsMonthlyUsd > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            +${f.extraAddonsMonthlyUsd.toFixed(2)} USD
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {f.enabledModules?.calendar && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            📅 Calendario
                          </span>
                        )}
                        {f.enabledModules?.credits && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            💳 Crédito & Cobranza
                          </span>
                        )}
                        {f.enabledModules?.reminders && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            🔔 Avisos 1 Día
                          </span>
                        )}
                        {f.enabledModules?.botAutomation && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🤖 Bot WhatsApp
                          </span>
                        )}
                        {f.enabledModules?.supplierPurchases && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            📦 Proveedores
                          </span>
                        )}
                        {f.enabledModules?.customDomain && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            🌐 Dominio Propio
                          </span>
                        )}
                        {(!f.enabledModules || Object.values(f.enabledModules).every(v => !v)) && (
                          <span className="text-[10px] text-slate-400 italic">Plan básico (sin extras)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAssignModalFranchise(f);
                          setAssignAmountUsd(Math.min(f.availableMasterBalanceUsd, 5));
                        }}
                        disabled={f.availableMasterBalanceUsd <= 0}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Asignar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenModules(f)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-purple-200 shadow-2xs"
                        title="Asignar opciones de la franquicia y cobrar extra"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Módulos Pro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualModalFranchise(f)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-blue-200"
                        title="Generar Manual de Uso y Contrato de Franquicia"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Manual / Contrato</span>
                      </button>

                      {f.enabledModules?.resellers && (
                        <button
                          type="button"
                          onClick={() => setResellerModalFranchise(f)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-amber-200"
                          title="Gestionar Red de Revendedores / Sub-Franquicias"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span>Revendedores ({f.subFranchises?.length || 0})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setClientsModalFranchise(f)}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-teal-200"
                        title="Ver clientes y red registrados bajo esta franquicia"
                      >
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span>Clientes / Red</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Button */}
                      <a
                        href={`https://wa.me/${f.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hola ${f.ownerName} (${f.businessName}), te escribe Gregori Izquierdo respecto a tu franquicia streaming.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                        title="Abrir WhatsApp con el titular"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* Telegram Button */}
                      {f.telegramUser && (
                        <a
                          href={generateTelegramUrl('Hola, te contacto respecto a tu franquicia streaming.', f.telegramUser)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition"
                          title="Abrir Telegram con el titular"
                        >
                          <Send className="w-4 h-4" />
                        </a>
                      )}

                      {/* Quick Edit Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFranchiseId(isEditing ? null : f.id);
                          setEditFeeVal(f.monthlyFeeUsd);
                          setEditWalletNameVal(f.walletCustomName);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Editar tarifa o nombre de billetera"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Edit Panel */}
                  {isEditing && (
                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2.5 animate-in fade-in text-xs">
                      <strong className="text-indigo-950 font-bold block">
                        Editar Configuración de {f.businessName}
                      </strong>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                            Tarifa ($ USD):
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editFeeVal}
                            onChange={(e) => setEditFeeVal(Number(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                            Nombre Billetera:
                          </label>
                          <input
                            type="text"
                            value={editWalletNameVal}
                            onChange={(e) => setEditWalletNameVal(e.target.value)}
                            className="w-full px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingFranchiseId(null)}
                          className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 text-[11px]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateFranchise({
                              ...f,
                              monthlyFeeUsd: editFeeVal,
                              walletCustomName: editWalletNameVal
                            });
                            setEditingFranchiseId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BANDEJA DE ABONOS A CUENTA MAESTRA */}
      {activeTab === 'topups' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filtrar por:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setTopupFilter(filterKey)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  topupFilter === filterKey
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filterKey === 'all' && `Todos (${topupReports.length})`}
                {filterKey === 'pending' && `Pendientes (${topupReports.filter((r) => r.status === 'pending').length})`}
                {filterKey === 'approved' && `Aprobados (${topupReports.filter((r) => r.status === 'approved').length})`}
                {filterKey === 'rejected' && `Rechazados (${topupReports.filter((r) => r.status === 'rejected').length})`}
              </button>
            ))}
          </div>

          {filteredTopups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-800 text-base">No hay reportes de abono en esta vista</h4>
              <p className="text-slate-500 text-xs">
                Cuando una franquicia envíe un abono hacia tu cuenta maestra, aparecerá listado aquí para verificación.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopups.map((r) => {
                const isPending = r.status === 'pending';
                const isApproved = r.status === 'approved';
                const isRejected = r.status === 'rejected';

                return (
                  <div
                    key={r.id}
                    className={`p-5 rounded-3xl border transition-all space-y-3.5 bg-white ${
                      isPending
                        ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md'
                        : isApproved
                        ? 'border-emerald-200 shadow-xs'
                        : 'border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            {r.franchiseName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">#{r.id}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Destinado a: <strong>{r.targetCustomerName || 'Saldo Franquicia'}</strong>
                        </p>
                      </div>

                      {isPending && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pendiente de Auditoría</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Acreditado</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-600" />
                          <span>Rechazado</span>
                        </span>
                      )}
                    </div>

                    {/* Financial details */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Monto Transferido a Cuenta Maestra
                        </span>
                        <div className="text-base font-black text-indigo-700">
                          ${r.amountUsd.toFixed(2)} USD
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Bs. {r.amountBs.toFixed(2)} BCV
                        </span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Método & Referencia
                        </span>
                        <div className="font-bold text-slate-800">{r.paymentMethod}</div>
                        <div className="font-mono text-xs font-black text-indigo-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                          Ref: {r.referenceNumber}
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Preview */}
                    {r.screenshotImage && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <img
                          src={r.screenshotImage}
                          alt="Comprobante"
                          className="w-14 h-14 rounded-lg object-cover border border-slate-300 cursor-pointer hover:opacity-90"
                          onClick={() => window.open(r.screenshotImage, '_blank')}
                        />
                        <div className="flex-1">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            Captura del Comprobante Bancario
                          </span>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{r.notes || 'Sin notas adicionales.'}</p>
                          <a
                            href={r.screenshotImage}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver imagen completa</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Actions if Pending */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReportForReview(r);
                            setRejectionReasonInput('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition cursor-pointer"
                        >
                          Rechazar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmApproval(r)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Aprobar & Acreditar Saldo</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SIMULADOR DE REPORTE DE ABONO (VISTA FRANQUICIADO) */}
      {activeTab === 'report_simulator' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm max-w-2xl mx-auto space-y-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vista del Franquiciado · Reporte de Fondos a Gregori</span>
            </div>
            <h4 className="text-lg font-black text-slate-900">
              Formulario de Notificación de Abono Central
            </h4>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">
              Este es el formulario exacto con el que tu franquiciado te reporta que él o su cliente te transfirieron fondos a tu cuenta maestra (Pago Móvil / Binance). Al enviarlo, te llegará una notificación a tu panel para su revisión.
            </p>
          </div>

          {simSuccessNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                ¡Reporte de abono enviado exitosamente a la administración central! Ya aparece en la pestaña de Bandeja de Abonos para su aprobación.
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const franq = franchises.find((f) => f.id === simFranchiseId) || franchises[0];
              const newReport: FranchiseTopupReport = {
                id: `ABONO-${Math.floor(1000 + Math.random() * 9000)}`,
                franchiseId: franq?.id || 'franq-1',
                franchiseName: franq?.businessName || 'Franquicia Aliada',
                franchisePhone: franq?.phone || '+584141234567',
                franchiseTelegram: franq?.telegramUser,
                targetCustomerName: simCustomerName.trim() || 'Cliente Final Registrado',
                amountUsd: simAmountUsd,
                amountBs: Number((simAmountUsd * bcvRate).toFixed(2)),
                paymentMethod: simPaymentMethod,
                referenceNumber: simReference.trim() || String(Math.floor(100000 + Math.random() * 900000)),
                screenshotImage: simScreenshotUrl,
                notes: simNotes.trim(),
                status: 'pending',
                createdAt: new Date().toISOString()
              };

              onCreateTopupReport(newReport);
              setSimSuccessNotice(true);
              setSimReference('');
              setSimCustomerName('');
              setTimeout(() => setSimSuccessNotice(false), 4000);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Franquicia que emite el reporte: *
              </label>
              <select
                value={simFranchiseId}
                onChange={(e) => setSimFranchiseId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.businessName} ({f.ownerName}) · Wallet: {f.walletCustomName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Monto Transferido en USD: *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={simAmountUsd}
                    onChange={(e) => setSimAmountUsd(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Equivalente en Bolívares: <strong>Bs. {(simAmountUsd * bcvRate).toFixed(2)}</strong> (BCV: {bcvRate.toFixed(2)})
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Método de Pago Receptor de Gregori: *
                </label>
                <select
                  value={simPaymentMethod}
                  onChange={(e) => setSimPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                >
                  <option value="Pago Móvil (Banesco)">Pago Móvil (Banesco)</option>
                  <option value="Pago Móvil (Mercantil)">Pago Móvil (Mercantil)</option>
                  <option value="Binance Pay USDT">Binance Pay USDT</option>
                  <option value="Zinli / Wally">Zinli / Wally Tech</option>
                  <option value="Efectivo en Tienda Central">Efectivo en Tienda Central</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Número de Referencia Bancaria: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 098124 o BIN-78912"
                  value={simReference}
                  onChange={(e) => setSimReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Cliente Destino en su Franquicia:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pedro Martínez (Don Pedro)"
                  value={simCustomerName}
                  onChange={(e) => setSimCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Captura del Comprobante (URL o Demo):
              </label>
              <input
                type="text"
                value={simScreenshotUrl}
                onChange={(e) => setSimScreenshotUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-[11px] text-slate-700"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Notas / Mensaje para la Administración:
              </label>
              <textarea
                rows={2}
                placeholder="Ej. Pago móvil enviado por el cliente para recarga de billetera."
                value={simNotes}
                onChange={(e) => setSimNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Reporte de Abono a Revisión Central</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL: POST-APROBACIÓN DE ABONO CON BOTONES WHATSAPP & TELEGRAM */}
      {approvedReportModalData && (
        <div className="fixed inset-0 z-80 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    ¡Abono Acreditado Exitosamente!
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Monto sumado al pool de {approvedReportModalData.franchise.businessName}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovedReportModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message preview to franchisee */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Mensaje Predefinido para el Franquiciado (WhatsApp & Telegram):</span>
              </span>
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto border border-slate-800 shadow-inner">
                {approvedReportModalData.messageText}
              </div>
            </div>

            {/* Direct Send Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/${approvedReportModalData.franchise.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  approvedReportModalData.messageText
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </a>

              <a
                href={generateTelegramUrl(
                  approvedReportModalData.messageText,
                  approvedReportModalData.franchise.telegramUser
                )}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por Telegram</span>
              </a>
            </div>

            {/* Franchisee to Customer copy helper */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">
                  Plantilla para que el Franquiciado notifique a su cliente ({approvedReportModalData.report.targetCustomerName}):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(approvedReportModalData.customerMessageText);
                    alert('Copiado mensaje para cliente final.');
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 italic font-mono bg-white p-2 rounded-xl border border-slate-200">
                "{approvedReportModalData.customerMessageText.substring(0, 120)}..."
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setApprovedReportModalData(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASIGNAR SALDO A CLIENTE FINAL DESDE EL POOL DE FRANQUICIA */}
      {assignModalFranchise && (
        <div className="fixed inset-0 z-80 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Asignar Saldo a Cliente Final
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalFranchise(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
              <div>Franquicia: <strong>{assignModalFranchise.businessName}</strong></div>
              <div>Billetera: <strong>{assignModalFranchise.walletCustomName}</strong></div>
              <div>Saldo Master Disponible: <strong className="text-emerald-700">${assignModalFranchise.availableMasterBalanceUsd.toFixed(2)} USD</strong></div>
            </div>

            {assignCustomerNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{assignCustomerNotice}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (assignAmountUsd > assignModalFranchise.availableMasterBalanceUsd) {
                  alert('El monto a asignar no puede exceder el saldo disponible de la franquicia.');
                  return;
                }

                if (onAssignBalanceToCustomer) {
                  onAssignBalanceToCustomer(assignModalFranchise.id, assignCustomerId, assignAmountUsd);
                }

                // Deduct from franchise
                onUpdateFranchise({
                  ...assignModalFranchise,
                  availableMasterBalanceUsd: assignModalFranchise.availableMasterBalanceUsd - assignAmountUsd
                });

                const cust = customers.find((c) => c.id === assignCustomerId);
                setAssignCustomerNotice(`¡$${assignAmountUsd.toFixed(2)} USD asignados a ${cust?.name || 'cliente'}!`);
                setTimeout(() => {
                  setAssignCustomerNotice(null);
                  setAssignModalFranchise(null);
                }, 2000);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Seleccionar Cliente Final: *
                </label>
                <select
                  value={assignCustomerId}
                  onChange={(e) => setAssignCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) · Saldo Actual: ${c.grpayBalance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Monto a Asignar ($ USD): *
                </label>
                <input
                  type="number"
                  min="0.5"
                  max={assignModalFranchise.availableMasterBalanceUsd}
                  step="0.5"
                  required
                  value={assignAmountUsd}
                  onChange={(e) => setAssignAmountUsd(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Bs. {(assignAmountUsd * bcvRate).toFixed(2)} BCV
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalFranchise(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Asignación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA FRANQUICIA */}
      {isAddFranchiseModalOpen && (
        <div className="fixed inset-0 z-80 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Registrar Nueva Franquicia Aliada</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFranchiseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const created: FranchiseTenant = {
                  id: `franq-${Date.now()}`,
                  businessName: newBizName.trim(),
                  ownerName: newOwnerName.trim(),
                  phone: newPhone.trim(),
                  telegramUser: newTelegram.trim() || undefined,
                  email: newEmail.trim(),
                  customDomain: newCustomDomain.trim() || undefined,
                  walletCustomName: newWalletName.trim() || 'StreamPay',
                  monthlyFeeUsd: newMonthlyFee,
                  subscriptionStatus: newSubStatus,
                  status: 'active',
                  availableMasterBalanceUsd: 0.00,
                  createdAt: new Date().toISOString()
                };

                onAddFranchise(created);
                setIsAddFranchiseModalOpen(false);
                setNewBizName('');
                setNewOwnerName('');
                setNewPhone('');
                setNewTelegram('');
                setNewEmail('');
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre Comercial del Negocio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. StreamPlus Maracay"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Titular / Propietario *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teléfono WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. +58 414 123 4567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Usuario de Telegram (opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. @carlos_stream"
                    value={newTelegram}
                    onChange={(e) => setNewTelegram(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Correo Electrónico (Gmail):
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. streamplus@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nombre Billetera:
                  </label>
                  <input
                    type="text"
                    placeholder="StreamPay"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tarifa ($ USD/mes):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMonthlyFee}
                    onChange={(e) => setNewMonthlyFee(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Suscripción:
                  </label>
                  <select
                    value={newSubStatus}
                    onChange={(e) => setNewSubStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value="pagado">Pagado</option>
                    <option value="credito">A Crédito</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Dominio Personalizado (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. streamplus.xyz"
                  value={newCustomDomain}
                  onChange={(e) => setNewCustomDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddFranchiseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Franquicia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR MODULOS PRO & EXTRAS PARA FRANQUICIA */}
      {modulesModalFranchise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Módulos Pro & Permisos de Franquicia
                  </h3>
                  <p className="text-slate-300 text-xs">
                    {modulesModalFranchise.businessName} • Titular: {modulesModalFranchise.ownerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModulesModalFranchise(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-purple-950 leading-relaxed">
                <strong>Configura qué módulos Pro tiene activos este franquiciado.</strong> Puedes cobrar un plus o recargo mensual adicional por cada función avanzada que le habilites para generar ingresos recurrentes extra.
              </div>

              {/* Module Toggle Items */}
              <div className="space-y-3">
                {(
                  [
                    {
                      key: 'calendar' as const,
                      title: '📅 Calendario de Vencimientos',
                      desc: 'Panel interactivo de renovaciones por fecha con colores de vencimiento y alertas visuales.',
                      defaultPrice: 5
                    },
                    {
                      key: 'credits' as const,
                      title: '💳 Créditos & Cobranzas a Clientes',
                      desc: 'Gestión de cuentas fiadas/crédito, estados de pago (pendiente/pagado/vencido) y seguimiento de cobros.',
                      defaultPrice: 8
                    },
                    {
                      key: 'reminders' as const,
                      title: '🔔 Avisos de Vencimiento 1 Día Antes',
                      desc: 'Filtro automático de clientes por vencer en 24-48 horas con botón directo a WhatsApp y Telegram.',
                      defaultPrice: 5
                    },
                    {
                      key: 'botAutomation' as const,
                      title: '🤖 Bot Automatizado WhatsApp & Plantillas Pro',
                      desc: 'Asistente 24/7 y disparadores de plantillas automáticas con un solo clic.',
                      defaultPrice: 10
                    },
                    {
                      key: 'supplierPurchases' as const,
                      title: '📦 Compras a Proveedores & Finanzas Recharts',
                      desc: 'Inventario de cuentas madre, matriz de slots por PIN y gráficos interactivos de ganancias.',
                      defaultPrice: 15
                    },
                    {
                      key: 'customDomain' as const,
                      title: '🌐 Dominio Propio / Marca Blanca',
                      desc: 'Enlace exclusivo de su tienda con su propio dominio web y marca personalizada.',
                      defaultPrice: 12
                    },
                    {
                      key: 'branding' as const,
                      title: '🎨 Personalización de Marca, Logo & Colores',
                      desc: 'Permite al franquiciado cambiar nombre, logo, rif, eslogan y colores de su tienda.',
                      defaultPrice: 10
                    },
                    {
                      key: 'installments' as const,
                      title: '💳 Método de Pago en Cuotas (Fraccionado)',
                      desc: 'Habilita la opción de ventas con cuota inicial y pagos fraccionados para sus clientes.',
                      defaultPrice: 10
                    },
                    {
                      key: 'resellers' as const,
                      title: '👥 Red de Revendedores / Sub-Franquicias',
                      desc: 'Permite al franquiciado crear y gestionar su propia red de sub-franquiciados.',
                      defaultPrice: 20
                    }
                  ] satisfies { key: keyof FranchiseModulePermission; title: string; desc: string; defaultPrice: number }[]
                ).map((mod) => {
                  const isChecked = Boolean(selectedModules[mod.key]);
                  const price = modulePrices[mod.key];

                  return (
                    <div
                      key={mod.key}
                      onClick={() => {
                        const nextState = !selectedModules[mod.key];
                        const updated = { ...selectedModules, [mod.key]: nextState };
                        if (mod.key === 'installments' && nextState && !selectedModules.calendar) {
                          updated.calendar = true;
                          alert('⚠️ Dependencia de Módulo: Al activar "Pago en Cuotas", se requiere obligatoriamente y se ha vinculado automáticamente el "Calendario de Vencimientos".');
                        }
                        setSelectedModules(updated);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-purple-50/60 border-purple-300 ring-1 ring-purple-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <strong className="text-slate-900 block font-bold text-xs">{mod.title}</strong>
                          <p className="text-slate-500 text-[11px] leading-snug mt-0.5">{mod.desc}</p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 text-[11px] font-bold">+$</span>
                          <input
                            type="number"
                            min="0"
                            value={price}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setModulePrices((p) => ({ ...p, [mod.key]: val }));
                            }}
                            className="w-14 px-2 py-1 rounded-lg border border-slate-300 bg-white font-mono font-bold text-xs text-right text-purple-700"
                          />
                          <span className="text-slate-500 text-[10px]">/mes</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation Summary */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Tarifa Base de Franquicia:</span>
                  <span className="font-mono font-bold">${baseFee.toFixed(2)} USD</span>
                </div>
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span>Total Plus Módulos Pro Seleccionados:</span>
                  <span className="font-mono font-bold">
                    +${(
                      (selectedModules.calendar ? modulePrices.calendar : 0) +
                      (selectedModules.credits ? modulePrices.credits : 0) +
                      (selectedModules.reminders ? modulePrices.reminders : 0) +
                      (selectedModules.botAutomation ? modulePrices.botAutomation : 0) +
                      (selectedModules.supplierPurchases ? modulePrices.supplierPurchases : 0) +
                      (selectedModules.customDomain ? modulePrices.customDomain : 0)
                    ).toFixed(2)}{' '}
                    USD
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Nueva Cuota Mensual Total:</span>
                  <div className="text-right">
                    <strong className="text-emerald-400 font-mono font-black text-base">
                      ${(
                        baseFee +
                        (selectedModules.calendar ? modulePrices.calendar : 0) +
                        (selectedModules.credits ? modulePrices.credits : 0) +
                        (selectedModules.reminders ? modulePrices.reminders : 0) +
                        (selectedModules.botAutomation ? modulePrices.botAutomation : 0) +
                        (selectedModules.supplierPurchases ? modulePrices.supplierPurchases : 0) +
                        (selectedModules.customDomain ? modulePrices.customDomain : 0)
                      ).toFixed(2)}{' '}
                      USD / mes
                    </strong>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      (Bs.{' '}
                      {(
                        (baseFee +
                          (selectedModules.calendar ? modulePrices.calendar : 0) +
                          (selectedModules.credits ? modulePrices.credits : 0) +
                          (selectedModules.reminders ? modulePrices.reminders : 0) +
                          (selectedModules.botAutomation ? modulePrices.botAutomation : 0) +
                          (selectedModules.supplierPurchases ? modulePrices.supplierPurchases : 0) +
                          (selectedModules.customDomain ? modulePrices.customDomain : 0)) *
                        bcvRate
                      ).toFixed(2)}{' '}
                      BCV)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModulesModalFranchise(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModules}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Asignación & Tarifa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL & CONTRACT MODAL */}
      {manualModalFranchise && (
        <AdminFranchiseManualModal
          franchise={manualModalFranchise}
          bcvRate={bcvRate}
          onClose={() => setManualModalFranchise(null)}
        />
      )}

      {/* RESELLER NETWORK MODAL */}
      {resellerModalFranchise && (
        <AdminResellerNetworkModal
          franchise={resellerModalFranchise}
          onUpdateFranchise={onUpdateFranchise}
          onClose={() => setResellerModalFranchise(null)}
        />
      )}

      {/* CLIENTS & NETWORK FICHA MODAL */}
      {clientsModalFranchise && (
        <AdminFranchiseClientsModal
          franchise={clientsModalFranchise}
          customers={customers}
          orders={orders}
          onClose={() => setClientsModalFranchise(null)}
        />
      )}
    </div>
  );
};
