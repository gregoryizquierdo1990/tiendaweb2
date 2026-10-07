import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  DollarSign,
  User,
  ShieldCheck,
  Building2,
  FileText,
  MessageSquare,
  Check,
  RefreshCw,
  Wallet,
  Copy,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { Order, CustomerUser, PaymentMethod } from '../types';

interface AdminRefundManagerProps {
  orders: Order[];
  customers: CustomerUser[];
  paymentMethods: PaymentMethod[];
  bcvRate: number;
  onUpdateOrder: (updatedOrder: Order) => void;
  onUpdateCustomerBalance?: (customerId: string, amountChangeUsd: number) => void;
  onLogAudit?: (event: {
    actor: string;
    action: string;
    description: string;
    severity: 'info' | 'success' | 'warning' | 'error';
    metadata?: Record<string, any>;
  }) => void;
}

export const AdminRefundManager: React.FC<AdminRefundManagerProps> = ({
  orders,
  customers,
  paymentMethods,
  bcvRate,
  onUpdateOrder,
  onUpdateCustomerBalance,
  onLogAudit
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'refunded' | 'eligible'>('all');

  // Refund Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmountUsd, setRefundAmountUsd] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<'grpay_wallet' | 'bank_transfer' | 'cash'>('grpay_wallet');
  const [refundReason, setRefundReason] = useState<string>('Insatisfacción con el servicio / Calidad de pantalla');
  const [customReason, setCustomReason] = useState<string>('');
  const [releaseAccount, setReleaseAccount] = useState<boolean>(true);
  const [adminNotes, setAdminNotes] = useState<string>('');

  // Destination Payment Details for Customer Reversal
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');
  const [beneficiaryDocId, setBeneficiaryDocId] = useState<string>('');
  const [targetBank, setTargetBank] = useState<string>('Banco de Venezuela');
  const [targetAccountOrPhone, setTargetAccountOrPhone] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState<string>('');

  // Confirmation Message Modal State
  const [messageModalOrder, setMessageModalOrder] = useState<Order | null>(null);
  const [editableMessage, setEditableMessage] = useState<string>('');
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [msgOptions, setMsgOptions] = useState({
    inclCustomerName: true,
    inclServiceName: true,
    inclAmountUsd: true,
    inclAmountBs: true,
    inclTargetMethod: true,
    inclReference: true,
    inclReason: true,
    inclGuaranteeLink: true
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [refundSuccessMessage, setRefundSuccessMessage] = useState<string | null>(null);

  // Filter orders for refund management
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery) ||
        o.productName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (statusFilter === 'refunded') return o.status === 'rejected' || Boolean(o.refundDetails) || o.rejectionReason?.toLowerCase().includes('reembolso') || o.rejectionReason?.toLowerCase().includes('devolución');
      if (statusFilter === 'eligible') return o.status === 'confirmed' || o.status === 'pending_reconciliation';

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // Open refund modal
  const handleOpenRefundModal = (order: Order) => {
    setSelectedOrder(order);
    setRefundType('full');
    setRefundAmountUsd(order.total);
    setRefundMethod('grpay_wallet');
    setRefundReason('Insatisfacción con el servicio / Calidad de pantalla');
    setCustomReason('');
    setReleaseAccount(true);
    setAdminNotes('');
    setBeneficiaryName(order.customerName);
    setBeneficiaryDocId('');
    setTargetBank('Banco de Venezuela');
    setTargetAccountOrPhone(order.customerPhone);
    setTransactionReference('');
  };

  // Submit refund
  const handleConfirmRefund = () => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    const effectiveReason = refundReason === 'Otro' ? customReason : refundReason;
    const finalAmount = refundType === 'full' ? selectedOrder.total : refundAmountUsd;
    const amountBs = Number((finalAmount * bcvRate).toFixed(2));

    // 1. If refund method is GRPAY Wallet, credit customer balance
    if (refundMethod === 'grpay_wallet' && selectedOrder.customerId && onUpdateCustomerBalance) {
      onUpdateCustomerBalance(selectedOrder.customerId, finalAmount);
    }

    // 2. Clear credentials if releasing account
    const updatedCredentials = releaseAccount ? undefined : selectedOrder.credentials;

    // 3. Assemble full refundDetails object
    const refundDetails = {
      refundDate: new Date().toISOString(),
      amountUsd: finalAmount,
      amountBs,
      reason: effectiveReason,
      refundMethod,
      beneficiaryName: beneficiaryName.trim() || selectedOrder.customerName,
      beneficiaryDocId: beneficiaryDocId.trim() || undefined,
      targetBank: refundMethod === 'grpay_wallet' ? 'Wallet GRPAY Interna' : targetBank.trim(),
      targetAccountOrPhone: refundMethod === 'grpay_wallet' ? `Saldo acreditado a ${selectedOrder.customerEmail}` : targetAccountOrPhone.trim(),
      transactionReference: transactionReference.trim() || (refundMethod === 'grpay_wallet' ? `GRPAY-REF-${selectedOrder.id}` : 'PENDIENTE'),
      accountReleased: releaseAccount,
      processedBy: 'Gregori Izquierdo (Admin)',
      notes: adminNotes.trim() || undefined
    };

    // 4. Update order status
    const updatedOrder: Order = {
      ...selectedOrder,
      status: 'rejected',
      rejectionReason: `DEVOLUCIÓN Y REVERSO: ${effectiveReason} ($${finalAmount.toFixed(2)} USD / Bs. ${amountBs.toFixed(2)} vía ${
        refundMethod === 'grpay_wallet' ? 'Wallet GRPAY' : targetBank
      } - Ref: ${refundDetails.transactionReference})`,
      refundDetails,
      credentials: updatedCredentials
    };

    onUpdateOrder(updatedOrder);

    // 5. Audit Log
    if (onLogAudit) {
      onLogAudit({
        actor: 'Gregori Izquierdo (Admin)',
        action: 'PROCESAR_REVERSO_DEVOLUCION',
        description: `Reverso de $${finalAmount.toFixed(2)} USD procesado para Pedido #${selectedOrder.id} (${selectedOrder.customerName}). Beneficiario: ${refundDetails.beneficiaryName} | Banco: ${refundDetails.targetBank} | Ref: ${refundDetails.transactionReference} | Motivo: ${effectiveReason}. Cuenta liberada: ${releaseAccount ? 'Sí' : 'No'}.`,
        severity: 'warning',
        metadata: {
          orderId: selectedOrder.id,
          customerName: selectedOrder.customerName,
          amountUsd: finalAmount,
          amountBs,
          refundDetails,
          reason: effectiveReason,
          refundMethod,
          releaseAccount
        }
      });
    }

    setIsProcessing(false);
    setRefundSuccessMessage(`¡Reverso de $${finalAmount.toFixed(2)} USD procesado exitosamente para ${selectedOrder.customerName}!`);

    // Prepare message modal
    setTimeout(() => {
      setRefundSuccessMessage(null);
      setSelectedOrder(null);
      handleOpenMessageModal(updatedOrder);
    }, 1200);
  };

  // Build the message based on order and checkboxes
  const generateMessageText = (order: Order, options = msgOptions) => {
    const rf = order.refundDetails;
    const amountUsd = rf?.amountUsd || order.total;
    const amountBs = rf?.amountBs || Number((amountUsd * bcvRate).toFixed(2));
    const bankName = rf?.targetBank || 'Transferencia Bancaria';
    const refNum = rf?.transactionReference || 'PROCESADA';
    const reasonText = rf?.reason || order.rejectionReason || 'Garantía de satisfacción';

    let lines = ['💸 *COMPROBANTE DE REVERSO Y DEVOLUCIÓN*', '*Gregori Izquierdo Streaming*', '━━━━━━━━━━━━━━━━━━━━'];

    if (options.inclCustomerName) {
      lines.push(`Hola *${order.customerName}*, confirmamos que se ha procesado la devolución de tu pago.`);
    } else {
      lines.push('Confirmamos que se ha procesado exitosamente tu devolución.');
    }

    lines.push('');

    if (options.inclServiceName) {
      lines.push(`📺 *Servicio:* ${order.productName} (${order.duration})`);
      lines.push(`🔢 *Pedido ID:* #${order.id}`);
    }

    if (options.inclAmountUsd) {
      lines.push(`💵 *Monto Reintegrado:* $${amountUsd.toFixed(2)} USD`);
    }

    if (options.inclAmountBs) {
      lines.push(`🇻🇪 *Equivalente en Bolívares:* Bs. ${amountBs.toFixed(2)} (Tasa BCV: ${bcvRate} Bs/USD)`);
    }

    if (options.inclTargetMethod) {
      lines.push(`🏦 *Destino / Método:* ${bankName}`);
      if (rf?.targetAccountOrPhone) {
        lines.push(`📱 *Cuenta / Teléfono:* ${rf.targetAccountOrPhone}`);
      }
    }

    if (options.inclReference) {
      lines.push(`🧾 *Referencia de Pago:* ${refNum}`);
    }

    if (options.inclReason) {
      lines.push(`📋 *Motivo de la Devolución:* ${reasonText}`);
    }

    lines.push('');
    if (options.inclGuaranteeLink) {
      lines.push('Agradecemos tu preferencia y seguimos a tu entera disposición.');
      lines.push('🌐 *Portal Oficial:* https://gregoryizquierdo.xyz');
    }

    return lines.join('\n');
  };

  // Open confirmation message modal
  const handleOpenMessageModal = (order: Order) => {
    setMessageModalOrder(order);
    const msg = generateMessageText(order, msgOptions);
    setEditableMessage(msg);
  };

  // Regenerate message when checkboxes change
  const handleToggleMsgOption = (key: keyof typeof msgOptions) => {
    const updated = { ...msgOptions, [key]: !msgOptions[key] };
    setMsgOptions(updated);
    if (messageModalOrder) {
      setEditableMessage(generateMessageText(messageModalOrder, updated));
    }
  };

  // Send via WhatsApp
  const handleSendWhatsApp = () => {
    if (!messageModalOrder) return;
    const cleanPhone = messageModalOrder.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(editableMessage)}`;
    window.open(url, '_blank');
  };

  // Send via Telegram
  const handleSendTelegram = () => {
    if (!messageModalOrder) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(editableMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(editableMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white shadow-xl border border-rose-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-2 border border-rose-500/30">
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Módulo de Reversos, Garantías & Devoluciones</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Gestión Integral de Reversos & Devoluciones
            </h2>
            <p className="text-rose-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Registra los datos bancarios de reintegro al cliente, reintegra saldo en Wallet GRPAY o transferencia, libera perfiles al inventario y genera comprobantes editables para WhatsApp y Telegram con registro en Bitácora.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-rose-500/30 text-center">
              <span className="text-[10px] uppercase text-rose-300 font-bold tracking-wider block">Devoluciones Realizadas</span>
              <span className="text-xl font-extrabold text-rose-400">
                {orders.filter((o) => o.status === 'rejected' || Boolean(o.refundDetails) || o.rejectionReason?.toLowerCase().includes('devolución')).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por ID, cliente, teléfono o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('eligible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'eligible' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Elegibles para Devolución
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('refunded')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'refunded' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ya Reembolsados
          </button>
        </div>
      </div>

      {/* Orders List for Refund */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <RotateCcw className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">No hay pedidos que coincidan con el filtro</h4>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isRefunded = ord.status === 'rejected' || Boolean(ord.refundDetails) || ord.rejectionReason?.toLowerCase().includes('devolución');

            return (
              <div
                key={ord.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isRefunded
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-600">#{ord.id}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isRefunded
                            ? 'bg-rose-200 text-rose-900 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isRefunded ? 'Reembolsado / Reversado' : 'Pedido Activo / Confirmado'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base">{ord.customerName}</h4>
                    <p className="text-xs text-slate-600">
                      Teléfono: <span className="font-semibold text-slate-800">{ord.customerPhone}</span> • Servicio:{' '}
                      <span className="font-bold text-indigo-700">{ord.productName}</span> ({ord.duration})
                    </p>

                    {ord.refundDetails && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-[11px] text-rose-950 space-y-0.5">
                        <p className="font-bold">
                          🏦 Destino Reembolso: {ord.refundDetails.targetBank} {ord.refundDetails.targetAccountOrPhone ? `(${ord.refundDetails.targetAccountOrPhone})` : ''}
                        </p>
                        <p>
                          🧾 Titular: <strong>{ord.refundDetails.beneficiaryName}</strong> {ord.refundDetails.beneficiaryDocId ? `• C.I.: ${ord.refundDetails.beneficiaryDocId}` : ''} • Ref: <span className="font-mono font-bold">{ord.refundDetails.transactionReference}</span>
                        </p>
                        <p className="text-rose-800 italic">
                          📋 Motivo: {ord.refundDetails.reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Monto</span>
                      <span className="text-xl font-black text-slate-900">
                        ${(ord.refundDetails?.amountUsd || ord.total).toFixed(2)} USD
                      </span>
                      <span className="text-xs text-slate-500 block font-mono">
                        Bs. {((ord.refundDetails?.amountUsd || ord.total) * bcvRate).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {!isRefunded ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRefundModal(ord)}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Procesar Reverso</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenMessageModal(ord)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Comprobante WhatsApp / Telegram</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. REFUND MODAL DIALOG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Módulo de Reversos & Devoluciones</span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Devolución para {selectedOrder.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              {/* Refund Type */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Tipo de Devolución</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundType('full');
                      setRefundAmountUsd(selectedOrder.total);
                    }}
                    className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                      refundType === 'full' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Devolución Total (${selectedOrder.total.toFixed(2)})
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundType('partial')}
                    className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer ${
                      refundType === 'partial' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Devolución Parcial
                  </button>
                </div>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Monto Parcial a Reembolsar ($ USD)</label>
                  <input
                    type="number"
                    step="0.5"
                    max={selectedOrder.total}
                    value={refundAmountUsd}
                    onChange={(e) => setRefundAmountUsd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    Equivalente en Bs: Bs. {(refundAmountUsd * bcvRate).toFixed(2)} (Tasa BCV {bcvRate})
                  </span>
                </div>
              )}

              {/* Refund Method */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Método de Devolución</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-slate-50"
                >
                  <option value="grpay_wallet">Acreditación Inmediata en Saldo Wallet GRPAY</option>
                  <option value="bank_transfer">Transferencia Bancaria / Pago Móvil / Zelle / Binance</option>
                  <option value="cash">Efectivo en Tienda / Oficina</option>
                </select>
              </div>

              {/* Destination Payment Details (Required for Audit Log and Traceability) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Datos del Destino donde el Cliente Recibirá el Reembolso:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre del Titular Receptor:</label>
                    <input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cédula / RIF / DNI:</label>
                    <input
                      type="text"
                      value={beneficiaryDocId}
                      onChange={(e) => setBeneficiaryDocId(e.target.value)}
                      placeholder="Ej. V-18.456.789"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Banco o Plataforma:</label>
                    <input
                      type="text"
                      value={targetBank}
                      onChange={(e) => setTargetBank(e.target.value)}
                      placeholder="Ej. Banco de Venezuela / Pago Móvil / Zelle"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Cuenta / Teléfono Pago Móvil / Email:</label>
                    <input
                      type="text"
                      value={targetAccountOrPhone}
                      onChange={(e) => setTargetAccountOrPhone(e.target.value)}
                      placeholder="Ej. 0412-1234567 / 0102-0000..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Número de Referencia de Pago Reintegrado:</label>
                    <input
                      type="text"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      placeholder="Ej. 8492019482 / Ref de transferencia bancaria"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Motivo de la Devolución</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-slate-50"
                >
                  <option value="Insatisfacción con el servicio / Calidad de pantalla">Insatisfacción con el servicio / Calidad de pantalla</option>
                  <option value="Sin disponibilidad de stock o caída prolongada">Sin disponibilidad de stock o caída prolongada</option>
                  <option value="Error en duplicado de pago del cliente">Error en duplicado de pago del cliente</option>
                  <option value="Acuerdo comercial / Garantía especial">Acuerdo comercial / Garantía especial</option>
                  <option value="Otro">Otro Motivo Personalizado</option>
                </select>

                {refundReason === 'Otro' && (
                  <input
                    type="text"
                    placeholder="Escribe el motivo detallado..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-300"
                  />
                )}
              </div>

              {/* Release Account Checkbox */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <label className="font-bold text-amber-950 block">Liberar Cuenta / Perfil del Servicio</label>
                  <p className="text-[11px] text-amber-800">
                    Retorna las credenciales al inventario y desvincula la pantalla del cliente
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={releaseAccount}
                  onChange={(e) => setReleaseAccount(e.target.checked)}
                  className="w-5 h-5 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmRefund}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirmar & Registrar Devolución de ${refundAmountUsd.toFixed(2)} USD</span>
                </button>
              </div>

              {refundSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-center text-xs animate-fadeIn">
                  {refundSuccessMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CONFIRMATION MESSAGE EDITOR & SENDER MODAL (WhatsApp & Telegram) */}
      {messageModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Notificación al Cliente (WhatsApp & Telegram)
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Comprobante de Devolución para {messageModalOrder.customerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMessageModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Checkbox fields to include in the message */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 block">
                Seleccionar información que se incluirá en el mensaje:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclCustomerName}
                    onChange={() => handleToggleMsgOption('inclCustomerName')}
                    className="rounded text-indigo-600"
                  />
                  <span>Nombre Cliente</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclServiceName}
                    onChange={() => handleToggleMsgOption('inclServiceName')}
                    className="rounded text-indigo-600"
                  />
                  <span>Servicio / ID</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclAmountUsd}
                    onChange={() => handleToggleMsgOption('inclAmountUsd')}
                    className="rounded text-indigo-600"
                  />
                  <span>Monto USD</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclAmountBs}
                    onChange={() => handleToggleMsgOption('inclAmountBs')}
                    className="rounded text-indigo-600"
                  />
                  <span>Monto en Bs</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclTargetMethod}
                    onChange={() => handleToggleMsgOption('inclTargetMethod')}
                    className="rounded text-indigo-600"
                  />
                  <span>Banco / Destino</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclReference}
                    onChange={() => handleToggleMsgOption('inclReference')}
                    className="rounded text-indigo-600"
                  />
                  <span>Referencia</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclReason}
                    onChange={() => handleToggleMsgOption('inclReason')}
                    className="rounded text-indigo-600"
                  />
                  <span>Motivo</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msgOptions.inclGuaranteeLink}
                    onChange={() => handleToggleMsgOption('inclGuaranteeLink')}
                    className="rounded text-indigo-600"
                  />
                  <span>Garantía & Web</span>
                </label>
              </div>
            </div>

            {/* Editable Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mensaje Editable antes de Enviar:</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMessage ? 'Copiado' : 'Copiar Texto'}</span>
                </button>
              </div>
              <textarea
                rows={9}
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
                className="w-full p-3.5 rounded-2xl border border-slate-300 font-mono text-xs bg-slate-50 text-slate-900 leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Direct Send Buttons (WhatsApp & Telegram) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por WhatsApp ({messageModalOrder.customerPhone})</span>
              </button>

              <button
                type="button"
                onClick={handleSendTelegram}
                className="py-3 px-4 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Enviar por Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
