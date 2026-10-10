import React, { useState, useMemo } from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  Palette,
  Printer,
  Save,
  RotateCcw,
  Sparkles,
  Building,
  FileText,
  User,
  Table,
  Calculator,
  CreditCard,
  ShieldCheck,
  FileCheck2,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle2,
  Download,
  QrCode,
  Sliders,
  DollarSign,
  TrendingUp,
  Settings2,
  Smartphone,
  Info
} from 'lucide-react';
import { Order, Invoice, AppBrandingConfig } from '../types';
import { safeFormatDate } from '../utils/formatters';

export type InvoiceBlockId =
  | 'header_logo'
  | 'company_info'
  | 'invoice_meta'
  | 'customer_info'
  | 'items_table'
  | 'totals_summary'
  | 'payment_details'
  | 'digital_signature'
  | 'legal_terms';

export interface InvoiceBlockConfig {
  id: InvoiceBlockId;
  name: string;
  description: string;
  enabled: boolean;
}

export interface InvoiceTemplateConfig {
  primaryColor: string;
  companyName: string;
  companyRif: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  logoUrl?: string;
  watermarkText: string;
  stampText: string;
  footerNote: string;
  taxPercent: number;
  blocks: InvoiceBlockConfig[];
}

export const INVOICE_TEMPLATE_STORAGE_KEY = 'gi_invoice_template_config_v2';

export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplateConfig = {
  primaryColor: '#4f46e5', // indigo-600
  companyName: 'Gregori Izquierdo - Entretenimiento Digital',
  companyRif: 'J-50123456-7',
  companyAddress: 'Av. Casanova, Torre Banco Plaza, Piso 8, Caracas, Venezuela',
  companyPhone: '+58 414 123 4567',
  companyEmail: 'contacto@gregoryizquierdo.xyz',
  companyWebsite: 'https://gregoryizquierdo.xyz',
  logoUrl: '',
  watermarkText: 'DOCUMENTO DIGITAL VÁLIDO',
  stampText: 'CERTIFICADO DIGITAL DE CONCILIACIÓN SENIAT • OPERACIÓN CONFORME',
  footerNote: 'Servicio garantizado por el período contratado. Prohibido alterar perfiles o claves para mantener activa la garantía de reemplazo inmediato.',
  taxPercent: 0,
  blocks: [
    { id: 'header_logo', name: 'Logo & Nombre Comercial', description: 'Logo oficial, título de la plataforma y membrete digital', enabled: true },
    { id: 'company_info', name: 'Datos Fiscales de la Empresa', description: 'RIF, domicilio fiscal, contacto y página web', enabled: true },
    { id: 'invoice_meta', name: 'Control, Número y Fecha', description: 'Nº Factura, Nº Control SENIAT, emisión y vencimiento', enabled: true },
    { id: 'customer_info', name: 'Datos del Cliente Receptor', description: 'Nombre completo, C.I./RIF, teléfono y correo', enabled: true },
    { id: 'items_table', name: 'Detalle de Servicios & Suscripciones', description: 'Tabla de ítems, pantallas contratadas, precio en USD y Bs', enabled: true },
    { id: 'totals_summary', name: 'Resumen Financiero & Tasa BCV', description: 'Subtotal, exención fiscal, tasa BCV oficial y totales', enabled: true },
    { id: 'payment_details', name: 'Método de Pago & Referencia', description: 'Forma de pago, referencia de conciliación y estatus PAGADA', enabled: true },
    { id: 'digital_signature', name: 'Sello Digital & Código QR', description: 'Sello de validación, código QR y firma autorizada', enabled: true },
    { id: 'legal_terms', name: 'Términos de Garantía & Soporte', description: 'Cláusulas de respaldo y condiciones de servicio', enabled: true }
  ]
};

const BLOCK_ICONS: Record<InvoiceBlockId, React.ElementType> = {
  header_logo: Building,
  company_info: FileText,
  invoice_meta: Settings2,
  customer_info: User,
  items_table: Table,
  totals_summary: Calculator,
  payment_details: CreditCard,
  digital_signature: ShieldCheck,
  legal_terms: FileCheck2
};

interface InvoiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  bcvRate: number;
  branding?: AppBrandingConfig;
  onSaveTemplate?: (template: InvoiceTemplateConfig) => void;
  onCreateInvoice?: (invoice: Invoice) => void;
}

export const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  isOpen,
  onClose,
  orders,
  bcvRate,
  branding,
  onSaveTemplate,
  onCreateInvoice
}) => {
  // Load saved template config or fallback
  const [template, setTemplate] = useState<InvoiceTemplateConfig>(() => {
    const saved = localStorage.getItem(INVOICE_TEMPLATE_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading saved invoice template:', e);
      }
    }
    return {
      ...DEFAULT_INVOICE_TEMPLATE,
      companyName: branding?.projectName || DEFAULT_INVOICE_TEMPLATE.companyName,
      companyRif: branding?.rif || DEFAULT_INVOICE_TEMPLATE.companyRif,
      primaryColor: branding?.primaryColor || DEFAULT_INVOICE_TEMPLATE.primaryColor,
      logoUrl: branding?.logoUrl || DEFAULT_INVOICE_TEMPLATE.logoUrl
    };
  });

  // Selected Order for dynamic live preview
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    return orders.length > 0 ? orders[0].id : 'sample';
  });

  // Active editor tab: 'blocks' | 'settings'
  const [activeEditorTab, setActiveEditorTab] = useState<'blocks' | 'settings'>('blocks');
  
  // Dragged index for HTML5 drag and drop
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [isEmittedToast, setIsEmittedToast] = useState(false);

  // Fallback demo order if orders list is empty
  const activeOrder: Order = useMemo(() => {
    if (selectedOrderId !== 'sample') {
      const found = orders.find((o) => o.id === selectedOrderId);
      if (found) return found;
    }
    return {
      id: 'GI-89412',
      createdAt: new Date().toISOString(),
      customerId: 'prev-cust',
      customerName: 'Cliente Ejemplo',
      customerEmail: 'cliente@correo.com',
      customerPhone: '+58 424 000 0000',
      productId: 'netflix',
      productName: 'Netflix Ultra HD 4K',
      duration: '1 mes',
      accountType: 'Perfil con PIN',
      total: 5.0,
      currency: 'USD',
      paymentMethodId: 'pm-pagomovil',
      paymentMethodName: 'Pago Móvil BNC',
      referenceNumber: 'REF-000000',
      status: 'confirmed',
      credentials: {
        accountUser: 'cliente@correo.com',
        accountPass: 'Streaming2026*',
        profileName: 'Perfil 1 (Carlos)',
        pin: '4488',
        expirationDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      }
    };
  }, [selectedOrderId, orders]);

  // Dynamic calculations based on active order and current bcvRate
  const invoiceSubtotal = activeOrder.total;
  const taxAmount = (invoiceSubtotal * template.taxPercent) / 100;
  const invoiceTotalUsd = invoiceSubtotal + taxAmount;
  const invoiceTotalBs = Number((invoiceTotalUsd * bcvRate).toFixed(2));
  const invoiceNumber = `FAC-2026-${activeOrder.id.replace(/[^0-9]/g, '').slice(-4) || '1042'}`;
  const controlNumber = `00-${String(Math.floor(100000 + Math.random() * 900000))}`;

  // Drag and drop block reordering
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newBlocks = [...template.blocks];
    const draggedItem = newBlocks[draggedIdx];
    newBlocks.splice(draggedIdx, 1);
    newBlocks.splice(idx, 0, draggedItem);
    setDraggedIdx(idx);
    setTemplate((prev) => ({ ...prev, blocks: newBlocks }));
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= template.blocks.length) return;

    const newBlocks = [...template.blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;
    setTemplate((prev) => ({ ...prev, blocks: newBlocks }));
  };

  const toggleBlock = (blockId: InvoiceBlockId) => {
    setTemplate((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === blockId ? { ...b, enabled: !b.enabled } : b))
    }));
  };

  const handleSaveTemplateConfig = () => {
    localStorage.setItem(INVOICE_TEMPLATE_STORAGE_KEY, JSON.stringify(template));
    if (onSaveTemplate) {
      onSaveTemplate(template);
    }
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleResetToDefault = () => {
    if (confirm('¿Restablecer el diseño y orden de los bloques al formato predeterminado?')) {
      setTemplate(DEFAULT_INVOICE_TEMPLATE);
      localStorage.setItem(INVOICE_TEMPLATE_STORAGE_KEY, JSON.stringify(DEFAULT_INVOICE_TEMPLATE));
    }
  };

  const handleEmitCurrentInvoice = () => {
    const newInvoice: Invoice = {
      id: invoiceNumber,
      orderId: activeOrder.id,
      invoiceNumber,
      controlNumber,
      issueDate: new Date().toISOString(),
      customerName: activeOrder.customerName,
      customerDocId: 'V-18.456.789',
      customerEmail: activeOrder.customerEmail,
      customerPhone: activeOrder.customerPhone,
      customerAddress: 'Caracas, Venezuela',
      items: [
        {
          id: 'item-1',
          description: `${activeOrder.productName} (${activeOrder.duration} - ${activeOrder.accountType})`,
          quantity: 1,
          unitPriceUsd: activeOrder.total,
          totalUsd: activeOrder.total
        }
      ],
      subtotalUsd: invoiceSubtotal,
      taxPercent: template.taxPercent,
      taxAmountUsd: taxAmount,
      totalUsd: invoiceTotalUsd,
      bcvRate,
      totalBs: invoiceTotalBs,
      paymentMethod: activeOrder.paymentMethodName || 'Pago Móvil / Transferencia',
      paymentStatus: 'paid',
      signatureStamp: true
    };

    if (onCreateInvoice) {
      onCreateInvoice(newInvoice);
    }
    handleSaveTemplateConfig();
    setIsEmittedToast(true);
    setTimeout(() => setIsEmittedToast(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col h-screen w-screen overflow-hidden text-slate-800">
      {/* Top Navigation Bar */}
      <header className="px-5 py-3 border-b border-slate-800 bg-slate-950 text-white flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-indigo-300">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Editor de Bloques de Factura
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Drag & Drop
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personaliza el orden de los módulos, datos fiscales y previsualiza en vivo con pedidos reales y tasa BCV
            </p>
          </div>
        </div>

        {/* Live BCV & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Tasa BCV en Vivo:</span>
            <strong className="text-emerald-400">{bcvRate} Bs/USD</strong>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs shadow-xs transition cursor-pointer"
            title="Imprimir documento actual"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTemplateConfig}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
            title="Guardar diseño de plantilla"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Plantilla</span>
          </button>

          <button
            type="button"
            onClick={handleEmitCurrentInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer"
            title="Emitir factura oficial para el pedido seleccionado"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">Emitir Factura</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Drag & Drop Blocks + Settings Drawer */}
        <aside className="w-full md:w-[420px] lg:w-[460px] bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0">
          {/* Sub Header & Selector */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            {/* Dynamic Order Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Pedido para Vista Previa Dinámica:</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  {orders.length} pedidos cargados
                </span>
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="sample">⭐ Pedido de Demostración (Carlos Mendoza - $5.00)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.id} • {o.customerName} - {o.productName} (${o.total} USD)
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Tabs (Bloques vs Configuración) */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveEditorTab('blocks')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg transition cursor-pointer ${
                  activeEditorTab === 'blocks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GripVertical className="w-3.5 h-3.5" />
                <span>Bloques & Estructura ({template.blocks.filter((b) => b.enabled).length}/{template.blocks.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('settings')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg transition cursor-pointer ${
                  activeEditorTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Datos de Empresa</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Drag & Drop Blocks */}
          {activeEditorTab === 'blocks' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                <span>Arrastra o usa las flechas para reordenar:</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              </div>

              {template.blocks.map((block, idx) => {
                const Icon = BLOCK_ICONS[block.id] || FileText;
                const isDragging = draggedIdx === idx;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isDragging
                        ? 'opacity-40 scale-95 border-indigo-500 bg-indigo-950/40'
                        : block.enabled
                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700 shadow-xs'
                        : 'bg-slate-950/30 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1"
                        title="Arrastrar para ordenar"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          block.enabled ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Text */}
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{block.name}</span>
                          {!block.enabled && (
                            <span className="text-[10px] text-rose-400 font-normal">(Oculto)</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{block.description}</p>
                      </div>
                    </div>

                    {/* Controls: Up, Down, Visibility */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Subir bloque"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 'down')}
                        disabled={idx === template.blocks.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Bajar bloque"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBlock(block.id)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          block.enabled
                            ? 'text-emerald-400 hover:bg-emerald-950/40'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                        title={block.enabled ? 'Ocultar bloque' : 'Mostrar bloque'}
                      >
                        {block.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Company & Template Settings */}
          {activeEditorTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Color Primario */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Color Primario / Acento
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={template.primaryColor}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={template.primaryColor}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Razón Social */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre Comercial / Razón Social
                </label>
                <input
                  type="text"
                  value={template.companyName}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden"
                />
              </div>

              {/* RIF */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Registro Fiscal (RIF / C.I.)
                </label>
                <input
                  type="text"
                  value={template.companyRif}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, companyRif: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  value={template.companyAddress}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, companyAddress: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden"
                />
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Teléfono Soporte
                  </label>
                  <input
                    type="text"
                    value={template.companyPhone}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, companyPhone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={template.companyEmail}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, companyEmail: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Marca de Agua */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Texto de Marca de Agua
                </label>
                <input
                  type="text"
                  value={template.watermarkText}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, watermarkText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden"
                />
              </div>

              {/* Sello Digital */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Texto de Certificación / Sello Digital
                </label>
                <textarea
                  rows={2}
                  value={template.stampText}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, stampText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden resize-none"
                />
              </div>

              {/* Nota Legal Footer */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nota de Garantía y Pie de Página
                </label>
                <textarea
                  rows={3}
                  value={template.footerNote}
                  onChange={(e) => setTemplate((prev) => ({ ...prev, footerNote: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-hidden resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Quick Bar */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">BCV: {bcvRate} Bs/USD</span>
            <button
              type="button"
              onClick={handleSaveTemplateConfig}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </aside>

        {/* Right Side: High-Fidelity Paper Document Live Preview */}
        <main className="flex-1 bg-slate-950/40 p-4 sm:p-8 overflow-y-auto flex flex-col items-center justify-start">
          {/* Action toasts */}
          {isSavedToast && (
            <div className="fixed top-20 right-8 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-xs animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡Diseño de plantilla guardado exitosamente!</span>
            </div>
          )}
          {isEmittedToast && (
            <div className="fixed top-20 right-8 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-xs animate-bounce">
              <Sparkles className="w-4 h-4" />
              <span>¡Factura emitida e integrada a la contabilidad!</span>
            </div>
          )}

          {/* Document Preview Frame (Standard Printable Sheet) */}
          <div
            id="printable-invoice-document"
            className="w-full max-w-[780px] bg-white text-slate-900 rounded-3xl shadow-2xl p-8 sm:p-12 relative overflow-hidden border border-slate-200 transition-all select-text"
            style={{ minHeight: '900px' }}
          >
            {/* Background Watermark */}
            {template.watermarkText && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden opacity-[0.03]">
                <span className="text-8xl font-black text-slate-900 rotate-[-30deg] tracking-widest uppercase">
                  {template.watermarkText}
                </span>
              </div>
            )}

            {/* Render Enabled Blocks in Dynamic Configured Order */}
            <div className="space-y-6 relative z-10">
              {template.blocks
                .filter((b) => b.enabled)
                .map((block) => {
                  switch (block.id) {
                    case 'header_logo':
                      return (
                        <div key={block.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-md"
                              style={{ backgroundColor: template.primaryColor }}
                            >
                              GI
                            </div>
                            <div>
                              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                                {template.companyName}
                              </h1>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                Plataforma de Streaming & Distribución Digital
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className="inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-xs"
                              style={{ backgroundColor: template.primaryColor }}
                            >
                              FACTURA DIGITAL
                            </span>
                            <div className="text-xl font-black text-slate-900 font-mono mt-1">
                              {invoiceNumber}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Nº Control: {controlNumber}
                            </div>
                          </div>
                        </div>
                      );

                    case 'company_info':
                      return (
                        <div key={block.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Emisor Autorizado:
                            </span>
                            <div className="font-bold text-slate-900">{template.companyName}</div>
                            <div className="font-mono text-slate-600">RIF: {template.companyRif}</div>
                            <div className="text-slate-500">{template.companyAddress}</div>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Canales de Contacto:
                            </span>
                            <div className="text-slate-700 font-medium">WhatsApp: {template.companyPhone}</div>
                            <div className="text-slate-700 font-medium">Soporte: {template.companyEmail}</div>
                            <div className="text-indigo-600 font-medium font-mono">{template.companyWebsite}</div>
                          </div>
                        </div>
                      );

                    case 'invoice_meta':
                      return (
                        <div key={block.id} className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-100/60 p-3.5 rounded-2xl border border-slate-200/60">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha Emisión</span>
                            <strong className="text-slate-900 font-medium">
                              {safeFormatDate(activeOrder.createdAt, undefined, 'Hoy')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Fecha de Corte</span>
                            <strong className="text-slate-900 font-medium">
                              {safeFormatDate(activeOrder.credentials?.expirationDate, undefined, 'Según plan')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Tasa BCV Aplicada</span>
                            <strong className="text-emerald-700 font-mono font-bold">
                              {bcvRate.toFixed(2)} Bs/USD
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pedido Origen</span>
                            <strong className="text-indigo-700 font-mono font-bold">
                              #{activeOrder.id}
                            </strong>
                          </div>
                        </div>
                      );

                    case 'customer_info':
                      return (
                        <div key={block.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-xs shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Datos del Adquiriente / Cliente:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-sm font-black text-slate-900">{activeOrder.customerName}</div>
                              <div className="text-slate-600 font-mono text-[11px]">C.I./RIF: V-18.456.789</div>
                              <div className="text-slate-500 text-[11px]">Ubicación: Venezuela</div>
                            </div>
                            <div className="sm:text-right">
                              <div className="text-slate-700 font-mono text-[11px]">Teléfono: {activeOrder.customerPhone}</div>
                              <div className="text-slate-700 font-mono text-[11px]">Correo: {activeOrder.customerEmail}</div>
                              <div className="text-emerald-600 font-bold text-[11px] mt-0.5">Cliente Verificado ✓</div>
                            </div>
                          </div>
                        </div>
                      );

                    case 'items_table':
                      return (
                        <div key={block.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="py-3 px-4">Descripción del Servicio</th>
                                <th className="py-3 px-4 text-center">Cant.</th>
                                <th className="py-3 px-4 text-right">Precio USD</th>
                                <th className="py-3 px-4 text-right">Precio Bs</th>
                                <th className="py-3 px-4 text-right">Total USD</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              <tr>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-slate-900">{activeOrder.productName}</div>
                                  <div className="text-[11px] text-slate-500">
                                    Modalidad: {activeOrder.accountType} • Duración: {activeOrder.duration}
                                  </div>
                                  {activeOrder.credentials?.profileName && (
                                    <div className="text-[10px] text-indigo-600 font-mono mt-0.5">
                                      Perfil Asignado: {activeOrder.credentials.profileName}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">1</td>
                                <td className="py-3.5 px-4 text-right font-mono text-slate-700">${activeOrder.total.toFixed(2)}</td>
                                <td className="py-3.5 px-4 text-right font-mono text-slate-700">Bs. {(activeOrder.total * bcvRate).toFixed(2)}</td>
                                <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                                  ${activeOrder.total.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );

                    case 'totals_summary':
                      return (
                        <div key={block.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <div className="text-xs text-slate-600">
                            <span className="font-bold text-slate-700 block mb-0.5">Régimen Cambiario Oficial</span>
                            <span>Calculado conforme al tipo de cambio publicado por el Banco Central de Venezuela.</span>
                            <div className="font-mono text-indigo-700 font-bold mt-1">
                              1.00 USD = {bcvRate.toFixed(2)} VES
                            </div>
                          </div>

                          <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                            <div className="flex justify-between text-slate-600">
                              <span>Subtotal:</span>
                              <span className="font-mono font-semibold">${invoiceSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>IVA ({template.taxPercent}%):</span>
                              <span className="font-mono font-semibold">${taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                              <span className="font-black text-slate-900 text-sm">TOTAL USD:</span>
                              <span className="font-black text-lg font-mono text-indigo-950">
                                ${invoiceTotalUsd.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline text-emerald-700 font-bold">
                              <span className="text-xs uppercase">Total Bolívares (BCV):</span>
                              <span className="font-mono text-base font-black">
                                Bs. {invoiceTotalBs.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );

                    case 'payment_details':
                      return (
                        <div key={block.id} className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                                <span>PAGADA / CONCILIADA</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900 font-black">
                                  COMPROBANTE VERIFICADO
                                </span>
                              </div>
                              <div className="text-emerald-800 text-[11px]">
                                Método: <strong>{activeOrder.paymentMethodName || 'Transferencia'}</strong> • Referencia:{' '}
                                <span className="font-mono font-bold">{activeOrder.referenceNumber || 'S/N'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-emerald-800 font-mono">
                            Fecha de Pago: {safeFormatDate(activeOrder.createdAt, undefined, 'Confirmado')}
                          </div>
                        </div>
                      );

                    case 'digital_signature':
                      return (
                        <div key={block.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
                          {/* QR Code */}
                          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0">
                              <QrCode className="w-10 h-10 text-slate-800" />
                            </div>
                            <div className="text-[10px] text-slate-500 leading-tight">
                              <strong className="text-slate-800 block mb-0.5">Validación QR</strong>
                              Escanee para verificar la autenticidad del comprobante en línea.
                            </div>
                          </div>

                          {/* Digital Stamp */}
                          <div className="sm:col-span-2 flex items-center gap-3 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 text-[10px] text-indigo-950 font-mono">
                            <ShieldCheck className="w-7 h-7 text-indigo-600 shrink-0" />
                            <div>
                              <span className="font-bold text-indigo-900 uppercase block">
                                {template.stampText}
                              </span>
                              <span>Firma Digital Hash: SHA256-GI-98A7-B45F-2026-CONFIRMADO</span>
                            </div>
                          </div>
                        </div>
                      );

                    case 'legal_terms':
                      return (
                        <div key={block.id} className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-relaxed">
                          <p>{template.footerNote}</p>
                          <p className="mt-1 font-mono text-slate-500">
                            Gregori Izquierdo Streaming • {template.companyWebsite} • Caracas, Venezuela
                          </p>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
