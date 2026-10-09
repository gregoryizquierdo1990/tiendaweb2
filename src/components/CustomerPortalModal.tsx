import React, { useState } from 'react';
import {
  X,
  Wallet,
  Clock,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  CreditCard,
  LogOut,
  RefreshCw,
  AlertTriangle,
  FileText,
  Eye,
  Lock
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  CustomerUser,
  Order,
  PaymentMethod,
  WalletTopup,
  CurrencyCode,
  Invoice
} from '../types';
import {
  formatCurrency,
  formatGrpay,
  getDaysRemaining,
  buildWhatsAppPaymentUrl,
  buildWhatsAppTopupUrl,
  generateTopupId,
  safeFormatDate
} from '../utils/formatters';
import { compressImageFile } from '../utils/imageCompressor';

interface CustomerPortalModalProps {
  user: CustomerUser;
  orders: Order[];
  walletTopups: WalletTopup[];
  paymentMethods: PaymentMethod[];
  bcvRate: number;
  onClose: () => void;
  onLogout: () => void;
  onRequestTopup: (topup: WalletTopup) => Promise<void>;
  onRenewSubscription: (order: Order) => void;
  onOpenIncidentReport?: () => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  user,
  orders,
  walletTopups,
  paymentMethods,
  bcvRate,
  onClose,
  onLogout,
  onRequestTopup,
  onRenewSubscription,
  onOpenIncidentReport
}) => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'wallet' | 'orders' | 'installments' | 'invoices'>('subscriptions');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Read invoices from global store
  const allInvoices = useAppStore((state) => state.invoices);
  const myInvoices = allInvoices.filter(
    (inv) =>
      (inv.customerId && inv.customerId === user.id) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase() === user.email.toLowerCase())
  );

  // Top-up modal states
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmountUsd, setTopupAmountUsd] = useState<number>(10);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentMethods.length > 0 ? paymentMethods[0].id : ''
  );
  const [topupRefNumber, setTopupRefNumber] = useState('');
  const [topupReceiptImage, setTopupReceiptImage] = useState<string | null>(null);
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<WalletTopup | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Filter orders for this customer (by customerId or customerEmail)
  const myOrders = orders.filter(
    (o) =>
      (o.customerId && o.customerId === user.id) ||
      o.customerEmail.toLowerCase() === user.email.toLowerCase()
  );

  const myTopups = walletTopups.filter(
    (t) =>
      t.customerId === user.id ||
      t.customerEmail.toLowerCase() === user.email.toLowerCase()
  );

  const activeSubscriptions = myOrders.filter(
    (o) => o.status === 'confirmed' || o.status === 'delivered'
  );

  const myInstallments = myOrders.filter(
    (o) => o.paymentCondition === 'cuotas' || Boolean(o.installmentPlan)
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const selectedMethod =
    paymentMethods.find((m) => m.id === selectedMethodId) || paymentMethods[0];

  const equivalentBs = (topupAmountUsd * bcvRate).toFixed(2);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setTopupReceiptImage(compressed);
      } catch (err) {
        console.warn('Error al procesar comprobante:', err);
      }
    }
  };

  const handleSubmitTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupRefNumber.trim()) return;

    try {
      setIsSubmittingTopup(true);
      const isBs = selectedMethod.acceptedCurrencies.includes('BS');
      const amountPaid = isBs ? Number(equivalentBs) : topupAmountUsd;

      const newTopup: WalletTopup = {
        id: generateTopupId(),
        customerId: user.id,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '',
        amount: topupAmountUsd,
        amountZeny: topupAmountUsd,
        amountZenyPoints: topupAmountUsd,
        amountPaid,
        currency: isBs ? 'BS' : 'USD',
        paymentMethodId: selectedMethod.id,
        paymentMethodName: selectedMethod.name,
        referenceNumber: topupRefNumber.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      if (topupReceiptImage) {
        newTopup.receiptImage = topupReceiptImage;
      }

      await onRequestTopup(newTopup);
      setTopupSuccess(newTopup);
    } catch (err) {
      console.error('Error submitting topup:', err);
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Hola, {user.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  Cliente Registrado
                </span>
              </div>
              <p className="text-xs text-slate-500">{user.email} • {user.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zeny Wallet Highlight Card */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Billetera Privada StreamSync</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-500/40 text-[10px] text-indigo-100 font-mono">
                  1 Zeny = 1 USD
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  {formatGrpay(user.grpayBalance)}
                </span>
                <span className="text-xs sm:text-sm text-indigo-200 font-medium">
                  ≈ Bs. {((user.grpayBalance || 0) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-1 max-w-md">
                🔒 Saldo exclusivo para compras y renovaciones automáticas en la plataforma. No es canjeable ni transferible.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTopupSuccess(null);
                  setIsTopupModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-900/40 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Recargar Saldo Zeny</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Mis Suscripciones & Vencimientos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800">
              {activeSubscriptions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'wallet'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-indigo-600" />
            <span>Mi Wallet & Recargas</span>
            {myTopups.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {myTopups.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('installments')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'installments'
                ? 'border-amber-500 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Mis Cuotas & Financiamientos</span>
            {myInstallments.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                {myInstallments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Historial de Pagos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {myOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3.5 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Mis Facturas</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800">
              {myInvoices.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Mis Suscripciones Activas & Fechas de Vencimiento */}
        {activeTab === 'subscriptions' && (
          <div className="p-6 overflow-y-auto space-y-4">
            {activeSubscriptions.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Aún no tienes suscripciones activas</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Adquiere cualquier servicio de streaming desde nuestro catálogo y podrás ver aquí tus contraseñas y fecha de vencimiento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual Expiration Calendar & Agenda Header */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-900 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">
                          Calendario de Vencimientos & Renovaciones
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Fechas programadas de corte y avisos de garantía para tus servicios contratados.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 self-start sm:self-auto">
                      {activeSubscriptions.length} servicios activos
                    </span>
                  </div>

                  {/* Horizontal mini timeline cards */}
                  <div className="flex items-center gap-3 overflow-x-auto pt-3 pb-1 scrollbar-none">
                    {activeSubscriptions.map((sub) => {
                      const daysInfo = getDaysRemaining(sub.credentials?.expirationDate);
                      const isNear = daysInfo.days <= 3 && daysInfo.days >= 0;
                      const isExpired = daysInfo.days < 0;

                      return (
                        <div
                          key={sub.id}
                          className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 min-w-[200px] shrink-0 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 truncate">{sub.productName}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                isExpired
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : isNear
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-indigo-500/20 text-indigo-300'
                              }`}
                            >
                              {daysInfo.days >= 0 ? `${daysInfo.days}d` : 'Vencida'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Corte:{' '}
                            <strong className="text-slate-300 font-mono">
                              {safeFormatDate(sub.credentials?.expirationDate, undefined, 'Activa')}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSubscriptions.map((sub) => {
                  const daysInfo = getDaysRemaining(sub.credentials?.expirationDate);
                  const expDateFormatted = safeFormatDate(
                    sub.credentials?.expirationDate,
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    },
                    '1 mes desde activación'
                  );

                  return (
                    <div
                      key={sub.id}
                      className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        {/* Status & Expiry Header */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-bold text-slate-900">
                            {sub.productName}
                          </span>

                          {daysInfo.isExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              Vencida
                            </span>
                          ) : daysInfo.isNearExpiry ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 animate-pulse">
                              Vence en {daysInfo.days} días
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Activa ({daysInfo.days} días)
                            </span>
                          )}
                        </div>

                        {/* Expiration Card strip */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 mb-4 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>Vencimiento:</span>
                            <strong className="text-slate-900">{expDateFormatted}</strong>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {sub.duration}
                          </span>
                        </div>

                        {/* Account Access Details */}
                        {sub.credentials && (
                          <div className="space-y-2 mb-4 text-xs">
                            {sub.credentials.accountUser && (
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Usuario / Correo</div>
                                  <div className="font-mono font-bold text-slate-900 truncate max-w-[200px]">
                                    {sub.credentials.accountUser}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(sub.credentials?.accountUser || '', `${sub.id}-u`)}
                                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                >
                                  {copiedField === `${sub.id}-u` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}

                            {sub.credentials.accountPass && (
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Contraseña</div>
                                  <div className="font-mono font-bold text-slate-900">
                                    {sub.credentials.accountPass}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(sub.credentials?.accountPass || '', `${sub.id}-p`)}
                                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                >
                                  {copiedField === `${sub.id}-p` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}

                            {sub.credentials.profileName && (
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Perfil Asignado</div>
                                  <div className="font-bold text-slate-900">{sub.credentials.profileName}</div>
                                </div>
                                {sub.credentials.pin && (
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-semibold uppercase">PIN</div>
                                    <div className="font-mono font-bold text-indigo-600">{sub.credentials.pin}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions: Renovar & Reportar Falla */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRenewSubscription(sub)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Renovar Servicio</span>
                        </button>
                        {onOpenIncidentReport && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenIncidentReport();
                            }}
                            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200"
                            title="Reportar problema con este servicio"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reportar Falla</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>
        )}

        {/* Tab 2: Billetera Zeny & Recargas */}
        {activeTab === 'wallet' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Wallet Rules Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Política de Uso de la Wallet Zeny:</span>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  El saldo Zeny es recargado mediante comprobante verificado por el administrador (1 Zeny = $1.00 USD / Tasa BCV en Bolívares).
                  <strong> Este saldo es de uso estricto y exclusivo para compras y renovaciones dentro de la página; no es canjeable ni transferible fuera de la plataforma.</strong>
                </p>
              </div>
            </div>

            {/* Topups History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Historial de Recargas Solicitadas
                </h4>
                <button
                  type="button"
                  onClick={() => setIsTopupModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs transition cursor-pointer"
                >
                  + Nueva Recarga
                </button>
              </div>

              {myTopups.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    Aún no has solicitado recargas de saldo Zeny.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Recarga ID</th>
                        <th className="py-2.5 px-4">Monto Zeny</th>
                        <th className="py-2.5 px-4">Transferido</th>
                        <th className="py-2.5 px-4">Método</th>
                        <th className="py-2.5 px-4">Referencia</th>
                        <th className="py-2.5 px-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myTopups.map((topup) => (
                        <tr key={topup.id}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">#{topup.id}</td>
                          <td className="py-3 px-4 font-bold text-indigo-700">+{formatGrpay(topup.amountZeny)}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatCurrency(topup.amountPaid, topup.currency)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{topup.paymentMethodName}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{topup.referenceNumber}</td>
                          <td className="py-3 px-4">
                            {topup.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                En Verificación
                              </span>
                            )}
                            {topup.status === 'approved' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                                Acreditado ✓
                              </span>
                            )}
                            {topup.status === 'rejected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                                Rechazado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Mis Cuotas & Financiamientos */}
        {activeTab === 'installments' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Mis Compras Fraccionadas / Pago en Cuotas</span>
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Consulta el avance de tu financiamiento, cuotas pendientes y reporta tu abono en línea.
                </p>
              </div>
            </div>

            {myInstallments.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700">No tienes compras activas en modalidad de cuotas</p>
                <p className="text-[11px] text-slate-400">
                  Al adquirir un servicio con financiamiento habilitado, podrás consultar y abonar tus cuotas desde este panel.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myInstallments.map((ord) => {
                  const plan = ord.installmentPlan;
                  const paidCount = plan?.paidCount ?? 1;
                  const totalCount = plan?.numberOfInstallments ?? 2;
                  const isCompleted = plan?.status === 'completed' || paidCount >= totalCount;
                  const nextDueDate = plan?.nextDueDate || ord.createdAt.split('T')[0];

                  const pendingUsd = plan
                    ? plan.totalAmountUsd - plan.downPaymentUsd * (paidCount > 0 ? 1 : 0) - (paidCount - 1) * plan.installmentAmountUsd
                    : ord.total * 0.5;

                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-600">#{ord.id}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {isCompleted ? 'Totalmente Pagado ✓' : 'Financiamiento Activo'}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-base mt-1">{ord.productName}</h4>
                          <p className="text-xs text-slate-500">{ord.duration} • {ord.accountType}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Progreso de Cuotas</span>
                          <span className="text-lg font-black text-slate-900">
                            {paidCount} / {totalCount} cuotas
                          </span>
                          <span className="text-xs text-indigo-700 font-bold block font-mono">
                            Pendiente: ${pendingUsd.toFixed(2)} USD (Bs. ${(pendingUsd * bcvRate).toFixed(2)})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="text-slate-600">
                          Próximo vencimiento: <strong className="text-slate-900 font-mono">{nextDueDate}</strong>
                        </div>

                        {!isCompleted && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsTopupModalOpen(true);
                                setTopupAmountUsd(Number(pendingUsd.toFixed(2)));
                              }}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Abonar / Pagar Cuota</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Historial de Pagos & Conciliaciones */}
        {activeTab === 'orders' && (
          <div className="p-6 overflow-y-auto space-y-4">
            {myOrders.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No has registrado pedidos de compra todavía.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Pedido / Fecha</th>
                      <th className="py-2.5 px-4">Servicio</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4">Método & Ref</th>
                      <th className="py-2.5 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-900">#{ord.id}</div>
                          <div className="text-[10px] text-slate-400">
                            {safeFormatDate(ord.createdAt, undefined, '-')}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ord.productName}</div>
                          <div className="text-[10px] text-indigo-600">{ord.duration}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {ord.paidWithGrpay ? (
                            <span className="text-indigo-700">Saldo Zeny</span>
                          ) : (
                            formatCurrency(ord.total, ord.currency)
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-800">{ord.paymentMethodName}</div>
                          <div className="font-mono text-[10px] text-slate-400">Ref: {ord.referenceNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          {ord.status === 'pending_reconciliation' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                              En Conciliación
                            </span>
                          )}
                          {ord.status === 'confirmed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-900">
                              Aprobado
                            </span>
                          )}
                          {ord.status === 'delivered' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                              Entregado ✓
                            </span>
                          )}
                          {ord.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900">
                              Rechazado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Mis Facturas Oficiales & Comprobantes */}
        {activeTab === 'invoices' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-950">
                <p className="font-bold">Facturación Digital Segura y Certificada</p>
                <p className="text-indigo-800/80 mt-0.5">
                  Tus facturas son emitidas con número de control correlativo y tasa oficial BCV. Puedes visualizarlas en cualquier momento en modo seguro de solo lectura.
                </p>
              </div>
            </div>

            {myInvoices.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No tienes facturas emitidas todavía</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Cuando tus pedidos de compras o renovaciones sean aprobados, tus facturas digitales aparecerán automáticamente aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-mono font-bold text-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {inv.paymentStatus === 'paid' ? 'Pagada ✓' : 'Emitida'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {inv.items.map((i: any) => i.description).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                          <span>Nº Control: {inv.controlNumber}</span>
                          <span>•</span>
                          <span>Fecha: {safeFormatDate(inv.issueDate, undefined, '-')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-1 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 font-mono">
                          ${inv.totalUsd.toFixed(2)} USD
                        </span>
                        <div className="text-[11px] text-indigo-700 font-semibold font-mono">
                          Bs. {inv.totalBs.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura</span>
                        </button>
                        <a
                          href={`/invoice/${inv.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          title="Abrir en pestaña nueva"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Embebido de Factura de Solo Lectura para Clientes */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header con advertencia de solo lectura */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold">Visor de Factura Digital Certificada</h3>
                    <p className="text-[10px] text-slate-400">Modo Solo Lectura • Gregori Izquierdo Streaming</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido protegido contra copia y descarga para clientes */}
              <div
                className="p-6 sm:p-8 overflow-y-auto space-y-6 select-none relative"
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {/* Watermark sutil de seguridad */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-4 rotate-[-30deg]">
                  <span className="text-6xl font-black text-slate-950 font-mono tracking-widest">
                    SOLO LECTURA
                  </span>
                </div>

                {/* Encabezado Fiscal */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">GREGORI IZQUIERDO STREAMING</h2>
                    <p className="text-xs text-slate-500 font-mono">RIF: J-50639379-4</p>
                    <p className="text-xs text-slate-500">Servicios Digitales & Plataformas Streaming 24/7</p>
                    <p className="text-xs text-slate-500">WhatsApp Oficial: +58 424-1983648</p>
                  </div>

                  <div className="sm:text-right bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
                    <div className="text-xs text-slate-500">FACTURA DIGITAL</div>
                    <div className="text-base font-black text-indigo-700 font-mono">
                      {selectedInvoice.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Nº Control: {selectedInvoice.controlNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Fecha: {safeFormatDate(selectedInvoice.issueDate, undefined, '-')}
                    </div>
                  </div>
                </div>

                {/* Datos del Cliente */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Facturado a:</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customerName}</p>
                    <p className="text-slate-600 font-mono">{selectedInvoice.customerDocId}</p>
                    <p className="text-slate-600">{selectedInvoice.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Condiciones:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">Método: {selectedInvoice.paymentMethod}</p>
                    <p className="text-slate-600 font-mono">Tasa Oficial BCV: {selectedInvoice.bcvRate} Bs/USD</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Estado: Pagado y Verificado
                    </span>
                  </div>
                </div>

                {/* Tabla de ítems */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4">Descripción del Servicio</th>
                        <th className="py-2.5 px-4 text-center">Cant.</th>
                        <th className="py-2.5 px-4 text-right">Precio USD</th>
                        <th className="py-2.5 px-4 text-right">Total USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((it) => (
                        <tr key={it.id}>
                          <td className="py-3 px-4 font-semibold text-slate-800">{it.description}</td>
                          <td className="py-3 px-4 text-center font-mono">{it.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono">${it.unitPriceUsd.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">${it.totalUsd.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="flex justify-end pt-2">
                  <div className="w-full sm:w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">${selectedInvoice.subtotalUsd.toFixed(2)} USD</span>
                    </div>
                    {selectedInvoice.taxAmountUsd > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>IVA ({selectedInvoice.taxPercent}%):</span>
                        <span className="font-mono">${selectedInvoice.taxAmountUsd.toFixed(2)} USD</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>TOTAL USD:</span>
                      <span className="font-mono text-indigo-600">${selectedInvoice.totalUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                      <span>TOTAL EN BOLÍVARES:</span>
                      <span className="font-mono text-indigo-900">Bs. {selectedInvoice.totalBs.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Sello de Seguridad */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-[10px] text-slate-500">
                  ✓ Documento emitido digitalmente bajo la normativa mercantil correspondiente. Protegido contra manipulación.
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Copia digital para fines de registro personal.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-modal: Top up Zeny Wallet */}
        {isTopupModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Recargar Saldo en Wallet Zeny
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      1 Zeny = 1.00 USD • Tasa BCV Oficial: {bcvRate} Bs/USD
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTopupModalOpen(false)}
                  className="p-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {topupSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">
                    ¡Solicitud de Recarga Enviada!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    El administrador verificará tu transferencia y acreditará{' '}
                    <strong>{formatGrpay(topupSuccess.amountZeny)}</strong> en tu cuenta.
                  </p>

                  <a
                    href={buildWhatsAppTopupUrl(topupSuccess)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Avisar de mi recarga por WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTopupModalOpen(false);
                      setTopupSuccess(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer hover:bg-slate-200"
                  >
                    Volver a mi Billetera
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTopup} className="space-y-4">
                  {/* Amount in Zeny / USD */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Monto a Recargar en Zeny (USD):
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {[1, 3, 5, 10, 15, 20, 25, 30, 40, 50].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTopupAmountUsd(amt)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                            topupAmountUsd === amt
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          {amt} Zeny
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={topupAmountUsd}
                        onChange={(e) => setTopupAmountUsd(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                        Zeny ($ USD)
                      </span>
                    </div>

                    {selectedMethod.acceptedCurrencies.includes('BS') && (
                      <div className="mt-1 text-xs text-indigo-700 font-semibold">
                        Equivalente a pagar: <strong>Bs. {equivalentBs}</strong> (Tasa BCV {bcvRate})
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Método de Pago:
                    </label>
                    <select
                      value={selectedMethodId}
                      onChange={(e) => setSelectedMethodId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      {paymentMethods
                        .filter((m) => m.active)
                        .map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name} ({method.acceptedCurrencies.join(', ')})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Account instructions */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] uppercase">Datos para transferir:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMethod.accountNumber);
                          setCopiedAccount(true);
                          setTimeout(() => setCopiedAccount(false), 2000);
                        }}
                        className="text-[11px] text-indigo-700 font-semibold hover:underline cursor-pointer"
                      >
                        {copiedAccount ? '¡Copiado!' : 'Copiar Cuenta'}
                      </button>
                    </div>
                    <div className="font-mono font-bold text-slate-900 bg-white p-2 rounded-lg border border-amber-200">
                      {selectedMethod.accountNumber}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Titular: <strong>{selectedMethod.holderName}</strong>
                    </div>
                    <p className="text-[10px] text-slate-500">{selectedMethod.instructions}</p>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Número de Referencia / Comprobante Bancario *
                    </label>
                    <input
                      type="text"
                      required
                      value={topupRefNumber}
                      onChange={(e) => setTopupRefNumber(e.target.value)}
                      placeholder="Ej. REF-094812 / Binance Order ID"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTopup}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    {isSubmittingTopup ? 'Registrando...' : 'Registrar Comprobante de Recarga'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
