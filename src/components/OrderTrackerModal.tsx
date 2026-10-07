import React, { useState } from 'react';
import {
  X,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Key,
  ShieldCheck,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { formatCurrency, buildWhatsAppPaymentUrl } from '../utils/formatters';

interface OrderTrackerModalProps {
  orders: Order[];
  initialOrderId?: string;
  onClose: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  orders,
  initialOrderId = '',
  onClose
}) => {
  const [searchCode, setSearchCode] = useState(initialOrderId);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(
    initialOrderId
      ? orders.find((o) => o.id.toLowerCase() === initialOrderId.toLowerCase()) || null
      : null
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(initialOrderId));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toUpperCase().replace('#', '');
    const found = orders.find(
      (o) =>
        o.id.toUpperCase() === query ||
        o.customerEmail.toLowerCase() === searchCode.trim().toLowerCase() ||
        o.customerPhone.includes(searchCode.trim())
    );
    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(fieldKey);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Rastrear Estado de Pedido
              </h2>
              <p className="text-xs text-slate-500">
                Consulta el estado de conciliación de tu pago y tus datos de acceso
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

        <div className="p-6 sm:p-7 space-y-6">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Ingresa tu ID de Pedido (ej. STR-92415) o WhatsApp"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              Consultar
            </button>
          </form>

          {/* Results */}
          {hasSearched && !searchedOrder && (
            <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">
                No encontramos ningún pedido con esos datos
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Verifica haber escrito correctamente tu código (ej. <strong>STR-92415</strong>) o consúltanos por WhatsApp con tu comprobante.
              </p>
            </div>
          )}

          {searchedOrder && (
            <div className="space-y-6">
              {/* Order Overview Header Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">PEDIDO</span>
                    <span className="text-base font-extrabold text-indigo-700 font-mono">
                      #{searchedOrder.id}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {searchedOrder.productName} ({searchedOrder.duration})
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(searchedOrder.createdAt).toLocaleString('es-CO')}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {searchedOrder.status === 'pending_reconciliation' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      En Conciliación Manual
                    </span>
                  )}
                  {searchedOrder.status === 'confirmed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pago Confirmado / Preparando
                    </span>
                  )}
                  {searchedOrder.status === 'delivered' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Entregado y Activo
                    </span>
                  )}
                  {searchedOrder.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pago Rechazado
                    </span>
                  )}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3 px-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">Pedido Recibido</div>
                    <div className="text-slate-500">Comprobante y referencia #{searchedOrder.referenceNumber} registrados</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      searchedOrder.status !== 'pending_reconciliation' && searchedOrder.status !== 'rejected'
                        ? 'bg-emerald-500 text-white'
                        : searchedOrder.status === 'pending_reconciliation'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-rose-400 text-white'
                    }`}
                  >
                    {searchedOrder.status !== 'pending_reconciliation' && searchedOrder.status !== 'rejected' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      '2'
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">Conciliación con el Banco</div>
                    <div className="text-slate-500">
                      {searchedOrder.status === 'pending_reconciliation'
                        ? 'Nuestro equipo está validando el depósito en la cuenta. Tiempo habitual: 10 - 20 minutos.'
                        : searchedOrder.status === 'rejected'
                        ? `Pago rechazado: ${searchedOrder.rejectionReason || 'Comprobante no coincide con el extracto'}`
                        : `Pago verificado con éxito en ${searchedOrder.paymentMethodName}.`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      searchedOrder.status === 'delivered' || searchedOrder.status === 'confirmed'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {searchedOrder.status === 'delivered' ? <Check className="w-3.5 h-3.5" /> : '3'}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">Entrega de Credenciales</div>
                    <div className="text-slate-500">
                      {searchedOrder.credentials
                        ? 'Acceso generado y activo.'
                        : 'Se enviarán inmediatamente tras la conciliación bancaria.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Credentials Box (If Available) */}
              {searchedOrder.credentials ? (
                <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Key className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Datos de Acceso Oficiales
                    </h4>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {searchedOrder.credentials.accountUser && (
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">
                            Usuario / Correo
                          </div>
                          <div className="font-mono font-bold text-slate-900">
                            {searchedOrder.credentials.accountUser}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(searchedOrder.credentials?.accountUser || '', 'user')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          {copiedKey === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {searchedOrder.credentials.accountPass && (
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">
                            Contraseña
                          </div>
                          <div className="font-mono font-bold text-slate-900">
                            {searchedOrder.credentials.accountPass}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(searchedOrder.credentials?.accountPass || '', 'pass')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {searchedOrder.credentials.profileName && (
                      <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div>
                          <div className="text-slate-400 text-[10px] font-semibold uppercase">
                            Perfil Asignado
                          </div>
                          <div className="font-bold text-slate-900">
                            {searchedOrder.credentials.profileName}
                          </div>
                        </div>
                        {searchedOrder.credentials.pin && (
                          <div className="text-right">
                            <div className="text-slate-400 text-[10px] font-semibold uppercase">PIN</div>
                            <div className="font-mono font-bold text-indigo-600">{searchedOrder.credentials.pin}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {searchedOrder.credentials.instructions && (
                      <p className="text-[11px] text-indigo-900 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                        📌 {searchedOrder.credentials.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Estamos conciliando tu pago en el banco. ¿Deseas acelerar la verificación?
                    </span>
                  </div>
                  <a
                    href={buildWhatsAppPaymentUrl(searchedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer transition text-xs shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Avisar por WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
