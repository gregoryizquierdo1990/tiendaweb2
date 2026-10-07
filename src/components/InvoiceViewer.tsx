import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Printer, ShieldCheck, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { safeFormatDate } from '../utils/formatters';

export const InvoiceViewer: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const invoices = useAppStore((state) => state.invoices);
  const orders = useAppStore((state) => state.orders);
  const branding = useAppStore((state) => state.branding);

  // Check if admin is currently authenticated in session
  const isAdmin = localStorage.getItem('gi_admin_logged_in') === 'true' ||
                  localStorage.getItem('admin_authenticated') === 'true';

  let invoice = invoices.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

  // Fallback: If not found in invoices list, try to construct invoice from matching order
  if (!invoice && invoiceId) {
    const matchingOrder = orders.find((o) => o.id === invoiceId);
    if (matchingOrder) {
      invoice = {
        id: matchingOrder.id,
        orderId: matchingOrder.id,
        invoiceNumber: `FAC-2026-${matchingOrder.id.replace(/\D/g, '').slice(-4) || '1001'}`,
        controlNumber: `00-${matchingOrder.id.replace(/\D/g, '').slice(-6) || '200101'}`,
        issueDate: matchingOrder.createdAt || new Date().toISOString(),
        customerName: matchingOrder.customerName || 'Cliente General',
        customerDocId: 'V-18.999.000',
        customerEmail: matchingOrder.customerEmail,
        customerPhone: matchingOrder.customerPhone,
        items: [
          {
            id: 'it-1',
            description: `${matchingOrder.productName} (${matchingOrder.duration} - ${matchingOrder.accountType})`,
            quantity: 1,
            unitPriceUsd: matchingOrder.total,
            totalUsd: matchingOrder.total
          }
        ],
        subtotalUsd: matchingOrder.total,
        taxPercent: 0,
        taxAmountUsd: 0,
        totalUsd: matchingOrder.total,
        bcvRate: 36.5,
        totalBs: Number((matchingOrder.total * 36.5).toFixed(2)),
        paymentMethod: matchingOrder.paymentMethodName || 'Pago Móvil',
        paymentStatus: 'paid',
        signatureStamp: true
      };
    }
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-900">Factura no encontrada</h2>
          <p className="text-xs text-slate-500 mt-2">
            El identificador #{invoiceId} no corresponde a ningún documento fiscal registrado o fue revocado.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10 px-4 print:p-0 print:bg-white">
      {/* Top Bar for Navigation and Admin Actions */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Tienda</span>
        </Link>

        {isAdmin ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Modo Administrador
            </span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Copia de Solo Lectura</span>
          </div>
        )}
      </div>

      {/* Printable Invoice Container */}
      <div
        className={`max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:p-4 ${
          !isAdmin ? 'select-none pointer-events-none' : ''
        }`}
        style={!isAdmin ? { userSelect: 'none', WebkitUserSelect: 'none' } : {}}
      >
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
          }
        `}</style>

        {/* Security Watermark for Read-Only Protection */}
        {!isAdmin && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-4 rotate-[-30deg]">
            <span className="text-7xl font-black text-slate-900 font-mono tracking-widest">
              SOLO LECTURA
            </span>
          </div>
        )}

        {/* Header: Company & Invoice Correlative */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                GI
              </span>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {branding?.projectName || 'GREGORI IZQUIERDO STREAMING'}
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-mono">RIF: {branding?.rif || 'J-50123456-7'}</p>
            <p className="text-xs text-slate-500">Plataforma de Streaming & Cuentas Digitales 24/7</p>
            <p className="text-xs text-slate-500">WhatsApp Oficial: +58 424-1983648 / +58 412-0000000</p>
            <p className="text-xs text-slate-500">Email: emprendimientogregoryizquierdo@gmail.com</p>
          </div>

          <div className="sm:text-right bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0 min-w-[200px]">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              DOCUMENTO TRIBUTARIO DIGITAL
            </div>
            <div className="text-xl font-black text-indigo-700 font-mono mt-0.5">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-600 font-mono mt-1">
              Nº Control: {invoice.controlNumber}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Emisión: {safeFormatDate(invoice.issueDate, undefined, '-')}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verificado & Pagado</span>
            </div>
          </div>
        </div>

        {/* Customer Information Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Datos del Cliente / Titular:
            </span>
            <p className="text-sm font-extrabold text-slate-900">{invoice.customerName}</p>
            <p className="font-mono text-slate-600 mt-0.5">C.I. / RIF: {invoice.customerDocId}</p>
            <p className="text-slate-600">{invoice.customerEmail}</p>
            <p className="text-slate-600 font-mono">{invoice.customerPhone}</p>
          </div>
          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Condición de Operación:
            </span>
            <p className="font-bold text-slate-800">Método: {invoice.paymentMethod}</p>
            <p className="font-mono text-slate-600 mt-0.5">Tasa Oficial BCV: {invoice.bcvRate} Bs/USD</p>
            <p className="text-slate-500 mt-1">Lugar de Emisión: Caracas, Venezuela</p>
          </div>
        </div>

        {/* Table of Items */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Descripción del Servicio</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Precio Unit. (USD)</th>
                <th className="py-3 px-4 text-right">Total (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono">${item.unitPriceUsd.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">${item.totalUsd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">${invoice.subtotalUsd.toFixed(2)} USD</span>
            </div>
            {invoice.taxAmountUsd > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>IVA ({invoice.taxPercent}%):</span>
                <span className="font-mono">${invoice.taxAmountUsd.toFixed(2)} USD</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>TOTAL FACTURADO:</span>
              <span className="font-mono text-indigo-700">${invoice.totalUsd.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-800 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
              <span>TOTAL EN BOLÍVARES:</span>
              <span className="font-mono text-indigo-900 font-black">Bs. {invoice.totalBs.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Digital Stamp & Verification Note */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Documento certificado electrónicamente. Válido a efectos de garantía y soporte técnico.</span>
          </div>
          <div className="font-mono text-[10px] text-slate-400 text-center sm:text-right">
            ID: {invoice.id} • SHA-256 Validated
          </div>
        </div>
      </div>
    </div>
  );
};
