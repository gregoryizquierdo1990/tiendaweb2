import React, { useState } from 'react';
import {
  FileText,
  X,
  Printer,
  CheckCircle2,
  Download,
  ShieldCheck,
  Globe,
  Smartphone,
  CreditCard,
  Mail,
  Server,
  DollarSign,
  HelpCircle,
  Sparkles,
  Layers,
  Copy,
  Check,
  Building,
  Key,
  Calendar,
  ExternalLink,
  Edit3,
  RotateCcw,
  Save
} from 'lucide-react';
import { DOMAIN_OFFICIAL } from '../utils/messageTemplates';
import { ACTIVE_SYSTEM_ROUTES } from '../config/routesDirectory';
import {
  DEFAULT_FRANCHISE_CONTRACT_TEMPLATE,
  DEFAULT_FRANCHISE_MONTHLY_FEE,
  renderContractText
} from '../utils/contractTemplate';

interface AdminHandoverGuideModalProps {
  onClose: () => void;
  bcvRate?: number;
  isInline?: boolean;
}

const STORAGE_CONTRACT_KEY = 'gi_franchise_contract_custom_v1';

export const AdminHandoverGuideModal: React.FC<AdminHandoverGuideModalProps> = ({ onClose, bcvRate = 36.5, isInline = false }) => {
  const [activeSection, setActiveSection] = useState<'requisitos' | 'programas' | 'entrega' | 'contrato' | 'rutas'>('requisitos');
  const [copiedAgreement, setCopiedAgreement] = useState(false);
  const [copiedRouteUrl, setCopiedRouteUrl] = useState<string | null>(null);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractSavedNotice, setContractSavedNotice] = useState(false);

  // Contract variables
  const [monthlyFee, setMonthlyFee] = useState<number>(() => {
    const saved = localStorage.getItem('gi_default_franchise_fee');
    return saved ? Number(saved) : DEFAULT_FRANCHISE_MONTHLY_FEE;
  });
  const [franchiseName, setFranchiseName] = useState('StreamPlus Venezuela');
  const [franchiseOwner, setFranchiseOwner] = useState('Carlos Mendoza');
  const [franchiseIdDoc, setFranchiseIdDoc] = useState('V-20.123.456');
  const [franchisePhone, setFranchisePhone] = useState('+58 414 123 4567');
  const [franchiseWallet, setFranchiseWallet] = useState('StreamPay');

  // Contract raw clauses template
  const [contractTemplate, setContractTemplate] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONTRACT_KEY);
      if (saved) return saved;
    } catch (e) {
      console.warn('Could not read contract from storage');
    }
    return DEFAULT_FRANCHISE_CONTRACT_TEMPLATE;
  });

  const renderedContract = renderContractText(contractTemplate, {
    nombreFranquicia: franchiseName,
    titularFranquicia: franchiseOwner,
    cedulaFranquicia: franchiseIdDoc,
    telefonoFranquicia: franchisePhone,
    precioMensualUsd: monthlyFee,
    bcvRate: bcvRate,
    billeteraNombre: franchiseWallet
  });

  const handleSaveContractTemplate = () => {
    try {
      localStorage.setItem(STORAGE_CONTRACT_KEY, contractTemplate);
      localStorage.setItem('gi_default_franchise_fee', String(monthlyFee));
    } catch (e) {
      console.warn('Could not save contract template');
    }
    setIsEditingContract(false);
    setContractSavedNotice(true);
    setTimeout(() => setContractSavedNotice(false), 3000);
  };

  const handleResetContract = () => {
    if (window.confirm('¿Restablecer la plantilla de contrato a su versión original?')) {
      setContractTemplate(DEFAULT_FRANCHISE_CONTRACT_TEMPLATE);
      try {
        localStorage.removeItem(STORAGE_CONTRACT_KEY);
      } catch (e) {
        console.warn(e);
      }
      setIsEditingContract(false);
    }
  };

  const handleCopyAgreement = () => {
    navigator.clipboard.writeText(renderedContract);
    setCopiedAgreement(true);
    setTimeout(() => setCopiedAgreement(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const content = (
    <div className={`bg-white ${isInline ? '' : 'rounded-3xl shadow-2xl border border-slate-200'} w-full ${isInline ? '' : 'max-w-4xl max-h-[92vh]'} flex flex-col overflow-hidden my-auto`}>
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Building className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">
                  Manual de Venta, Franquicia & Kit de Entrega
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Modelo SaaS Administrado
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                Guía completa para comercializar esta plataforma a terceros bajo suscripción mensual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
              title="Imprimir guía o exportar como PDF"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Imprimir / Guardar PDF</span>
            </button>
            {!isInline && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('requisitos')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'requisitos'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. ¿Qué solicitar al Comprador?</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('programas')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'programas'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Programas que Necesita</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('entrega')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'entrega'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Formato & Forma de Entrega</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('contrato')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'contrato'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Acuerdo de Suscripción Sugerido</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('rutas')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'rutas'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>5. Rutas Activas ({DOMAIN_OFFICIAL.replace('https://', '')})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm">
          {/* SECTION 1: QUE SOLICITAR */}
          {activeSection === 'requisitos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Ficha de Requisitos para el Comprador (Onboarding)</span>
                </h4>
                <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                  Pídele al comprador que te entregue estos 6 elementos para poner en marcha su plataforma en menos de 24 horas:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">1</span>
                    <span>Identidad de Marca</span>
                  </div>
                  <strong className="text-slate-900 block text-xs">Nombre del Negocio y Logo:</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • Nombre comercial que aparecerá en la cabecera.<br />
                    • Logo en formato PNG o JPG con fondo transparente.<br />
                    • Eslogan de la tienda (ej. "Tu entretenimiento digital seguro").
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">2</span>
                    <span>Datos de Cobro Bancario</span>
                  </div>
                  <strong className="text-slate-900 block text-xs">Cuentas donde él recibirá el dinero:</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • <strong>Pago Móvil:</strong> Banco, Teléfono, Cédula/RIF y Titular.<br />
                    • <strong>Transferencias locales:</strong> Número de cuenta bancaria.<br />
                    • <strong>Divisas/Cripto:</strong> Binance Pay ID o correo, Zinli, Wally, PayPal.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">3</span>
                    <span>Línea Oficial de WhatsApp</span>
                  </div>
                  <strong className="text-slate-900 block text-xs">Número de Atención y Ventas:</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • Número telefónico con código de país (ej. +58 414-XXXXXXX).<br />
                    • Es donde los clientes enviarán comprobantes y donde él despachará credenciales en 1 clic.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">4</span>
                    <span>Cuenta de Google (Gmail)</span>
                  </div>
                  <strong className="text-slate-900 block text-xs">Para su Base de Datos en Drive:</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • Un correo Gmail exclusivo para su negocio.<br />
                    • La plataforma se conecta directamente a su Drive para crear su hoja de cálculo privada donde se guardan sus ventas, pedidos y clientes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">5</span>
                    <span>Dominio Web</span>
                  </div>
                  <strong className="text-slate-900 block text-xs">Dirección en Internet:</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • <strong>Opción A (Fácil):</strong> Un subdominio asignado por ti (ej. <em>suempresa.gregoryizquierdo.xyz</em>).<br />
                    • <strong>Opción B (Exclusivo):</strong> Su propio dominio (ej. <em>suempresa.com</em>) apuntado a la plataforma.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">6</span>
                    <span>Catálogo & Precios</span>
                  </div>
                  <strong className="text-slate-900 block text-xs">Servicios a Comercializar:</strong>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    • Si venderá Netflix, Disney+, Max, Prime, MagisTV, IPTV.<br />
                    • Sus precios de venta en USD y si usará la Tasa Oficial BCV diaria para la conversión en Bolívares.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PROGRAMAS Y APLICACIONES */}
          {activeSection === 'programas' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <h4 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Gran Ventaja Comercial: Cero Programas Complicados</span>
                </h4>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  Tu comprador <strong>NO necesita saber de programación, ni instalar servidores, ni instalar bases de datos (SQL)</strong>. La plataforma es 100% Web Cloud y funciona en cualquier dispositivo moderno.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      1. Navegador Web (Google Chrome, Safari, Edge, Firefox o Brave)
                    </h5>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      El comprador y sus clientes solo entran a la dirección web desde su computadora, laptop, tablet o teléfono inteligente Android/iPhone. Además, puede instalarla como aplicación web progresiva (PWA) con el botón de "Instalar App".
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      2. WhatsApp o WhatsApp Business
                    </h5>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      Tanto en su teléfono como en WhatsApp Web de su computadora. Desde la plataforma, al presionar "Enviar Credenciales" o "Avisar WhatsApp" en el Calendario de Vencimientos, el sistema abre WhatsApp directamente con el mensaje ya redactado y los datos del cliente listos.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      3. Cuenta de Google (Google Drive & Google Sheets)
                    </h5>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      El comprador solo inicia sesión con su cuenta de Google en la plataforma con 1 clic. La app se encarga de crear y mantener actualizada su hoja de cálculo en la nube, donde tiene respaldo en tiempo real de todas sus transacciones.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      4. App Bancaria o Billetera Digital del Comprador
                    </h5>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      La app de su banco (Banesco, Mercantil, BDV, etc.) o de cripto (Binance) para verificar los fondos antes de marcar un pedido como "Aprobado" en el panel administrativo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: FORMATO Y FORMA DE ENTREGA */}
          {activeSection === 'entrega' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>¿Cómo se entrega el material? (Formato Llave en Mano)</span>
                </h4>
                <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                  En un modelo de franquicia o suscripción mensual administrada, <strong>tú no le entregas archivos de código sueltos que puedan piratear o dañar</strong>. Le entregas un acceso comercial listo para facturar.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Elemento de Entrega #1
                  </span>
                  <strong className="text-slate-900 text-sm block">1. URL Oficial de su Tienda Web con Certificado SSL (HTTPS)</strong>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Le entregas el enlace web de su tienda configurado con su nombre y logo (ej. <em>https://gregoryizquierdo.xyz</em> o su dominio personalizado). Este es el enlace que él colocará en el perfil de su Instagram, TikTok, Facebook y WhatsApp.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Elemento de Entrega #2
                  </span>
                  <strong className="text-slate-900 text-sm block">2. Credenciales Maestras de Super Administrador</strong>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Le proporcionas su usuario y clave de acceso maestro al panel administrativo (`/admin`), con el que podrá conciliar pagos, cambiar precios de pantallas, ver el calendario de vencimientos y gestionar clientes a crédito.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Elemento de Entrega #3
                  </span>
                  <strong className="text-slate-900 text-sm block">3. Base de Datos en Google Drive Sincronizada</strong>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Le conectas su cuenta de Google para que tenga su propia hoja de cálculo en Drive estructurada con las pestañas de <em>Ventas_Streaming</em>, <em>Catalogo_Productos</em>, <em>Plantillas_Mensajes</em> y <em>Preguntas_Frecuentes</em>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Elemento de Entrega #4
                  </span>
                  <strong className="text-slate-900 text-sm block">4. Inducción de 20 Minutos por Google Meet o WhatsApp</strong>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Una llamada rápida donde le muestras cómo despachar un pedido, cómo usar el botón de WhatsApp del calendario y cómo cobrar créditos pendientes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: CONTRATO DE SUSCRIPCIÓN PERSONALIZABLE */}
          {activeSection === 'contrato' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Contrato de Franquicia Personalizable & Canon Mensual</span>
                  </h4>
                  <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                    Edita las cláusulas a tu gusto, ajusta el precio mensual acordado y genera el contrato listo para firmar o imprimir.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsEditingContract(!isEditingContract)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                      isEditingContract
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingContract ? 'Ver Vista Previa' : '✏️ Editar Cláusulas'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyAgreement}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {copiedAgreement ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedAgreement ? '¡Copiado!' : 'Copiar Contrato'}</span>
                  </button>
                </div>
              </div>

              {contractSavedNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Plantilla de contrato y tarifa mensual guardadas con éxito en tu sistema!</span>
                </div>
              )}

              {/* Panel de Variables del Contrato (Tarifa mensual, Franquiciado, Billetera) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                  ⚙️ Parámetros del Contrato & Datos del Franquiciado
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Tarifa Mensual ($ USD/mes) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={monthlyFee}
                        onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50/40 font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Equivalente: Bs. {(monthlyFee * bcvRate).toFixed(2)} BCV
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nombre de la Franquicia:
                    </label>
                    <input
                      type="text"
                      value={franchiseName}
                      onChange={(e) => setFranchiseName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"
                      placeholder="Ej. StreamPlus Venezuela"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Titular del Franquiciado:
                    </label>
                    <input
                      type="text"
                      value={franchiseOwner}
                      onChange={(e) => setFranchiseOwner(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"
                      placeholder="Ej. Carlos Mendoza"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Cédula / RIF:
                    </label>
                    <input
                      type="text"
                      value={franchiseIdDoc}
                      onChange={(e) => setFranchiseIdDoc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"
                      placeholder="Ej. V-20.123.456"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Teléfono Comercial:
                    </label>
                    <input
                      type="text"
                      value={franchisePhone}
                      onChange={(e) => setFranchisePhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"
                      placeholder="Ej. +58 414 123 4567"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nombre de su Billetera Privada:
                    </label>
                    <input
                      type="text"
                      value={franchiseWallet}
                      onChange={(e) => setFranchiseWallet(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800 bg-white"
                      placeholder="Ej. StreamPay o MiBilletera"
                    />
                  </div>
                </div>
              </div>

              {/* Modo Edición de Cláusulas vs Modo Vista Previa Renderizada */}
              {isEditingContract ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-indigo-600" />
                      <span>Editando texto base y cláusulas del contrato:</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetContract}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restablecer Original</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveContractTemplate}
                        className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Contrato</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Puedes modificar los párrafos, agregar cláusulas o eliminar términos. Los placeholders como <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-700">{'{PRECIO_MENSUAL_USD}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-700">{'{NOMBRE_FRANQUICIA}'}</code> y <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-indigo-700">{'{BILLETERA_NOMBRE}'}</code> se reemplazarán automáticamente con los datos del formulario de arriba.
                  </p>

                  <textarea
                    rows={12}
                    value={contractTemplate}
                    onChange={(e) => setContractTemplate(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Documento Final Renderizado (Listo para Firma / PDF):</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Tasa BCV Aplicada: {bcvRate.toFixed(2)} Bs/USD
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto border border-slate-800 shadow-inner select-all">
                    {renderedContract}
                  </div>
                </div>
              )}

              {/* Guía de Monetización */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <strong className="text-slate-900 text-xs block">Métricas de Rentabilidad del Modelo Franquicia:</strong>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Costo de Setup Inicial</span>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">$30 - $60 USD</div>
                    <span className="text-[10px] text-slate-400">Pago único de configuración inicial</span>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Canon Mensual Acordado</span>
                    <div className="text-base font-extrabold text-indigo-700 mt-0.5">${monthlyFee.toFixed(2)} USD / mes</div>
                    <span className="text-[10px] text-slate-500">Bs. {(monthlyFee * bcvRate).toFixed(2)} BCV recurrente</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Control de Fondos</span>
                    <div className="text-base font-extrabold text-emerald-700 mt-0.5">Recaudación Central</div>
                    <span className="text-[10px] text-slate-500">Abonos de wallet entran a tu cuenta</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: RUTAS ACTIVAS DEL DOMINIO OFICIAL */}
          {activeSection === 'rutas' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span>Directorio Oficial de Rutas del Negocio</span>
                    </h4>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      Todas las rutas activas configuradas en <strong>{DOMAIN_OFFICIAL}</strong> y la función específica de cada una para tu cliente, equipo y franquicias:
                    </p>
                  </div>

                  <a
                    href="/rutas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-xs"
                  >
                    <span>Abrir Portal de Rutas</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Grid de Rutas */}
              <div className="space-y-3.5">
                {ACTIVE_SYSTEM_ROUTES.map((route, rIdx) => {
                  const isCopied = copiedRouteUrl === route.path;

                  return (
                    <div
                      key={rIdx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">
                            {route.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {route.accessRole}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(route.fullUrl);
                              setCopiedRouteUrl(route.path);
                              setTimeout(() => setCopiedRouteUrl(null), 2000);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                            <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                          </button>

                          <a
                            href={route.path.includes(':') ? '/invoice/FACT-DEMO-01' : route.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                            title="Probar ruta"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* URL Box */}
                      <div className="p-2.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs flex items-center justify-between gap-2 overflow-x-auto">
                        <span className="text-indigo-400 font-bold select-all">
                          {route.fullUrl}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {route.path}
                        </span>
                      </div>

                      {/* Explicación y Propósito */}
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-800 font-semibold">
                          🎯 <strong>Propósito:</strong> {route.purpose}
                        </p>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {route.description}
                        </p>
                      </div>

                      {/* Lista de características */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                        {route.features.slice(0, 4).map((f, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guía Rápida de Enlaces */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <span className="font-bold block text-amber-950">
                  📌 Resumen de Uso Diario:
                </span>
                <p className="leading-relaxed">
                  • <code>{DOMAIN_OFFICIAL.replace('https://', '')}/admin</code> = Panel Administrativo exclusivo del dueño (contraseñas de streaming, conciliador, caja).<br />
                  • <code>{DOMAIN_OFFICIAL.replace('https://', '')}/solicitud-franquicia</code> = Enlace para enviar a prospectos y nuevos franquiciados.<br />
                  • <code>{DOMAIN_OFFICIAL.replace('https://', '')}/rutas</code> = Directorio navegable con todas las URLs activas.<br />
                  • <code>{DOMAIN_OFFICIAL.replace('https://', '')}/invoice/:id</code> = Consulta de recibos oficiales de pago.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Plataforma Oficial: {DOMAIN_OFFICIAL}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    );

  if (isInline) return content;

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      {content}
    </div>
  );
};
