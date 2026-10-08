import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Send,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ExternalLink,
  Mail,
  Smartphone,
  Sliders
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  ContractAgreement,
  Order,
  CustomerUser,
  FranchiseTenant,
  AppBrandingConfig
} from '../types';
import { safeFormatDate } from '../utils/formatters';
import { InvoiceEditorModal } from './InvoiceEditorModal';

interface AdminBillingAndContractsManagerProps {
  orders: Order[];
  customers: CustomerUser[];
  franchises?: FranchiseTenant[];
  bcvRate: number;
  branding?: AppBrandingConfig;
  onLogAudit?: (event: {
    actor: string;
    action: string;
    description: string;
    severity: 'info' | 'success' | 'warning' | 'error';
    metadata?: Record<string, any>;
  }) => void;
}

const STORAGE_INVOICES_KEY = 'GI_BILLING_INVOICES_2026';
const STORAGE_CONTRACTS_KEY = 'GI_CONTRACTS_LIST_2026';
const STORAGE_INVOICE_SEQ_KEY = 'GI_INVOICE_NEXT_SEQ';

export const AdminBillingAndContractsManager: React.FC<AdminBillingAndContractsManagerProps> = ({
  orders,
  customers,
  franchises = [],
  bcvRate,
  branding,
  onLogAudit
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'contracts'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInvoiceEditorOpen, setIsInvoiceEditorOpen] = useState(false);

  // Correlative sequences
  const [nextInvoiceSeq, setNextInvoiceSeq] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_INVOICE_SEQ_KEY);
    return saved ? parseInt(saved, 10) : 1001;
  });

  // Invoices list state (clean production: no demo invoices)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_INVOICES_KEY);
    if (saved) {
      try {
        const list: Invoice[] = JSON.parse(saved);
        const filtered = list.filter((inv) => !['CTR-2026-001', 'CTR-2026-002'].includes(inv.id) && !inv.invoiceNumber?.includes('CTR') && !inv.customerName?.toLowerCase().includes('demo'));
        localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(filtered));
        return filtered;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Contracts list state (clean production: no demo contracts)
  const [contracts, setContracts] = useState<ContractAgreement[]>(() => {
    const saved = localStorage.getItem(STORAGE_CONTRACTS_KEY);
    if (saved) {
      try {
        const list: ContractAgreement[] = JSON.parse(saved);
        return list.filter((c) => !['CTR-2026-001', 'CTR-2026-002'].includes(c.id) && !['CTR-2026-001', 'CTR-2026-002'].includes(c.contractNumber));
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Modal States
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const [viewingContract, setViewingContract] = useState<ContractAgreement | null>(null);
  const [editingContract, setEditingContract] = useState<ContractAgreement | null>(null);
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  // New Invoice Form state
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [invCustomerName, setInvCustomerName] = useState('');
  const [invCustomerDocId, setInvCustomerDocId] = useState('');
  const [invCustomerEmail, setInvCustomerEmail] = useState('');
  const [invCustomerPhone, setInvCustomerPhone] = useState('');
  const [invAddress, setInvAddress] = useState('Caracas, Venezuela');
  const [invItemDesc, setInvItemDesc] = useState('');
  const [invItemPrice, setInvItemPrice] = useState<number>(5);
  const [invTaxPercent, setInvTaxPercent] = useState<number>(0);
  const [invPaymentMethod, setInvPaymentMethod] = useState('Pago Móvil');

  // Filtered lists
  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerPhone.includes(searchQuery) ||
        inv.controlNumber.includes(searchQuery)
    );
  }, [invoices, searchQuery]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.parties.partyB.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contracts, searchQuery]);

  // Save changes to localStorage
  const saveInvoicesState = (newInvoices: Invoice[], newSeq?: number) => {
    setInvoices(newInvoices);
    localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(newInvoices));
    if (newSeq !== undefined) {
      setNextInvoiceSeq(newSeq);
      localStorage.setItem(STORAGE_INVOICE_SEQ_KEY, newSeq.toString());
    }
  };

  const saveContractsState = (newContracts: ContractAgreement[]) => {
    setContracts(newContracts);
    localStorage.setItem(STORAGE_CONTRACTS_KEY, JSON.stringify(newContracts));
  };

  // Create Invoice from an Order
  const handleOpenCreateInvoice = (order?: Order) => {
    if (order) {
      setSelectedOrderId(order.id);
      setInvCustomerName(order.customerName);
      setInvCustomerDocId('V-18.999.000');
      setInvCustomerEmail(order.customerEmail);
      setInvCustomerPhone(order.customerPhone);
      setInvItemDesc(`${order.productName} (${order.duration} - ${order.accountType})`);
      setInvItemPrice(order.total);
      setInvPaymentMethod(order.paymentMethodName || 'Pago Móvil');
    } else {
      setSelectedOrderId('');
      setInvCustomerName('');
      setInvCustomerDocId('');
      setInvCustomerEmail('');
      setInvCustomerPhone('');
      setInvItemDesc('Suscripción Pantalla Streaming');
      setInvItemPrice(5);
      setInvPaymentMethod('Pago Móvil');
    }
    setIsCreatingInvoice(true);
  };

  const handleSaveNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const invNum = `FAC-2026-${String(nextInvoiceSeq).padStart(4, '0')}`;
    const ctrlNum = `00-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const subtotal = invItemPrice;
    const taxAmt = (subtotal * invTaxPercent) / 100;
    const totalUsd = subtotal + taxAmt;
    const totalBs = Number((totalUsd * bcvRate).toFixed(2));

    const newInvoice: Invoice = {
      id: invNum,
      orderId: selectedOrderId || undefined,
      invoiceNumber: invNum,
      controlNumber: ctrlNum,
      issueDate: new Date().toISOString(),
      customerName: invCustomerName.trim() || 'Cliente General',
      customerDocId: invCustomerDocId.trim() || 'V-00.000.000',
      customerEmail: invCustomerEmail.trim() || 'cliente@gregoryizquierdo.xyz',
      customerPhone: invCustomerPhone.trim() || '+58 412 0000000',
      customerAddress: invAddress.trim() || 'Venezuela',
      items: [
        {
          id: 'item-1',
          description: invItemDesc.trim(),
          quantity: 1,
          unitPriceUsd: invItemPrice,
          totalUsd: invItemPrice
        }
      ],
      subtotalUsd: subtotal,
      taxPercent: invTaxPercent,
      taxAmountUsd: taxAmt,
      totalUsd,
      bcvRate,
      totalBs,
      paymentMethod: invPaymentMethod,
      paymentStatus: 'paid',
      signatureStamp: true
    };

    const updated = [newInvoice, ...invoices];
    saveInvoicesState(updated, nextInvoiceSeq + 1);
    setIsCreatingInvoice(false);
    setViewingInvoice(newInvoice);

    if (onLogAudit) {
      onLogAudit({
        actor: 'Gregori Izquierdo (Admin)',
        action: 'EMITIR_FACTURA',
        description: `Factura ${newInvoice.invoiceNumber} emitida a ${newInvoice.customerName} por $${totalUsd.toFixed(2)} USD (Bs. ${totalBs.toFixed(2)}).`,
        severity: 'info',
        metadata: { invoiceNumber: newInvoice.invoiceNumber, totalUsd, totalBs }
      });
    }
  };

  // Print Invoice
  const handlePrint = () => {
    window.print();
  };

  // Send Invoice via WhatsApp
  const handleSendInvoiceWhatsApp = (inv: Invoice) => {
    const text =
      `📄 *FACTURA DE COMPRA #${inv.invoiceNumber}*\n` +
      `*Gregori Izquierdo Streaming*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Estimado(a) *${inv.customerName}*,\n` +
      `Adjuntamos el resumen de su factura digital:\n\n` +
      `🔢 *Nº Control:* ${inv.controlNumber}\n` +
      `📅 *Fecha:* ${safeFormatDate(inv.issueDate, undefined, '-')}\n` +
      `📺 *Concepto:* ${inv.items.map((i) => i.description).join(', ')}\n` +
      `💵 *Monto Total:* $${inv.totalUsd.toFixed(2)} USD\n` +
      `🇻🇪 *Equivalente:* Bs. ${inv.totalBs.toFixed(2)} (Tasa BCV: ${inv.bcvRate} Bs/USD)\n` +
      `💳 *Forma de Pago:* ${inv.paymentMethod} (Estado: PAGADA ✓)\n\n` +
      `🌐 Puede validar su garantía y acceder a su servicio en: https://gregoryizquierdo.xyz`;

    const cleanPhone = inv.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Send Invoice via Telegram
  const handleSendInvoiceTelegram = (inv: Invoice) => {
    const text =
      `📄 Factura #${inv.invoiceNumber} - Gregori Izquierdo Streaming\n` +
      `Cliente: ${inv.customerName} (${inv.customerDocId})\n` +
      `Total: $${inv.totalUsd.toFixed(2)} USD / Bs. ${inv.totalBs.toFixed(2)}\n` +
      `Detalle: ${inv.items.map((i) => i.description).join(', ')}\n` +
      `Garantía 100% activa en https://gregoryizquierdo.xyz`;

    const url = `https://t.me/share/url?url=${encodeURIComponent('https://gregoryizquierdo.xyz')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Renew / Update Contract
  const handleRenewContract = (contract: ContractAgreement) => {
    const newStartDate = new Date().toISOString().split('T')[0];
    const newEndDateObj = new Date();
    newEndDateObj.setFullYear(newEndDateObj.getFullYear() + 1);
    const newEndDate = newEndDateObj.toISOString().split('T')[0];

    const currentVersionNum = parseFloat(contract.version.replace('v', '')) || 2.0;
    const newVersion = `v${(currentVersionNum + 0.1).toFixed(1)}`;

    const updatedContract: ContractAgreement = {
      ...contract,
      startDate: newStartDate,
      endDate: newEndDate,
      version: newVersion,
      status: 'renewed',
      lastUpdated: new Date().toISOString()
    };

    const updatedList = contracts.map((c) => (c.id === contract.id ? updatedContract : c));
    saveContractsState(updatedList);
    setViewingContract(updatedContract);

    if (onLogAudit) {
      onLogAudit({
        actor: 'Gregori Izquierdo (Admin)',
        action: 'ACTUALIZAR_CONTRATO',
        description: `Contrato ${contract.contractNumber} (${contract.title}) actualizado y renovado a versión ${newVersion} con vigencia hasta ${newEndDate}.`,
        severity: 'success',
        metadata: { contractNumber: contract.contractNumber, newVersion, newEndDate }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gestión Comercial, Legal & Administrativa</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Facturación Digital & Gestión de Contratos
            </h2>
            <p className="text-indigo-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Emite facturas fiscales y comerciales por cada orden con serial correlativo, genera documentos en PDF listos para imprimir, gestiona contratos de servicio para clientes y actualízalos automáticamente ante renovaciones.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsInvoiceEditorOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              title="Personalizar bloques, diseño y orden de la factura con vista previa dinámica"
            >
              <Sliders className="w-4 h-4" />
              <span>Personalizar Bloques de Factura</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateInvoice()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Nueva Factura</span>
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Facturas Emitidas ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'contracts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Contratos de Servicio & Términos ({contracts.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={activeTab === 'invoices' ? 'Buscar factura por Nº, cliente o teléfono...' : 'Buscar contratos por título o parte...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium"
          />
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <span>Próximo Correlativo:</span>
            <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200">
              FAC-2026-{String(nextInvoiceSeq).padStart(4, '0')}
            </span>
          </div>
        )}
      </div>

      {/* TAB 1: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="p-10 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No hay facturas que coincidan con la búsqueda</h4>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-indigo-600">{inv.invoiceNumber}</span>
                    <span className="font-mono text-[11px] text-slate-500">Nº Control: {inv.controlNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                      {inv.paymentStatus === 'paid' ? 'Pagada ✓' : inv.paymentStatus}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-base">{inv.customerName}</h4>
                  <p className="text-xs text-slate-600">
                    C.I./RIF: <span className="font-mono font-semibold">{inv.customerDocId}</span> • Tel:{' '}
                    <span className="font-mono">{inv.customerPhone}</span> • Fecha:{' '}
                    <span>{safeFormatDate(inv.issueDate, undefined, '-')}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Concepto: <strong className="text-slate-700">{inv.items.map((i) => i.description).join(', ')}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">${inv.totalUsd.toFixed(2)} USD</span>
                    <span className="text-xs text-slate-500 block font-mono">
                      Bs. {inv.totalBs.toFixed(2)} (BCV {inv.bcvRate})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingInvoice(inv)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                      title="Ver / Imprimir Factura"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                      <span className="hidden sm:inline">Ver / PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendInvoiceWhatsApp(inv)}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Enviar por WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendInvoiceTelegram(inv)}
                      className="p-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Enviar por Telegram"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Telegram</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CONTRACTS LIST */}
      {activeTab === 'contracts' && (
        <div className="space-y-3">
          {filteredContracts.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-indigo-600">{c.contractNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                    Versión {c.version}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      c.status === 'active' || c.status === 'renewed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.status === 'active' ? 'Vigente' : c.status === 'renewed' ? 'Renovado ✓' : 'Vencido'}
                  </span>
                </div>

                <h4 className="font-black text-slate-900 text-base">{c.title}</h4>
                <p className="text-xs text-slate-600">
                  Parte B: <strong className="text-slate-900">{c.parties.partyB}</strong> ({c.parties.docIdB}) • Tel: {c.parties.phoneB}
                </p>
                <p className="text-xs text-slate-500">
                  Vigencia: <span className="font-mono font-bold text-slate-700">{c.startDate}</span> al{' '}
                  <span className="font-mono font-bold text-slate-700">{c.endDate}</span>
                  {c.monthlyFeeUsd ? ` • Canon: $${c.monthlyFeeUsd} USD/mes` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingContract(c)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Ver Contrato</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRenewContract(c)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Renovar / Actualizar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW INVOICE MODAL */}
      {isCreatingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Módulo de Facturación Digital
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Emitir Factura FAC-2026-{String(nextInvoiceSeq).padStart(4, '0')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingInvoice(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre o Razón Social:</label>
                  <input
                    type="text"
                    required
                    value={invCustomerName}
                    onChange={(e) => setInvCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cédula / RIF / DNI:</label>
                  <input
                    type="text"
                    required
                    value={invCustomerDocId}
                    onChange={(e) => setInvCustomerDocId(e.target.value)}
                    placeholder="Ej. V-18.456.789 o J-50123456-7"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono:</label>
                  <input
                    type="text"
                    required
                    value={invCustomerPhone}
                    onChange={(e) => setInvCustomerPhone(e.target.value)}
                    placeholder="+58 412 1234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={invCustomerEmail}
                    onChange={(e) => setInvCustomerEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dirección Fiscal:</label>
                  <input
                    type="text"
                    value={invAddress}
                    onChange={(e) => setInvAddress(e.target.value)}
                    placeholder="Caracas, Venezuela"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Descripción del Servicio / Pantalla:</label>
                  <input
                    type="text"
                    required
                    value={invItemDesc}
                    onChange={(e) => setInvItemDesc(e.target.value)}
                    placeholder="Netflix Ultra HD 4K (1 Mes - Perfil Privado)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monto en Dólares ($ USD):</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={invItemPrice}
                    onChange={(e) => setInvItemPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    Equivalente en Bs: Bs. {(invItemPrice * bcvRate).toFixed(2)} (Tasa BCV {bcvRate})
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Método de Pago:</label>
                  <select
                    value={invPaymentMethod}
                    onChange={(e) => setInvPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-slate-50"
                  >
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Wallet Zeny">Saldo Wallet Zeny</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Binance Pay / USDT">Binance Pay / USDT</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingInvoice(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md cursor-pointer"
                >
                  Generar & Emitir Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE VIEWER / PRINT PREVIEW MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Top Toolbar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm sm:text-base">Factura Digital #{viewingInvoice.invoiceNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendInvoiceWhatsApp(viewingInvoice)}
                  className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  title="Enviar por WhatsApp"
                >
                  <Send className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Page Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="invoice-print-area">
              {/* Header with GI Crest Monogram & Fiscal Info */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white font-black flex items-center justify-center text-lg border border-indigo-500">
                      GI
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-950 leading-tight">
                        {branding?.projectName || 'Gregori Izquierdo Streaming'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        RIF: {branding?.rif || 'J-50123456-7'} • Providencia SENIAT
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Servicios Digitales, Pantallas de Streaming & Entretenimiento
                  </p>
                  <p className="text-xs text-slate-400">🌐 https://gregoryizquierdo.xyz</p>
                </div>

                <div className="text-right border border-indigo-200 bg-indigo-50/50 p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider block">
                    FACTURA DIGITAL
                  </span>
                  <span className="text-xl font-black text-indigo-950 font-mono">{viewingInvoice.invoiceNumber}</span>
                  <span className="text-xs text-slate-500 font-mono block mt-0.5">
                    Nº Control: {viewingInvoice.controlNumber}
                  </span>
                  <span className="text-xs text-slate-600 block mt-1">
                    Fecha: {safeFormatDate(viewingInvoice.issueDate, undefined, '-')}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Datos del Cliente:</span>
                  <p className="font-extrabold text-slate-900 text-sm">{viewingInvoice.customerName}</p>
                  <p className="font-mono text-slate-600">C.I. / RIF: {viewingInvoice.customerDocId}</p>
                  <p className="text-slate-600">Dirección: {viewingInvoice.customerAddress || 'Venezuela'}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Contacto & Pago:</span>
                  <p className="font-mono text-slate-700">{viewingInvoice.customerPhone}</p>
                  <p className="text-slate-600">{viewingInvoice.customerEmail}</p>
                  <p className="text-indigo-700 font-bold">Método: {viewingInvoice.paymentMethod}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Cant.</th>
                      <th className="py-2.5 px-4 text-left">Descripción del Servicio</th>
                      <th className="py-2.5 px-4 text-right">Precio ($ USD)</th>
                      <th className="py-2.5 px-4 text-right">Total ($ USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.quantity}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.description}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">${item.unitPriceUsd.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">
                          ${item.totalUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Stamp */}
              <div className="flex justify-between items-end pt-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 max-w-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Factura Pagada & Conciliada</span>
                  </p>
                  <p className="text-slate-600">
                    Garantía activa durante todo el ciclo contratado. Emisión autorizada por la plataforma.
                  </p>
                </div>

                <div className="text-right space-y-1 text-xs">
                  <div className="flex justify-between gap-6 text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">${viewingInvoice.subtotalUsd.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between gap-6 text-slate-600">
                    <span>IVA / Impuestos:</span>
                    <span className="font-mono font-bold">Exento ($0.00)</span>
                  </div>
                  <div className="flex justify-between gap-6 text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total USD:</span>
                    <span className="font-mono text-indigo-700">${viewingInvoice.totalUsd.toFixed(2)} USD</span>
                  </div>
                  <div className="text-sm font-black text-emerald-700 font-mono">
                    Total en Bolívares: Bs. {viewingInvoice.totalBs.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    (Tasa Oficial BCV: {viewingInvoice.bcvRate} Bs/USD)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT VIEWER MODAL */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm sm:text-base">
                  {viewingContract.title} ({viewingContract.version})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingContract(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-5 text-slate-800 bg-white text-xs leading-relaxed" id="contract-print-area">
              <div className="text-center border-b border-slate-200 pb-4">
                <h2 className="text-base font-black text-slate-950 uppercase tracking-tight">{viewingContract.title}</h2>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Número de Instrumento: {viewingContract.contractNumber} • Versión {viewingContract.version}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p>
                  <strong>PARTE A (Licenciante / Plataforma):</strong> {viewingContract.parties.partyA}
                </p>
                <p>
                  <strong>PARTE B (Cliente / Suscriptor):</strong> {viewingContract.parties.partyB} (Doc ID:{' '}
                  {viewingContract.parties.docIdB} • Tel: {viewingContract.parties.phoneB} • Email:{' '}
                  {viewingContract.parties.emailB})
                </p>
                <p>
                  <strong>VIGENCIA:</strong> Desde el {viewingContract.startDate} hasta el {viewingContract.endDate}.
                </p>
              </div>

              <div className="space-y-3 font-mono text-[11px] text-slate-700 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 whitespace-pre-line">
                {viewingContract.termsAndConditions}
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-12" />
                  <span className="font-bold text-slate-900 block mt-2">Emprendimiento Gregory Izquierdo</span>
                  <span className="text-[10px] text-slate-500">Titular de la Plataforma</span>
                </div>

                <div>
                  <div className="border-b border-slate-400 pb-12" />
                  <span className="font-bold text-slate-900 block mt-2">{viewingContract.parties.partyB}</span>
                  <span className="text-[10px] text-slate-500">Cliente / Suscriptor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Invoice Block Editor Modal */}
      {isInvoiceEditorOpen && (
        <InvoiceEditorModal
          isOpen={isInvoiceEditorOpen}
          onClose={() => setIsInvoiceEditorOpen(false)}
          orders={orders}
          bcvRate={bcvRate}
          branding={branding}
          onCreateInvoice={(newInvoice) => {
            const updated = [newInvoice, ...invoices];
            saveInvoicesState(updated, nextInvoiceSeq + 1);
            setViewingInvoice(newInvoice);
          }}
        />
      )}
    </div>
  );
};
