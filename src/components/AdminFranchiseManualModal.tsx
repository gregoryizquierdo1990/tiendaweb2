import React from 'react';
import { FileText, Download, Printer, X, ShieldCheck, CheckCircle2, DollarSign, Calendar, Building, Sparkles } from 'lucide-react';
import { FranchiseTenant } from '../types';

interface AdminFranchiseManualModalProps {
  franchise: FranchiseTenant;
  bcvRate: number;
  onClose: () => void;
}

export const AdminFranchiseManualModal: React.FC<AdminFranchiseManualModalProps> = ({
  franchise,
  bcvRate,
  onClose
}) => {
  const feeBs = Math.round(franchise.monthlyFeeUsd * bcvRate * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const text = `==================================================\n` +
      `MANUAL DE USO Y CONTRATO DE FRANQUICIA - ${franchise.businessName.toUpperCase()}\n` +
      `==================================================\n\n` +
      `1. BIENVENIDA\n` +
      `Estimado/a ${franchise.ownerName}, le damos la más cordial bienvenida a la red de franquicias oficiales. Este documento contiene las directrices operativas, manual de funciones y contrato legal de concesión.\n\n` +
      `2. DETALLES DE SUSCRIPCIÓN Y PAGOS\n` +
      `- Franquiciado: ${franchise.businessName}\n` +
      `- Titular: ${franchise.ownerName}\n` +
      `- Teléfono / WhatsApp: ${franchise.phone}\n` +
      `- Correo Electrónico: ${franchise.email}\n` +
      `- Valor de la Membresía Mensual: $${franchise.monthlyFeeUsd.toFixed(2)} USD (Bs. ${feeBs.toLocaleString('es-VE')})\n` +
      `- Fecha de Corte / Renovación: ${franchise.creditDueDate || 'Día 30 de cada mes'}\n` +
      `- Cuenta Bancaria / Pago Móvil autorizada para renovaciones: Banesco / Pago Móvil 0424-1983648 / Zelle / Binance Pay (USDT).\n\n` +
      `3. MÓDULOS PRO ACTIVADOS EN SU PLAN\n` +
      `- Calendario de Vencimientos: ${franchise.enabledModules?.calendar ? 'Habilitado' : 'No contratado'}\n` +
      `- Créditos y Cobranzas: ${franchise.enabledModules?.credits ? 'Habilitado' : 'No contratado'}\n` +
      `- Avisos Automáticos 1 Día Antes: ${franchise.enabledModules?.reminders ? 'Habilitado' : 'No contratado'}\n` +
      `- Bot WhatsApp & Plantillas Pro: ${franchise.enabledModules?.botAutomation ? 'Habilitado' : 'No contratado'}\n` +
      `- Compras a Proveedores & Finanzas: ${franchise.enabledModules?.supplierPurchases ? 'Habilitado' : 'No contratado'}\n` +
      `- Dominio Propio / Marca Blanca: ${franchise.enabledModules?.customDomain ? 'Habilitado' : 'No contratado'}\n` +
      `- Personalización de Marca (Branding): ${franchise.enabledModules?.branding ? 'Habilitado' : 'No contratado'}\n` +
      `- Método de Pago en Cuotas: ${franchise.enabledModules?.installments ? 'Habilitado' : 'No contratado'}\n` +
      `- Red de Revendedores / Sub-Franquicias: ${franchise.enabledModules?.resellers ? 'Habilitado' : 'No contratado'}\n\n` +
      `4. CONDICIONES DE USO Y CONTRATO DE ADQUISICIÓN\n` +
      `El presente documento certifica que el franquiciado adquiere el derecho de uso comercial de la plataforma y herramientas tecnológicas bajo la supervisión de la marca matriz (Soporte técnico: +584241983648 | emprendimientogregoryizquierdo@gmail.com). El uso indebido de credenciales o incumplimiento de pagos acarreará la suspensión temporal del servicio.\n\n` +
      `© ${new Date().getFullYear()} Red de Franquicias Streaming. Todos los derechos reservados.`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Manual_y_Contrato_Franquicia_${franchise.businessName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Manual de Uso & Contrato de Franquicia</h3>
              <p className="text-slate-300 text-xs">
                {franchise.businessName} • Propietario: {franchise.ownerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar TXT</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm leading-relaxed bg-slate-50">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="text-center border-b border-slate-200 pb-4">
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Documento Oficial Concesión de Franquicia</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">{franchise.businessName}</h2>
              <p className="text-xs text-slate-500 font-mono">Titular: {franchise.ownerName} • RIF/ID: {franchise.email}</p>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">1. Bienvenida a la Red de Franquicias</h4>
                <p>
                  Estimado/a <strong>{franchise.ownerName}</strong>, nos complace darle la más cordial bienvenida como licenciatario oficial de nuestra red de streaming. Este manual describe las funciones operativas de su plan contratado, las condiciones de uso y el contrato legal de concesión comercial.
                </p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">2. Detalles de Membresía & Cuota Mensual</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-100 font-medium">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Membresía USD:</span>
                    <strong className="text-indigo-600 text-base">${franchise.monthlyFeeUsd.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Membresía en Bolívares (BCV):</span>
                    <strong className="text-emerald-600 text-base">Bs. {feeBs.toLocaleString('es-VE')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Fecha de Corte:</span>
                    <strong className="text-slate-900 text-base">{franchise.creditDueDate || 'Día 30'}</strong>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  * Las renovaciones mensuales deben cancelarse a través de Pago Móvil (Banesco - 04241983648), Zelle o Binance Pay. Soporte técnico oficial: <strong>04241983648</strong> / <strong>emprendimientogregoryizquierdo@gmail.com</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">3. Módulos Pro & Funciones Contratadas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>📅 Calendario de Vencimientos</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.calendar ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.calendar ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>💳 Créditos & Cobranzas</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.credits ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.credits ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>🔔 Avisos de Vencimiento 1 Día Antes</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.reminders ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.reminders ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>🤖 Bot WhatsApp & Plantillas Pro</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.botAutomation ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.botAutomation ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>📦 Compras a Proveedores & Finanzas</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.supplierPurchases ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.supplierPurchases ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>🌐 Dominio Propio / Marca Blanca</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.customDomain ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.customDomain ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>🎨 Personalización de Marca & Logo</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.branding ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.branding ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <span>💳 Método de Pago en Cuotas</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.installments ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.installments ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between sm:col-span-2">
                    <span>👥 Red de Revendedores / Sub-Franquicias</span>
                    <span className={`font-bold text-[11px] ${franchise.enabledModules?.resellers ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {franchise.enabledModules?.resellers ? 'ACTIVO' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">4. Condiciones de Uso & Contrato de Adquisición</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  El franquiciado se compromete a mantener la calidad de atención al cliente, respetar los precios sugeridos y reportar puntualmente los abonos a su Wallet Master. La marca matriz se reserva el derecho de actualizar las herramientas tecnológicas para garantizar la estabilidad del servicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
