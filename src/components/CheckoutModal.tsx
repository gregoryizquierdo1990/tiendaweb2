import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  CreditCard,
  MessageCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Product,
  PlanDuration,
  CurrencyCode,
  PaymentMethod,
  Order,
  CustomerUser
} from '../types';
import {
  formatCurrency,
  formatGrpay,
  generateOrderId,
  buildWhatsAppPaymentUrl,
  calculateExpirationDate,
  calculateDiscountedPrice
} from '../utils/formatters';
import { compressImageFile } from '../utils/imageCompressor';
import { PaymentMethodFieldsDisplay } from './PaymentMethodFieldsDisplay';

interface CheckoutModalProps {
  product: Product;
  duration: PlanDuration;
  currency: CurrencyCode;
  bcvRate: number;
  paymentMethods: PaymentMethod[];
  customerUser: CustomerUser | null;
  onOpenCustomerAuth: () => void;
  onClose: () => void;
  onSubmitOrder: (order: Order, usedGrpay?: boolean) => Promise<void>;
  onTrackOrder: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  product,
  duration,
  currency,
  bcvRate,
  paymentMethods,
  customerUser,
  onOpenCustomerAuth,
  onClose,
  onSubmitOrder,
  onTrackOrder
}) => {
  const activeMethods = paymentMethods.filter((m) => m.active);

  // Form states
  const [customerName, setCustomerName] = useState(customerUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(customerUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(customerUser?.phone || '');
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods.length > 0 ? activeMethods[0].id : ''
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [payWithGrpay, setPayWithGrpay] = useState(false);
  const [paymentCondition, setPaymentCondition] = useState<'contado' | 'cuotas'>('contado');
  const [isVerifiedRobot, setIsVerifiedRobot] = useState(false);

  // UI state
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const basePriceUsd = product.prices[duration]?.USD || 3.0;
  const { finalPrice: priceUsd, discountPercent, savings } = calculateDiscountedPrice(
    basePriceUsd,
    product.discountPercent,
    customerUser?.discountPercent,
    customerUser?.role
  );
  const priceBs = Number((priceUsd * bcvRate).toFixed(2));
  const finalPrice = currency === 'BS' ? priceBs : priceUsd;

  // Installment calculations
  const downPaymentPercent = product.downPaymentPercent || 50;
  const downPaymentUsd = priceUsd * (downPaymentPercent / 100);
  const downPaymentBs = Number((downPaymentUsd * bcvRate).toFixed(2));
  const totalInstallments = product.numberOfInstallments || 2;
  const remainingUsd = priceUsd - downPaymentUsd;
  const installmentAmountUsd = remainingUsd / (totalInstallments - 1 > 0 ? totalInstallments - 1 : 1);
  const installmentAmountBs = Number((installmentAmountUsd * bcvRate).toFixed(2));
  const intervalDays = product.installmentIntervalDays || 15;

  const effectivePrice = product.allowInstallments && paymentCondition === 'cuotas'
    ? (currency === 'BS' ? downPaymentBs : downPaymentUsd)
    : finalPrice;

  const customerBalance = customerUser ? (customerUser.grpayBalance || customerUser.zenyBalance || 0) : 0;
  const canUseWallet = customerBalance > 0;
  
  const walletAmountApplied = payWithGrpay ? Math.min(customerBalance, priceUsd) : 0;
  const remainingUsdAfterWallet = priceUsd - walletAmountApplied;
  const remainingBsAfterWallet = Number((remainingUsdAfterWallet * bcvRate).toFixed(2));
  
  const finalRemainingToPay = currency === 'BS' ? remainingBsAfterWallet : remainingUsdAfterWallet;
  const requiresManualPayment = remainingUsdAfterWallet > 0;

  const hasEnoughGrpay = Boolean(
    customerUser && customerBalance >= priceUsd
  );

  const selectedMethod =
    activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  const handleCopyAccount = () => {
    if (selectedMethod) {
      navigator.clipboard.writeText((selectedMethod.accountNumber || '').replace(/\s+/g, ''));
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        setReceiptPreview(compressed);
      } catch (err) {
        console.warn('Error al procesar comprobante:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const isDomainService =
      product.name.toLowerCase().includes('dominio') ||
      Boolean(product.description?.toLowerCase().includes('dominio')) ||
      Boolean(product.features && product.features.some(f => f.toLowerCase().includes('dominio') || f.toLowerCase().includes('a tu correo')));

    if (isDomainService) {
      if (!customerEmail.trim() || !customerEmail.includes('@')) {
        setErrorMessage('Esta suscripción tiene como particularidad la activación a tu correo o dominio. Por favor ingresa el correo exacto al cual se asociará la membresía.');
        return;
      }
    } else if (customerEmail.trim() && !customerEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido o déjalo en blanco si no posees');
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 7) {
      setErrorMessage('Por favor ingresa tu número de WhatsApp para contacto inmediato');
      return;
    }

    if (requiresManualPayment && !referenceNumber.trim()) {
      setErrorMessage('Por favor ingresa el número de comprobante o referencia de tu pago manual (restante)');
      return;
    }

    if (requiresManualPayment && !isVerifiedRobot) {
      setErrorMessage('Por favor verifica que no eres un robot marcando la casilla reCAPTCHA.');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderId = generateOrderId();
      const startDate = new Date().toISOString();
      const expirationDate = calculateExpirationDate(startDate, duration);
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const finalCustomerEmail = customerEmail.trim()
        ? customerEmail.trim()
        : `${cleanPhone || 'cliente' + Math.floor(1000 + Math.random() * 9000)}@cliente.gregoryizquierdo.xyz`;

      const nextDueDateObj = new Date();
      nextDueDateObj.setDate(nextDueDateObj.getDate() + intervalDays);

      const newOrder: Order = {
        id: orderId,
        createdAt: startDate,
        customerId: customerUser?.id,
        customerName: customerName.trim(),
        customerEmail: finalCustomerEmail,
        customerPhone: customerPhone.trim(),
        productId: product.id,
        productName: product.name,
        duration,
        accountType: product.accountType,
        total: effectivePrice, // This is the total price of the product/installment
        currency,
        paymentCondition: product.allowInstallments ? paymentCondition : 'contado',
        paymentMethodId: payWithGrpay ? (requiresManualPayment ? `split-wallet-${selectedMethod.id}` : 'wallet-grpay') : selectedMethod.id,
        paymentMethodName: payWithGrpay ? (requiresManualPayment ? `Zeny ($${walletAmountApplied}) + ${selectedMethod.name}` : 'Saldo Zeny Wallet') : selectedMethod.name,
        referenceNumber: !requiresManualPayment ? `Zeny-AUTO-${orderId}` : referenceNumber.trim(),
        status: !requiresManualPayment ? 'confirmed' : 'pending_reconciliation',
        paidWithGrpay: payWithGrpay,
        walletAmountApplied: walletAmountApplied,
        manualAmountPaid: finalRemainingToPay,
        syncedToSheets: false
      };

      if (payWithGrpay) {
        newOrder.credentials = {
          accountUser: customerEmail.trim(),
          accountPass: 'Peliculas2026*',
          profileName: `Perfil 1 (${customerName.split(' ')[0]})`,
          pin: Math.floor(1000 + Math.random() * 9000).toString(),
          startDate,
          expirationDate,
          instructions: 'Tu cuenta ha sido activada automáticamente con tu saldo Zeny.'
        };
      }

      if (receiptPreview) newOrder.receiptImage = receiptPreview;
      if (customerNotes.trim()) newOrder.customerNotes = customerNotes.trim();

      if (product.allowInstallments && paymentCondition === 'cuotas') {
        newOrder.installmentPlan = {
          totalAmountUsd: priceUsd,
          downPaymentUsd: downPaymentUsd,
          installmentAmountUsd: installmentAmountUsd,
          numberOfInstallments: totalInstallments,
          intervalDays: intervalDays,
          paidCount: 1,
          status: 'in_progress',
          nextDueDate: nextDueDateObj.toISOString().split('T')[0]
        };
      }

      await onSubmitOrder(newOrder, payWithGrpay);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Fallback
      }

      setCompletedOrder(newOrder);
    } catch (err: any) {
      console.error('Error al procesar pedido:', err);
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    const waUrl = buildWhatsAppPaymentUrl(completedOrder);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {completedOrder.paidWithGrpay ? '¡Compra Exitosa con Zeny!' : '¡Pedido Registrado con Éxito!'}
          </h2>
          <p className="text-slate-600 text-sm mt-1">
            {completedOrder.paidWithGrpay
              ? 'Tus credenciales han sido generadas y tu saldo descontado.'
              : 'Tu solicitud está en cola de conciliación manual.'}
          </p>

          <div className="mt-5 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-left">
            <div className="flex items-center justify-between text-xs text-indigo-700 font-semibold mb-1">
              <span>CÓDIGO DE PEDIDO</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  completedOrder.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {completedOrder.status === 'confirmed' ? 'Pago Confirmado' : 'Pendiente por Conciliar'}
              </span>
            </div>
            <div className="text-xl font-extrabold text-indigo-900 tracking-wider font-mono">
              #{completedOrder.id}
            </div>
            <div className="text-xs text-slate-600 mt-2 space-y-1">
              <p>• <strong>Servicio:</strong> {completedOrder.productName} ({completedOrder.duration})</p>
              <p>
                • <strong>Total:</strong>{' '}
                {completedOrder.paidWithGrpay
                  ? `${priceUsd} Zeny (Saldo Wallet)`
                  : formatCurrency(completedOrder.total, completedOrder.currency)}
              </p>
              <p>• <strong>Método:</strong> {completedOrder.paymentMethodName}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-100 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Enviar Confirmación por WhatsApp</span>
            </a>

            <a
              href={`https://wa.me/584120000000?text=${encodeURIComponent(
                `🔔 *ALERTA DE NUEVA COMPRA / PEDIDO*\n\nPedido: #${completedOrder.id}\nCliente: ${completedOrder.customerName} (${completedOrder.customerPhone})\nProducto: ${completedOrder.productName} (${completedOrder.duration})\nTotal: ${completedOrder.total} ${completedOrder.currency}\nMétodo: ${completedOrder.paymentMethodName}\nRef: ${completedOrder.referenceNumber}\n\nPor favor verificar y conciliar en el panel de administración.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <span>📲 Notificar Compra al Admin (WhatsApp)</span>
            </a>

            <button
              type="button"
              onClick={() => onTrackOrder(completedOrder.id)}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Ver Estado y Credenciales</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Pasarela de Pago Manual
              </h2>
              <p className="text-xs text-slate-500">
                Paga vía transferencia o utiliza tu saldo de la wallet Zeny
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!customerUser ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Inicio de Sesión Requerido para Comprar
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Para garantizar la seguridad de tus compras, el despacho inmediato y el registro de tu historial en la plataforma, es obligatorio estar registrado e iniciar sesión.
            </p>
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={onOpenCustomerAuth}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-100 transition cursor-pointer flex items-center gap-2"
              >
                <span>Iniciar Sesión / Registrarse Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Order Summary Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm shadow-xs"
                style={{ backgroundColor: product.color }}
              >
                {product.brand.substring(0, 2)}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{duration}</span>
                  <span>•</span>
                  <span>{product.accountType}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                {product.allowInstallments && paymentCondition === 'cuotas' ? 'Cuota Inicial Hoy' : 'Total a Pagar'}
              </div>
              <div className="text-xl font-extrabold text-indigo-600">
                {formatCurrency(effectivePrice, currency)}
              </div>
              {discountPercent > 0 && (
                <div className="text-[11px] text-rose-600 font-bold">
                  {discountPercent}% Descuento aplicado
                </div>
              )}
              {currency === 'BS' && (
                <div className="text-[11px] text-slate-400">
                  (Tasa BCV: {bcvRate} Bs/USD)
                </div>
              )}
            </div>
          </div>

          {/* Payment Condition Option (If product allows installments) */}
          {product.allowInstallments && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  Condición de Pago
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-900">
                  Venta Fraccionada Disponible
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentCondition('contado')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    paymentCondition === 'contado'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Pago de Contado ({formatCurrency(finalPrice, currency)})
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentCondition('cuotas')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                    paymentCondition === 'cuotas'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Pago en Cuotas ({downPaymentPercent}% Inicial)
                </button>
              </div>

              {paymentCondition === 'cuotas' && (
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between font-bold text-amber-950">
                    <span>Cuota Inicial a Pagar Hoy ({downPaymentPercent}%):</span>
                    <span className="font-mono text-indigo-700 font-bold">
                      {currency === 'BS' ? `Bs. ${downPaymentBs.toFixed(2)}` : `$${downPaymentUsd.toFixed(2)} USD`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Siguientes Cuotas:</span>
                    <span className="font-semibold text-slate-800">
                      {totalInstallments - 1} cuotas de {currency === 'BS' ? `Bs. ${installmentAmountBs.toFixed(2)}` : `$${installmentAmountUsd.toFixed(2)} USD`} cada {intervalDays} días
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Zeny Wallet Fast Option (If logged in) */}
          {customerUser ? (
            <div
              onClick={() => {
                if (canUseWallet) setPayWithGrpay(!payWithGrpay);
              }}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                payWithGrpay
                  ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                  : canUseWallet
                  ? 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60'
                  : 'border-slate-200 bg-slate-50 opacity-75'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Utilizar mi Saldo Zeny Wallet
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${hasEnoughGrpay ? 'bg-indigo-200 text-indigo-900' : 'bg-amber-100 text-amber-900'}`}>
                      {hasEnoughGrpay ? 'Pago Total' : 'Pago Parcial'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    Saldo:{' '}
                    <strong className="text-indigo-700 font-mono">
                      {formatGrpay(customerBalance)}
                    </strong>
                    {payWithGrpay && (
                      <span className="ml-1 text-emerald-600 font-bold">
                        (-${walletAmountApplied.toFixed(2)} USD)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={payWithGrpay}
                disabled={!canUseWallet}
                onChange={() => {}}
                className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500 shrink-0"
              />
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
              <span className="text-indigo-900">
                ¿Tienes saldo en tu <strong>Wallet Zeny</strong>? Inicia sesión para pagar al instante.
              </span>
              <button
                type="button"
                onClick={onOpenCustomerAuth}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer shrink-0 ml-2"
              >
                Ingresar
              </button>
            </div>
          )}

          {!customerUser ? (
            <div className="p-6 rounded-3xl bg-slate-900 text-white text-center space-y-4 my-4 animate-scaleIn border border-slate-800 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-white">Inicio de Sesión u Registro Obligatorio</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para continuar con la compra, subir tu comprobante de pago y enviar el pedido para conciliación, es obligatorio registrarte o iniciar sesión en la plataforma.
                </p>
              </div>
              <div className="flex gap-2.5 justify-center pt-2">
                <button
                  type="button"
                  onClick={onOpenCustomerAuth}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Iniciar Sesión / Registrarse para Comprar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Customer Contact Data (Registered profile - no inputs needed) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                    1. Datos de Contacto & Entrega (Perfil Registrado)
                  </span>
                  <strong className="text-slate-900 block font-black text-sm">
                    {customerUser.name}
                  </strong>
                  <p className="text-slate-600 font-medium">
                    📱 {customerUser.phone} {customerUser.email ? `• ✉️ ${customerUser.email}` : ''}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  ✓ Cuenta Verificada
                </span>
              </div>

              {/* If manual payment is still required (e.g. partial wallet payment or full manual), show manual payment methods */}
              {requiresManualPayment && (
                <>
                  {/* Section 2: Payment Method Choice */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      2. Selecciona Método de Pago Manual
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeMethods.map((method) => {
                        const isSelected = selectedMethod?.id === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {method.shortName}
                              </span>
                              {method.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold truncate max-w-[80px]">
                                  {method.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate">
                              {method.accountTypeLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Selected Method Account Details */}
                  {selectedMethod && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-xs font-bold text-amber-900 uppercase">
                            Datos para transferir en {selectedMethod.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-900">
                          {selectedMethod.acceptedCurrencies.includes('BS')
                            ? `Bs. ${remainingBsAfterWallet.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                            : `$${remainingUsdAfterWallet.toFixed(2)} USD`}
                        </span>
                      </div>

                      <PaymentMethodFieldsDisplay
                        method={selectedMethod}
                        compact={false}
                        showCopyButtons={true}
                        showConciliationNotice={true}
                      />
                    </div>
                  )}

                  {/* Section 4: Voucher / Reference Input */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      3. Comprobante de Pago (Para Conciliación)
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Número de Referencia / Comprobante Bancario *
                        </label>
                        <input
                          type="text"
                          required
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="Ej. REF-094812, Binance Order ID, o Número de Aprobación"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Captura del Comprobante (Opcional)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition">
                            <Upload className="w-4 h-4 text-slate-500" />
                            <span>Subir Imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          {receiptPreview && (
                            <div className="flex items-center gap-2">
                              <img
                                src={receiptPreview}
                                alt="Comprobante"
                                className="w-10 h-10 object-cover rounded-lg border border-slate-300"
                              />
                              <span className="text-xs text-emerald-600 font-semibold">
                                Cargado
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* reCAPTCHA No soy un robot verification */}
              {requiresManualPayment && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isVerifiedRobot}
                      onChange={(e) => setIsVerifiedRobot(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        🤖
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">No soy un robot (reCAPTCHA)</span>
                        <span className="text-[10px] text-slate-500">Verificación anti-bots previa a conciliación</span>
                      </div>
                    </div>
                  </label>
                  <div className="text-[10px] text-slate-400 font-mono text-right">
                    <div>reCAPTCHA</div>
                    <div className="text-[9px]">Privacy - Terms</div>
                  </div>
                </div>
              )}

              {/* Optional notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Ej. 'Deseo renovar sobre mi correo de siempre'"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Procesando...</span>
                  ) : payWithGrpay ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirmar Compra con {priceUsd} Zeny</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Pago para Conciliación</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 mt-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Garantía de reposición total durante toda la duración contratada</span>
                </div>
              </div>
            </>
          )}
        </form>
        )}
      </div>
    </div>
  );
};
