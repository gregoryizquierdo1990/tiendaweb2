import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  Calendar,
  User,
  Shield,
  HelpCircle,
  Tv,
  DollarSign,
  ChevronDown,
  X,
  Filter,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Key,
  Lock,
  HeartHandshake,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { Order, Product, CustomerUser, PlanDuration, AccountType, MessageTemplate } from '../types';
import { calculateExpirationDate, formatGrpay, safeFormatDate } from '../utils/formatters';
import { DEFAULT_MESSAGE_TEMPLATES, DOMAIN_OFFICIAL, renderTemplate } from '../utils/messageTemplates';

interface AdminCreditManagerProps {
  orders: Order[];
  products: Product[];
  customers: CustomerUser[];
  bcvRate: number;
  templates?: MessageTemplate[];
  onOpenAddCustomerModal: () => void;
  onSaveCreditOrder: (order: Order, newCustomer?: CustomerUser) => void;
  onUpdateCreditStatus: (
    orderId: string,
    creditStatus: 'pending_payment' | 'paid' | 'overdue',
    paymentNotes?: string
  ) => void;
  onUpdateCreditDueDate: (orderId: string, newDueDate: string) => void;
}

export const AdminCreditManager: React.FC<AdminCreditManagerProps> = ({
  orders,
  products,
  customers,
  bcvRate,
  templates,
  onOpenAddCustomerModal,
  onSaveCreditOrder,
  onUpdateCreditStatus,
  onUpdateCreditDueDate
}) => {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected order for actions
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<Order | null>(null);
  const [paymentMethodReceived, setPaymentMethodReceived] = useState('Pago Móvil');
  const [paymentNotesInput, setPaymentNotesInput] = useState('');

  // Selected order for credentials viewing
  const [viewCredentialsOrder, setViewCredentialsOrder] = useState<Order | null>(null);

  // Form State for Manual Assignment
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchInModal, setCustomerSearchInModal] = useState<string>('');
  const [customerFilterTag, setCustomerFilterTag] = useState<'all' | 'senior' | 'trust'>('all');

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>('1 mes');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('Perfil privado');
  const [customPriceUsd, setCustomPriceUsd] = useState<number>(0);
  const [creditDueDate, setCreditDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15); // Default 15 days credit
    return d.toISOString().split('T')[0];
  });
  const [creditNotes, setCreditNotes] = useState('');

  // Credentials State
  const [accountUser, setAccountUser] = useState('');
  const [accountPass, setAccountPass] = useState('');
  const [profileName, setProfileName] = useState('');
  const [pin, setPin] = useState('');
  const [instructions, setInstructions] = useState('No modificar correo ni perfiles ajenos.');

  // Selected customer object from ID
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Pre-fill price when product changes
  React.useEffect(() => {
    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    if (prod) {
      const basePrice = prod.prices[selectedDuration]?.USD ?? 5;
      const discount = prod.discountPercent || 0;
      const finalUsd = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
      setCustomPriceUsd(finalUsd);
      setSelectedAccountType(prod.accountType);
    }
  }, [selectedProductId, selectedDuration, products]);

  // Filter credit orders
  const creditOrders = orders.filter(
    (o) =>
      o.paymentCondition === 'credito' ||
      o.paymentMethodName.toLowerCase().includes('crédito') ||
      o.paymentMethodName.toLowerCase().includes('credito')
  );

  const filteredOrders = creditOrders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    const isPaid = order.creditStatus === 'paid';
    const isOverdue =
      !isPaid &&
      order.creditDueDate &&
      new Date(order.creditDueDate).getTime() < new Date().setHours(0, 0, 0, 0);

    if (filterStatus === 'paid') return matchesSearch && isPaid;
    if (filterStatus === 'overdue') return matchesSearch && isOverdue;
    if (filterStatus === 'pending') return matchesSearch && !isPaid && !isOverdue;
    return matchesSearch;
  });

  // KPI Calculations
  const pendingOrders = creditOrders.filter((o) => o.creditStatus !== 'paid');
  const totalPendingUsd = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPendingBs = totalPendingUsd * bcvRate;
  const totalPaidOrders = creditOrders.filter((o) => o.creditStatus === 'paid').length;

  // Customers filtered inside assignment modal
  const selectableCustomers = customers.filter((c) => {
    const matchesText =
      c.name.toLowerCase().includes(customerSearchInModal.toLowerCase()) ||
      c.phone.includes(customerSearchInModal) ||
      c.email.toLowerCase().includes(customerSearchInModal.toLowerCase());

    if (customerFilterTag === 'senior') return matchesText && c.isSeniorCitizen;
    if (customerFilterTag === 'trust') return matchesText && c.isTrustClient;
    return matchesText;
  });

  const handleOpenAssignModal = (preselectedCustId?: string) => {
    const prod = products[0];
    if (prod) {
      setSelectedProductId(prod.id);
      setSelectedDuration('1 mes');
      setCustomPriceUsd(prod.prices['1 mes']?.USD ?? 5);
      setSelectedAccountType(prod.accountType);
    }
    if (preselectedCustId) {
      setSelectedCustomerId(preselectedCustId);
    } else if (customers.length > 0) {
      // Pick first senior citizen or first customer
      const senior = customers.find((c) => c.isSeniorCitizen);
      setSelectedCustomerId(senior ? senior.id : customers[0].id);
    } else {
      setSelectedCustomerId('');
    }
    setCustomerSearchInModal('');
    setCreditNotes('Cliente de la 3era edad / confianza. Pago acordado.');
    setAccountUser('');
    setAccountPass('');
    setProfileName('Perfil 1');
    setPin('');
    setIsAssignModalOpen(true);
  };

  const handleSubmitAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Por favor selecciona un cliente registrado de la base de datos.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    const nowIso = new Date().toISOString();
    const expirationDateIso = calculateExpirationDate(nowIso, selectedDuration);
    const orderId = `CRED-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: Order = {
      id: orderId,
      createdAt: nowIso,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerEmail: selectedCustomer.email,
      productId: prod.id,
      productName: prod.name,
      duration: selectedDuration,
      accountType: selectedAccountType,
      total: customPriceUsd,
      currency: 'USD',
      paymentMethodId: 'credit_manual',
      paymentMethodName: 'Entrega a Crédito (Confianza)',
      referenceNumber: `CRED-${creditDueDate.replace(/-/g, '')}`,
      status: 'confirmed',
      paymentCondition: 'credito',
      creditDueDate,
      creditStatus: 'pending_payment',
      creditNotes: creditNotes.trim() || selectedCustomer.notes,
      isSeniorCitizen: selectedCustomer.isSeniorCitizen,
      isTrustClient: selectedCustomer.isTrustClient,
      credentials: {
        accountUser: accountUser.trim() || `${selectedCustomer.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@streaming.com`,
        accountPass: accountPass.trim() || 'Activa2026*',
        profileName: profileName.trim() || selectedCustomer.name.split(' ')[0],
        pin: pin.trim() || undefined,
        startDate: nowIso,
        expirationDate: expirationDateIso,
        instructions: instructions.trim()
      }
    };

    onSaveCreditOrder(newOrder);
    setIsAssignModalOpen(false);

    // Prompt to send via WhatsApp with Template
    const sendNow = window.confirm(
      `¡Servicio a crédito asignado con éxito a ${selectedCustomer.name}!\n\n¿Deseas abrir WhatsApp para enviarle sus datos de acceso y fecha acordada de pago?`
    );
    if (sendNow) {
      openSeniorWhatsAppReminder(newOrder);
    }
  };

  const openSeniorWhatsAppReminder = (order: Order) => {
    const creds = order.credentials || {};
    const formattedDueDate = safeFormatDate(
      order.creditDueDate ? order.creditDueDate + 'T12:00:00' : null,
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      },
      'Acordada'
    );

    const bsEquivalent = (order.total * bcvRate).toFixed(2);

    // Find custom template or fallback
    const tmplList = templates && templates.length > 0 ? templates : DEFAULT_MESSAGE_TEMPLATES;
    const template =
      tmplList.find((t) => t.id === 'entrega_credito_senior') ||
      DEFAULT_MESSAGE_TEMPLATES[0];

    const messageText = renderTemplate(template.content, {
      cliente: order.customerName,
      servicio: order.productName,
      tipo_cuenta: order.accountType,
      duracion: order.duration,
      usuario: creds.accountUser || 'Verificado',
      clave: creds.accountPass || 'Verificada',
      perfil: creds.profileName || 'Principal',
      pin: creds.pin || 'Sin PIN',
      monto_usd: order.total.toFixed(2),
      monto_bs: bsEquivalent,
      fecha_limite: formattedDueDate,
      tasa_bcv: bcvRate.toFixed(2),
      dominio: DOMAIN_OFFICIAL
    });

    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const openAmicableDebtReminder = (order: Order) => {
    const formattedDueDate = safeFormatDate(
      order.creditDueDate ? order.creditDueDate + 'T12:00:00' : null,
      {
        day: 'numeric',
        month: 'long'
      },
      'pronto'
    );

    const bsEquivalent = (order.total * bcvRate).toFixed(2);

    const tmplList = templates && templates.length > 0 ? templates : DEFAULT_MESSAGE_TEMPLATES;
    const template =
      tmplList.find((t) => t.id === 'cobro_credito_cordial') ||
      DEFAULT_MESSAGE_TEMPLATES[1];

    const messageText = renderTemplate(template.content, {
      cliente: order.customerName,
      servicio: order.productName,
      monto_usd: order.total.toFixed(2),
      monto_bs: bsEquivalent,
      fecha_limite: formattedDueDate,
      tasa_bcv: bcvRate.toFixed(2),
      banco: 'Banesco (0134)',
      pago_movil: '0414-3928410',
      cedula: '20.892.410',
      dominio: DOMAIN_OFFICIAL
    });

    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-3 border border-amber-500/30">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Módulo Especial: 3era Edad & Clientes de Confianza</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              Gestión de Créditos & Cuentas por Cobrar
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Paso 1: Registra al cliente para que quede en la base de datos general. Paso 2: Asígnale sus servicios seleccionándolo en un clic.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {/* Botón 1: Registrar Cliente por Primera Vez */}
            <button
              type="button"
              onClick={onOpenAddCustomerModal}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Registrar cliente por primera vez en la base de datos"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>1. Registrar Cliente</span>
            </button>

            {/* Botón 2: Asignar Crédito al Cliente */}
            <button
              type="button"
              onClick={() => handleOpenAssignModal()}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>2. + Asignar a Crédito</span>
            </button>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Cartera por Cobrar (USD)</span>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
              ${totalPendingUsd.toFixed(2)} USD
            </div>
            <span className="text-[10px] text-slate-400">Total adeudado</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Equivalente BCV (Bs.)</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              Bs. {totalPendingBs.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Tasa: {bcvRate.toFixed(2)} Bs/USD</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Cuentas Pendientes</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {pendingOrders.length}
            </div>
            <span className="text-[10px] text-amber-300">Créditos en curso</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Créditos Cobrados</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
              {totalPaidOrders}
            </div>
            <span className="text-[10px] text-slate-400">Liquidados con éxito</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({creditOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⏳ Por Cobrar ({creditOrders.filter((o) => o.creditStatus !== 'paid').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('overdue')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🚨 Vencidos
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ✅ Cobrados ({totalPaidOrders})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Credit Orders Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Cliente & Perfil</th>
                <th className="py-3 px-4">Servicio Asignado</th>
                <th className="py-3 px-4">Deuda ($ / Bs.)</th>
                <th className="py-3 px-4">Fecha Acordada</th>
                <th className="py-3 px-4">Estado del Crédito</th>
                <th className="py-3 px-4">Notas Internas</th>
                <th className="py-3 px-4 text-right">Acciones de Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <HeartHandshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">No hay entregas a crédito registradas con este filtro</p>
                    <p className="text-[11px] mt-0.5">
                      Haz clic en "1. Registrar Cliente" y luego en "2. Asignar a Crédito".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPaid = order.creditStatus === 'paid';
                  const isOverdue =
                    !isPaid &&
                    order.creditDueDate &&
                    new Date(order.creditDueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                  const bsEquiv = (order.total * bcvRate).toFixed(2);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{order.customerName}</span>
                          {order.isSeniorCitizen && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              👴 3era Edad
                            </span>
                          )}
                          {order.isTrustClient && !order.isSeniorCitizen && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                              🤝 Confianza
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.customerPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.productName}</div>
                        <div className="text-[11px] text-slate-500">
                          {order.duration} • <span className="font-semibold text-indigo-600">{order.accountType}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-amber-700 text-xs">
                          ${order.total.toFixed(2)} USD
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Bs. {bsEquiv} (BCV)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {safeFormatDate(
                              order.creditDueDate ? order.creditDueDate + 'T12:00:00' : null,
                              undefined,
                              'No definida'
                            )}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                            ⚠️ Plazo vencido
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Cobrado / Liquidado
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Pago Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente por Cobrar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="text-[11px] text-slate-600 italic truncate" title={order.creditNotes || 'Sin notas'}>
                          {order.creditNotes || 'Sin observaciones'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        {/* Botón Ver Credenciales */}
                        <button
                          type="button"
                          onClick={() => setViewCredentialsOrder(order)}
                          className="px-2 py-1 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 font-bold text-[11px] transition cursor-pointer"
                          title="Ver credenciales entregadas"
                        >
                          🔑 Credenciales
                        </button>

                        {/* Botón Recordatorio WhatsApp */}
                        <button
                          type="button"
                          onClick={() => openAmicableDebtReminder(order)}
                          className="px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                          title="Enviar recordatorio cordial por WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Cobrar WhatsApp</span>
                        </button>

                        {/* Botón Marcar como Cobrado */}
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrderForPay(order);
                              setPaymentMethodReceived('Pago Móvil');
                              setPaymentNotesInput('');
                            }}
                            className="px-2.5 py-1 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 font-bold text-[11px] shadow-xs transition cursor-pointer"
                            title="Marcar como cobrado y registrar ingreso"
                          >
                            ✅ Marcar Pagado
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateCreditStatus(order.id, 'pending_payment')}
                            className="px-2 py-1 rounded-lg text-slate-500 bg-slate-100 hover:bg-slate-200 font-semibold text-[10px] transition cursor-pointer"
                            title="Revertir a pendiente si hubo error"
                          >
                            Reabrir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASIGNAR CRÉDITO A CLIENTE REGISTRADO */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <HeartHandshake className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Asignar Servicio a Crédito
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Selecciona al cliente registrado en la base de datos para asignarle su suscripción.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAssign} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* 1. SELECTOR INTELIGENTE DE CLIENTE REGISTRADO */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    1. Selecciona al Cliente Registrado:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      onOpenAddCustomerModal();
                    }}
                    className="text-[11px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Registrar Nuevo Cliente</span>
                  </button>
                </div>

                {selectedCustomer ? (
                  /* Tarjeta del Cliente Seleccionado */
                  <div className="p-3.5 rounded-2xl bg-white border border-amber-300 shadow-sm flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-sm">{selectedCustomer.name}</span>
                        {selectedCustomer.isSeniorCitizen && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            👴 3era Edad
                          </span>
                        )}
                        {selectedCustomer.isTrustClient && !selectedCustomer.isSeniorCitizen && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            🤝 Confianza
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2">
                        <span>📞 {selectedCustomer.phone}</span>
                        <span>• ✉️ {selectedCustomer.email}</span>
                      </div>
                      {selectedCustomer.notes && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          Nota: {selectedCustomer.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId('')}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold transition cursor-pointer"
                    >
                      Cambiar Cliente
                    </button>
                  </div>
                ) : (
                  /* Buscador y Lista de Selección */
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o teléfono..."
                          value={customerSearchInModal}
                          onChange={(e) => setCustomerSearchInModal(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold shrink-0">
                        <button
                          type="button"
                          onClick={() => setCustomerFilterTag('all')}
                          className={`px-2 py-1.5 rounded-lg transition ${
                            customerFilterTag === 'all'
                              ? 'bg-slate-900 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerFilterTag('senior')}
                          className={`px-2 py-1.5 rounded-lg transition ${
                            customerFilterTag === 'senior'
                              ? 'bg-amber-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          👴 3era Edad
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerFilterTag('trust')}
                          className={`px-2 py-1.5 rounded-lg transition ${
                            customerFilterTag === 'trust'
                              ? 'bg-purple-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          🤝 Confianza
                        </button>
                      </div>
                    </div>

                    <div className="max-h-44 overflow-y-auto space-y-1 rounded-xl border border-slate-200 bg-white p-1">
                      {selectableCustomers.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-xs">
                          No se encontraron clientes con ese criterio.{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAssignModalOpen(false);
                              onOpenAddCustomerModal();
                            }}
                            className="text-amber-600 font-bold hover:underline"
                          >
                            ¿Registrar ahora?
                          </button>
                        </div>
                      ) : (
                        selectableCustomers.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className="w-full text-left p-2.5 rounded-lg hover:bg-amber-50/70 border border-transparent hover:border-amber-200 transition flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs group-hover:text-amber-700">
                                {cust.name}
                              </span>
                              {cust.isSeniorCitizen && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  👴 3era Edad
                                </span>
                              )}
                              {cust.isTrustClient && !cust.isSeniorCitizen && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                                  🤝 Confianza
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 font-mono">{cust.phone}</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-600 group-hover:underline">
                              Seleccionar →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Servicio & Duración */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-800 block">2. Servicio a Entregar</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Plataforma
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Duración
                    </label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value as PlanDuration)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="10 días">10 días (Cortesía)</option>
                      <option value="15 días">15 días (Cortesía)</option>
                      <option value="1 mes">1 mes</option>
                      <option value="3 meses">3 meses</option>
                      <option value="6 meses">6 meses</option>
                      <option value="12 meses">12 meses</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Tipo de Cuenta
                    </label>
                    <select
                      value={selectedAccountType}
                      onChange={(e) => setSelectedAccountType(e.target.value as AccountType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Perfil privado">Perfil privado</option>
                      <option value="Cuenta compartida">Cuenta compartida</option>
                      <option value="Perfil con PIN">Perfil con PIN</option>
                      <option value="Cuenta Completa">Cuenta Completa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Precio Acordado en Dólares ($ USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={customPriceUsd}
                        onChange={(e) => setCustomPriceUsd(parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Equivalente en Bolívares (Tasa BCV {bcvRate.toFixed(2)})
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-slate-200 font-mono font-bold text-slate-800">
                      Bs. {(customPriceUsd * bcvRate).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Condiciones del Crédito */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <span className="font-bold text-amber-950 block">3. Plazo y Notas de Confianza</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                      Fecha Límite Acordada para el Pago *
                    </label>
                    <input
                      type="date"
                      required
                      value={creditDueDate}
                      onChange={(e) => setCreditDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-amber-900 block mb-1">
                      Notas Internas / Recordatorio de Cobro
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cobra pensión el 15; avisarle a su hija María"
                      value={creditNotes}
                      onChange={(e) => setCreditNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Credenciales Inmediatas */}
              <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 block">4. Datos de Acceso a Entregar</span>
                  <span className="text-[10px] text-indigo-600 font-medium">Se enviará por WhatsApp</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Usuario / Correo de la Cuenta
                    </label>
                    <input
                      type="text"
                      placeholder="cuenta123@gmail.com"
                      value={accountUser}
                      onChange={(e) => setAccountUser(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Contraseña
                    </label>
                    <input
                      type="text"
                      placeholder="Clave123*"
                      value={accountPass}
                      onChange={(e) => setAccountPass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Nombre de Perfil
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Perfil 1 o Don Héctor"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      PIN del Perfil (Si aplica)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 1234"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedCustomer}
                  className={`px-5 py-2.5 rounded-xl font-extrabold shadow-md transition cursor-pointer flex items-center gap-2 ${
                    selectedCustomer
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Entregar Servicio a Crédito</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MARCAR COMO COBRADO */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Liquidar Deuda a Crédito</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForPay(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              Registrar el cobro recibido de <strong>{selectedOrderForPay.customerName}</strong> por el servicio de{' '}
              <strong>{selectedOrderForPay.productName}</strong>.
            </p>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 block font-semibold">Total a Liquidar</span>
                <div className="font-mono font-extrabold text-emerald-700 text-base">
                  ${selectedOrderForPay.total.toFixed(2)} USD
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-800 block font-semibold">Equivalente BCV</span>
                <div className="font-mono font-bold text-slate-700 text-xs">
                  Bs. {(selectedOrderForPay.total * bcvRate).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Método por el cual canceló el cliente:
                </label>
                <select
                  value={paymentMethodReceived}
                  onChange={(e) => setPaymentMethodReceived(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Efectivo (Dólares)">Efectivo (Dólares)</option>
                  <option value="Efectivo (Bolívares)">Efectivo (Bolívares)</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Binance Pay USDT">Binance Pay USDT</option>
                  <option value="Zinli">Zinli</option>
                  <option value="Saldo Zeny">Saldo Zeny</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Referencia o Nota de Cobro (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ref 849201 o canceló en mano"
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedOrderForPay(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateCreditStatus(
                    selectedOrderForPay.id,
                    'paid',
                    `Cobrado vía ${paymentMethodReceived}${paymentNotesInput ? ' - ' + paymentNotesInput : ''}`
                  );
                  setSelectedOrderForPay(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition cursor-pointer"
              >
                Confirmar Cobro Exitoso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER CREDENCIALES */}
      {viewCredentialsOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Credenciales de Acceso</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewCredentialsOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Cliente</span>
                <strong className="text-slate-900">{viewCredentialsOrder.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Servicio</span>
                <strong className="text-indigo-700">
                  {viewCredentialsOrder.productName} ({viewCredentialsOrder.accountType})
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 font-mono space-y-1.5">
                <div>
                  <span className="text-slate-500 text-[10px]">Usuario: </span>
                  <span className="font-bold text-slate-900">
                    {viewCredentialsOrder.credentials?.accountUser || 'No asignado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Contraseña: </span>
                  <span className="font-bold text-slate-900">
                    {viewCredentialsOrder.credentials?.accountPass || 'No asignada'}
                  </span>
                </div>
                {viewCredentialsOrder.credentials?.profileName && (
                  <div>
                    <span className="text-slate-500 text-[10px]">Perfil: </span>
                    <span className="font-bold text-slate-900">
                      {viewCredentialsOrder.credentials.profileName}
                    </span>
                  </div>
                )}
                {viewCredentialsOrder.credentials?.pin && (
                  <div>
                    <span className="text-slate-500 text-[10px]">PIN: </span>
                    <span className="font-bold text-slate-900">
                      {viewCredentialsOrder.credentials.pin}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => openSeniorWhatsAppReminder(viewCredentialsOrder)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Reenviar por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setViewCredentialsOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
