import React, { useState, useMemo, useEffect } from 'react';
import { fetchCalendarEvents, syncEventToCalendar, GoogleCalendarEvent } from '../services/googleCalendar';
import { getAccessToken, signInWithGoogleIdentity } from '../services/googleAuth';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
  Search,
  DollarSign,
  User,
  Tv,
  Phone,
  Sparkles,
  HeartHandshake,
  Check,
  CalendarDays,
  ExternalLink,
  Layers
} from 'lucide-react';
import {
  Order,
  Product,
  CustomerUser,
  PlanDuration,
  MessageTemplate,
  ActionTemplateMapping,
  Invoice
} from '../types';
import {
  getActiveTemplate,
  renderTemplate,
  DOMAIN_OFFICIAL
} from '../utils/messageTemplates';
import { calculateExpirationDate, safeFormatDate } from '../utils/formatters';

interface AdminCalendarManagerProps {
  orders: Order[];
  products: Product[];
  customers: CustomerUser[];
  bcvRate: number;
  templates: MessageTemplate[];
  actionMapping?: ActionTemplateMapping;
  onRenewOrder?: (orderId: string, duration: PlanDuration, newExpirationDate: string) => void;
  invoices?: Invoice[];
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const AdminCalendarManager: React.FC<AdminCalendarManagerProps> = ({
  orders,
  products,
  customers,
  bcvRate,
  templates,
  actionMapping,
  onRenewOrder,
  invoices = []
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [quickFilter, setQuickFilter] = useState<
    'selected_day' | 'today' | 'this_week' | 'month' | 'overdue'
  >('selected_day');
  const [typeFilter, setTypeFilter] = useState<'all' | 'memberships' | 'installments'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Google Calendar Bidirectional State
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);

  // Manual Google Calendar Event Creation Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvtSummary, setNewEvtSummary] = useState('');
  const [newEvtDescription, setNewEvtDescription] = useState('');
  const [newEvtDate, setNewEvtDate] = useState(todayStr);
  const [newEvtLoading, setNewEvtLoading] = useState(false);
  const [newEvtSuccess, setNewEvtSuccess] = useState(false);

  const loadGoogleEvents = async (forceAuth = false) => {
    setGoogleLoading(true);
    setGoogleSyncMsg(null);
    try {
      let token = getAccessToken();
      if (!token && forceAuth) {
        setGoogleSyncMsg('Abriendo ventana de inicio de sesión con Google...');
        const res = await signInWithGoogleIdentity();
        token = res?.accessToken || null;
      }
      if (!token) {
        setGoogleEvents([]);
        setGoogleSyncMsg('Google Calendar no conectado. Haz clic en "Sincronizar Nube" para vincular tu cuenta.');
        return;
      }
      const events = await fetchCalendarEvents();
      // If token became invalid during request, inform cleanly
      if (!getAccessToken()) {
        setGoogleEvents([]);
        setGoogleSyncMsg('La sesión de Google ha expirado. Por favor, haz clic en "Sincronizar Nube" para volver a conectar tu cuenta.');
        return;
      }
      setGoogleEvents(events);
      setGoogleSyncMsg(`Sincronizado: ${events.length} eventos de Google Calendar cargados con éxito.`);
    } catch (err: any) {
      setGoogleSyncMsg(err?.message || 'Error de conexión con Google Calendar.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      loadGoogleEvents(false);
    } else {
      setGoogleSyncMsg('Google Calendar no conectado. Haz clic en "Sincronizar Nube" para vincular tu cuenta y ver tus eventos.');
    }
  }, []);

  const handleCreateGoogleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvtSummary.trim() || !newEvtDate) return;
    setNewEvtLoading(true);
    setNewEvtSuccess(false);

    try {
      await syncEventToCalendar({
        summary: newEvtSummary,
        description: newEvtDescription,
        start: newEvtDate,
        end: newEvtDate
      });
      setNewEvtSuccess(true);
      setNewEvtSummary('');
      setNewEvtDescription('');
      setTimeout(() => {
        setNewEvtSuccess(false);
        setShowCreateForm(false);
      }, 1500);
      // Reload bidirectionally in real-time!
      loadGoogleEvents();
    } catch (err: any) {
      alert(err.message || 'Error al crear evento en Google Calendar');
    } finally {
      setNewEvtLoading(false);
    }
  };

  const mappedGoogleEvents = useMemo(() => {
    return googleEvents.map((evt) => {
      let dateStr = evt.start?.date || '';
      if (!dateStr && evt.start?.dateTime) {
        dateStr = evt.start.dateTime.split('T')[0];
      }
      if (!dateStr) return null;

      const dateObj = new Date(dateStr + 'T12:00:00');
      const todayTime = new Date(todayStr + 'T12:00:00').getTime();
      const expTime = dateObj.getTime();
      const diffDays = isNaN(expTime) || isNaN(todayTime)
        ? 0
        : Math.ceil((expTime - todayTime) / (1000 * 60 * 60 * 24));

      const isOverdue = diffDays < 0;
      const isToday = diffDays === 0;
      const isNear = diffDays > 0 && diffDays <= 3;

      return {
        id: evt.id,
        summary: evt.summary || 'Evento sin título',
        description: evt.description || '',
        expDateStr: dateStr,
        diffDays,
        isOverdue,
        isToday,
        isNear,
        htmlLink: evt.htmlLink,
        isGoogleEvent: true
      };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  }, [googleEvents, todayStr]);

  // Renew modal state
  const [renewOrder, setRenewOrder] = useState<Order | null>(null);
  const [renewDuration, setRenewDuration] = useState<PlanDuration>('1 mes');
  const [renewSuccess, setRenewSuccess] = useState(false);

  // Normalize order expiration info
  const ordersWithExpiry = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'rejected')
      .map((order) => {
        let expIso = order.credentials?.expirationDate;
        if (!expIso && order.creditDueDate) {
          expIso = `${order.creditDueDate}T12:00:00.000Z`;
        }
        if (!expIso) {
          // fallback 30 days from creation
          const d = new Date(order.createdAt || Date.now());
          if (isNaN(d.getTime())) {
            expIso = new Date().toISOString();
          } else {
            d.setDate(d.getDate() + 30);
            expIso = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          }
        }

        const dateObj = new Date(expIso);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : todayStr;

        const customer = customers.find(
          (c) =>
            c.id === order.customerId ||
            c.email.toLowerCase() === order.customerEmail.toLowerCase()
        );

        const expTime = new Date(dateStr + 'T12:00:00').getTime();
        const todayTime = new Date(todayStr + 'T12:00:00').getTime();
        const diffDays = isNaN(expTime) || isNaN(todayTime)
          ? 0
          : Math.ceil((expTime - todayTime) / (1000 * 60 * 60 * 24));

        const isOverdue = diffDays < 0;
        const isToday = diffDays === 0;
        const isNear = diffDays > 0 && diffDays <= 3;

        return {
          order,
          expDateStr: dateStr,
          diffDays,
          isOverdue,
          isToday,
          isNear,
          isSenior: order.isSeniorCitizen || customer?.isSeniorCitizen,
          isTrust: order.isTrustClient || customer?.isTrustClient
        };
      });
  }, [orders, customers, todayStr]);

  // Combine orders with pending invoices for the calendar
  const calendarItems = useMemo(() => {
    const items = [...ordersWithExpiry];

    // Add pending invoices that are not already linked to a displayed order
    // Or just show all pending invoices as "Cobros Pendientes"
    invoices.forEach((inv) => {
      if (inv.paymentStatus === 'pending' && inv.dueDate) {
        const dateObj = new Date(inv.dueDate);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toISOString().split('T')[0]
          : todayStr;

        const expTime = new Date(dateStr + 'T12:00:00').getTime();
        const todayTime = new Date(todayStr + 'T12:00:00').getTime();
        const diffDays = isNaN(expTime) || isNaN(todayTime)
          ? 0
          : Math.ceil((expTime - todayTime) / (1000 * 60 * 60 * 24));

        items.push({
          invoice: inv,
          expDateStr: dateStr,
          diffDays,
          isOverdue: diffDays < 0,
          isToday: diffDays === 0,
          isNear: diffDays > 0 && diffDays <= 3,
          isSenior: false,
          isTrust: false,
          isInvoice: true
        } as any);
      }
    });

    return items;
  }, [ordersWithExpiry, invoices, todayStr]);

  // Expiration count map by YYYY-MM-DD
  const expiryCountMap = useMemo(() => {
    const map: Record<string, { total: number; overdue: number; today: number; near: number; googleCount: number }> = {};
    
    // Add local items (orders and invoices)
    for (const item of calendarItems) {
      if (!map[item.expDateStr]) {
        map[item.expDateStr] = { total: 0, overdue: 0, today: 0, near: 0, googleCount: 0 };
      }
      map[item.expDateStr].total += 1;
      if (item.isOverdue) map[item.expDateStr].overdue += 1;
      if (item.isToday) map[item.expDateStr].today += 1;
      if (item.isNear) map[item.expDateStr].near += 1;
    }
    
    // Add Google Calendar events
    for (const item of mappedGoogleEvents) {
      if (!map[item.expDateStr]) {
        map[item.expDateStr] = { total: 0, overdue: 0, today: 0, near: 0, googleCount: 0 };
      }
      map[item.expDateStr].total += 1;
      map[item.expDateStr].googleCount += 1;
      if (item.isOverdue) map[item.expDateStr].overdue += 1;
      if (item.isToday) map[item.expDateStr].today += 1;
      if (item.isNear) map[item.expDateStr].near += 1;
    }
    
    return map;
  }, [ordersWithExpiry, mappedGoogleEvents]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday-based indexing: Sunday is 7
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      counts?: { total: number; overdue: number; today: number; near: number };
    }> = [];

    // Empty cells before month start
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        dayNumber: 0,
        dateStr: '',
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        counts: expiryCountMap[dateStr]
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr, expiryCountMap]);

  // Filtered orders list for the right column
  // Combined list of items shown on the selected day / filtered list (including Google Calendar events!)
  const filteredList = useMemo(() => {
    // Local events matching criteria
    const localFiltered = calendarItems.filter((item: any) => {
      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          (item.order?.customerName || item.invoice?.customerName || '').toLowerCase().includes(query) ||
          (item.order?.customerPhone || item.invoice?.customerPhone || '').includes(query) ||
          (item.order?.productName || item.invoice?.items?.[0]?.description || '').toLowerCase().includes(query) ||
          (item.order?.id || item.invoice?.id || '').toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Quick filter
      if (typeFilter === 'installments') {
        const isInst = item.order?.paymentCondition === 'cuotas' || Boolean(item.order?.installmentPlan) || item.isInvoice;
        if (!isInst) return false;
      }
      if (typeFilter === 'memberships') {
        const isInst = item.order?.paymentCondition === 'cuotas' || Boolean(item.order?.installmentPlan) || item.isInvoice;
        if (isInst) return false;
      }

      if (quickFilter === 'selected_day') {
        return item.expDateStr === selectedDateStr;
      }
      if (quickFilter === 'today') {
        return item.isToday;
      }
      if (quickFilter === 'this_week') {
        return item.diffDays >= 0 && item.diffDays <= 7;
      }
      if (quickFilter === 'overdue') {
        return item.isOverdue;
      }
      if (quickFilter === 'month') {
        const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        return item.expDateStr.startsWith(prefix);
      }
      return true;
    });

    // Google Calendar events matching criteria
    const googleFiltered = mappedGoogleEvents.filter((item) => {
      if (typeFilter === 'installments' || typeFilter === 'memberships') {
        // generic Google events are general, so they only show under 'all'
        return false;
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          item.summary.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);
        if (!matches) return false;
      }

      if (quickFilter === 'selected_day') {
        return item.expDateStr === selectedDateStr;
      }
      if (quickFilter === 'today') {
        return item.isToday;
      }
      if (quickFilter === 'this_week') {
        return item.diffDays >= 0 && item.diffDays <= 7;
      }
      if (quickFilter === 'overdue') {
        return item.isOverdue;
      }
      if (quickFilter === 'month') {
        const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        return item.expDateStr.startsWith(prefix);
      }
      return true;
    });

    // Merge them: Google events are marked as isGoogleEvent: true
    return [
      ...localFiltered.map(l => ({ ...l, isGoogleEvent: false })),
      ...googleFiltered.map(g => ({ ...g, isGoogleEvent: true }))
    ];
  }, [calendarItems, mappedGoogleEvents, quickFilter, typeFilter, selectedDateStr, currentYear, currentMonth, searchQuery]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
    setQuickFilter('selected_day');
  };

  // Monthly KPIs
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthOrders = calendarItems.filter((i: any) => i.expDateStr.startsWith(currentMonthPrefix));
  const monthTotalUsd = monthOrders.reduce((sum, i: any) => sum + (i.order?.total || i.invoice?.totalUsd || 0), 0);
  const monthTotalBs = monthTotalUsd * bcvRate;
  const overdueTotal = calendarItems.filter((i: any) => i.isOverdue).length;
  const todayTotal = calendarItems.filter((i: any) => i.isToday).length;

  // WhatsApp Expiration Reminder Trigger
  const handleSendReminderWhatsApp = (item: any) => {
    const activeTemplate = getActiveTemplate('aviso_vencimiento', templates, actionMapping);
    const total = item.order?.total || item.invoice?.totalUsd || 0;
    const bsEquiv = (total * bcvRate).toFixed(2);
    const dateFormatted = safeFormatDate(
      item.expDateStr ? item.expDateStr + 'T12:00:00' : null,
      { day: 'numeric', month: 'long', year: 'numeric' },
      item.expDateStr || 'Fecha estimada'
    );

    const message = renderTemplate(activeTemplate.content, {
      cliente: item.order?.customerName || item.invoice?.customerName || '',
      servicio: item.order?.productName || item.invoice?.items?.[0]?.description || 'Servicio',
      fecha_vencimiento: dateFormatted,
      monto_renovacion_usd: total.toFixed(2),
      monto_renovacion_bs: bsEquiv,
      tasa_bcv: bcvRate.toFixed(2),
      dominio: DOMAIN_OFFICIAL
    });

    const phoneRaw = item.order?.customerPhone || item.invoice?.customerPhone || '';
    const cleanPhone = phoneRaw.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Renewal Handler
  const handleConfirmRenew = () => {
    if (!renewOrder || !onRenewOrder) return;
    const baseDateIso = renewOrder.credentials?.expirationDate || new Date().toISOString();
    const newExpDateIso = calculateExpirationDate(baseDateIso, renewDuration);

    onRenewOrder(renewOrder.id, renewDuration, newExpDateIso);
    setRenewSuccess(true);

    // Sincronización bidireccional en tiempo real al renovar
    try {
      const expShort = newExpDateIso.split('T')[0];
      syncEventToCalendar({
        summary: `Vencimiento: ${renewOrder.productName} - ${renewOrder.customerName}`,
        description: `Cliente: ${renewOrder.customerName}\nTeléfono: ${renewOrder.customerPhone}\nServicio: ${renewOrder.productName}\nRenovado por: ${renewDuration}\nSoporte: 04241983648`,
        start: expShort,
        end: expShort
      }).then(() => {
        loadGoogleEvents(); // recargar automáticamente en tiempo real
      }).catch(err => {
        console.warn('Google Calendar push failed during renewal:', err);
      });
    } catch (err) {
      console.warn('Real-time Google Calendar renewal sync warning:', err);
    }

    setTimeout(() => {
      setRenewSuccess(false);
      setRenewOrder(null);
    }, 1500);
  };

  const handleSyncGoogleCalendar = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Streaming Pro//Admin Calendar//ES\n";
    calendarItems.forEach((ord: any) => {
      const dateStr = ord.expDateStr.replace(/-/g, '');
      const summary = ord.isInvoice 
        ? `Cobro Factura: ${ord.invoice.invoiceNumber} (${ord.invoice.customerName})`
        : `Vencimiento: ${ord.order.productName} (${ord.order.customerName})`;
      
      const description = ord.isInvoice
        ? `Factura: ${ord.invoice.invoiceNumber}\\nCliente: ${ord.invoice.customerName}\\nMonto: $${ord.invoice.totalUsd}\\nSoporte: 04241983648`
        : `Cliente: ${ord.order.customerName} - Tel: ${ord.order.customerPhone} - Servicio: ${ord.order.productName}\\nSoporte: 04241983648`;

      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:${summary}\n`;
      icsContent += `DESCRIPTION:${description}\n`;
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
      icsContent += `DTEND;VALUE=DATE:${dateStr}\n`;
      icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vencimientos_streaming_google_calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Monthly KPIs */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agenda Ejecutiva de Vencimientos</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Calendario Mensual & Control de Renovaciones
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Monitorea los cortes diarios de tus clientes, envía recordatorios de renovación por WhatsApp en 1 clic y extiende sus suscripciones sin demoras.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Sincronización en tiempo real Bidireccional */}
            <button
              type="button"
              onClick={() => loadGoogleEvents(true)}
              disabled={googleLoading}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5 ${
                googleLoading ? 'bg-indigo-800' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
              title="Sincronizar y consultar eventos de Google Calendar en tiempo real"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-200 ${googleLoading ? 'animate-spin' : ''}`} />
              <span>{googleLoading ? 'Sincronizando...' : 'Sincronizar Nube'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncGoogleCalendar}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Exportar archivo .ics para importar manualmente offline"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Exportar .ics</span>
            </button>

            <button
              type="button"
              onClick={handleGoToday}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Ir a Hoy ({today.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })})</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Vencen Este Mes</span>
            <div className="text-xl font-extrabold text-white mt-0.5">
              {monthOrders.length} clientes
            </div>
            <span className="text-[10px] text-slate-400">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Proyección Renovación/Cobros ($)</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              ${monthTotalUsd.toFixed(2)} USD
            </div>
            <span className="text-[10px] text-slate-400">Total a facturar/cobrar</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Equivalente BCV</span>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-0.5">
              Bs. {monthTotalBs.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400">Tasa: {bcvRate.toFixed(2)} Bs/USD</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block font-medium">Alertas Críticas</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-extrabold text-rose-400">{overdueTotal} vencidos</span>
              <span className="text-xs text-amber-400 font-bold">({todayTotal} hoy)</span>
            </div>
            <span className="text-[10px] text-slate-400">Requieren contacto</span>
          </div>
        </div>
      </div>

      {/* Google Calendar Real-Time Status Alert Banner */}
      {googleSyncMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-fadeIn ${
          googleSyncMsg.includes('Error') 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : googleSyncMsg.includes('Sincronizado')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              googleSyncMsg.includes('Error') 
                ? 'bg-rose-500 animate-ping' 
                : googleSyncMsg.includes('Sincronizado')
                ? 'bg-emerald-500'
                : 'bg-amber-500 animate-pulse'
            }`} />
            <span>{googleSyncMsg}</span>
          </div>
          {!googleSyncMsg.includes('Sincronizado') && (
            <button
              type="button"
              onClick={() => loadGoogleEvents(true)}
              className="text-[10px] text-indigo-700 hover:text-indigo-900 font-extrabold underline cursor-pointer"
            >
              Intentar Sincronizar Ahora
            </button>
          )}
        </div>
      )}

      {/* DUAL VIEW CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: MONTHLY GRAPHICAL CALENDAR (7 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Calendar Month Navigation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
                <span className="text-[11px] text-slate-400 block">
                  Haz clic en un día para ver los clientes que vencen
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-[11px] uppercase tracking-wider">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 border border-transparent"
                  />
                );
              }

              const isSelected = cell.dateStr === selectedDateStr && quickFilter === 'selected_day';
              const hasEvents = cell.counts && cell.counts.total > 0;
              const hasOverdue = cell.counts && cell.counts.overdue > 0;
              const hasNear = cell.counts && (cell.counts.today > 0 || cell.counts.near > 0);

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDateStr(cell.dateStr);
                    setQuickFilter('selected_day');
                  }}
                  className={`h-16 sm:h-20 p-1.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-300'
                      : cell.isToday
                      ? 'bg-amber-50/70 border-amber-300'
                      : hasEvents
                      ? 'bg-white hover:bg-slate-50 border-slate-200'
                      : 'bg-white/60 hover:bg-slate-50/80 border-slate-100'
                  }`}
                >
                  {/* Top: Day Number and "Hoy" tag */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-extrabold ${
                        isSelected
                          ? 'text-indigo-900'
                          : cell.isToday
                          ? 'text-amber-700'
                          : 'text-slate-800'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="text-[9px] font-extrabold bg-amber-500 text-slate-950 px-1 py-0.2 rounded-md">
                        Hoy
                      </span>
                    )}
                  </div>

                  {/* Bottom: Event count indicator badge */}
                  {hasEvents ? (
                    <div className="w-full">
                      <div
                        className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center justify-between truncate ${
                          hasOverdue
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : hasNear
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        <span className="truncate">{cell.counts?.total} vence{cell.counts?.total === 1 ? '' : 'n'}</span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            hasOverdue
                              ? 'bg-rose-600 animate-ping'
                              : hasNear
                              ? 'bg-amber-600'
                              : 'bg-indigo-600'
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-300 group-hover:text-slate-400">
                      -
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Vencidos</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Hoy / Próx. 3 días</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Próximos cortes</span>
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: DAILY LIST & AGENDA ACTIONS (5 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Header & Quick Filter Pills */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span>Lista de Vencimientos</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {filteredList.length}
                  </span>
                </h3>
                <p className="text-slate-400 text-xs">
                  {quickFilter === 'selected_day'
                    ? `Cortes del ${safeFormatDate(
                        selectedDateStr ? selectedDateStr + 'T12:00:00' : null,
                        {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        },
                        selectedDateStr
                      )}`
                    : quickFilter === 'today'
                    ? 'Cortes que vencen HOY'
                    : quickFilter === 'this_week'
                    ? 'Cortes de los próximos 7 días'
                    : quickFilter === 'overdue'
                    ? 'Cuentas con plazo vencido sin renovar'
                    : `Cortes de todo el mes de ${MONTH_NAMES[currentMonth]}`}
                </p>
              </div>

              {/* Text Search */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
              <button
                type="button"
                onClick={() => setQuickFilter('selected_day')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'selected_day'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📅 Día Seleccionado
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('today')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'today'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🚨 Hoy ({todayTotal})
              </button>

              <button
                type="button"
                onClick={() => setQuickFilter('this_week')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'this_week'
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📆 7 Días
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'overdue'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ⚠️ Vencidos ({overdueTotal})
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('month')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  quickFilter === 'month'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📋 Todo el Mes ({monthOrders.length})
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="text-center py-14 text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No hay vencimientos programados para este filtro</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecciona otro día en el calendario de la izquierda o cambia el filtro superior.
                </p>
              </div>
            ) : (
              filteredList.map((item: any) => {
                if (item.isGoogleEvent) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 hover:border-indigo-300 hover:shadow-xs transition-all animate-fadeIn"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          {/* Event Summary & Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-slate-900 text-sm font-extrabold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                              {item.summary}
                            </strong>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-black border border-indigo-700 flex items-center gap-1 shadow-2xs">
                              <CalendarIcon className="w-3 h-3 text-white" />
                              <span>Google Calendar</span>
                            </span>
                          </div>

                          {/* Description */}
                          {item.description && (
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {item.description}
                            </p>
                          )}

                          {/* Date */}
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {safeFormatDate(
                                item.expDateStr ? item.expDateStr + 'T12:00:00' : null,
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                },
                                item.expDateStr || '-'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Relative Expiry */}
                        <div className="text-right shrink-0">
                          {item.isOverdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 block mb-1">
                              Pasado hace {Math.abs(item.diffDays)}d
                            </span>
                          ) : item.isToday ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-black block mb-1 animate-pulse">
                              ¡HOY!
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 block mb-1">
                              En {item.diffDays} días
                            </span>
                          )}
                          
                          {item.htmlLink && (
                            <a
                              href={item.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline inline-flex items-center gap-0.5 mt-1"
                            >
                              <span>Ver en Google</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.isInvoice) {
                  const invoice = item.invoice as Invoice;
                  const bsEquiv = (invoice.totalUsd * bcvRate).toFixed(2);
                  return (
                    <div
                      key={invoice.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.isOverdue
                          ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                          : item.isToday
                          ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300 ring-1 ring-amber-300/40'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-slate-900 text-sm font-extrabold">
                              {invoice.customerName}
                            </strong>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-600 text-white font-black border border-indigo-700 flex items-center gap-1 shadow-2xs">
                              <DollarSign className="w-3 h-3 text-white" />
                              <span>Cobro de Factura</span>
                            </span>
                          </div>
                          <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{invoice.customerPhone}</span>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[11px] font-bold text-slate-700">
                              Factura: {invoice.invoiceNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 italic">
                              Concepto: {invoice.items[0]?.description || 'Servicio'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-extrabold text-amber-700 text-xs">
                            ${invoice.totalUsd.toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Bs. {bsEquiv}
                          </div>
                          <div className="mt-2">
                            {item.isOverdue ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Vencido
                              </span>
                            ) : item.isToday ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                                Hoy
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                const localItem = item as {
                  order: Order;
                  expDateStr: string;
                  diffDays: number;
                  isOverdue: boolean;
                  isToday: boolean;
                  isNear: boolean;
                  isSenior: boolean | undefined;
                  isTrust: boolean | undefined;
                };
                const bsEquiv = (localItem.order.total * bcvRate).toFixed(2);
                return (
                  <div
                    key={localItem.order.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      localItem.isOverdue
                        ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                        : localItem.isToday
                        ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300 ring-1 ring-amber-300/40'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {/* Customer Name & Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-slate-900 text-sm font-extrabold">
                            {localItem.order.customerName}
                          </strong>
                          {Boolean(localItem.order.paymentCondition === 'cuotas' || localItem.order.installmentPlan) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black border border-amber-600 flex items-center gap-1 shadow-2xs">
                              <Layers className="w-3 h-3 text-slate-950" />
                              <span>Cobro de Cuota</span>
                            </span>
                          )}
                          {localItem.isSenior && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              👴 3era Edad
                            </span>
                          )}
                          {localItem.isTrust && !localItem.isSenior && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                              🤝 Confianza
                            </span>
                          )}
                        </div>

                        {/* Service & Expiration relative */}
                        <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-indigo-700">
                            {localItem.order.productName}
                          </span>
                          <span>• {localItem.order.accountType}</span>
                          <span>• {localItem.order.duration}</span>
                        </div>

                        {/* Phone & Date */}
                        <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{localItem.order.customerPhone}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {safeFormatDate(
                                localItem.expDateStr ? localItem.expDateStr + 'T12:00:00' : null,
                                {
                                  day: 'numeric',
                                  month: 'short'
                                },
                                localItem.expDateStr || '-'
                              )}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Expiration Status Pill & Price */}
                      <div className="text-right shrink-0">
                        {localItem.isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 block mb-1">
                            Vencido hace {Math.abs(localItem.diffDays)}d
                          </span>
                        ) : localItem.isToday ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-black block mb-1 animate-pulse">
                            ¡VENCE HOY!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 block mb-1">
                            En {localItem.diffDays} días
                          </span>
                        )}

                        <div className="font-mono font-extrabold text-slate-900 text-xs">
                          ${localItem.order.total.toFixed(2)} USD
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          Bs. {bsEquiv} (BCV)
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions: WhatsApp & Renew */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendReminderWhatsApp(localItem)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Enviar recordatorio de renovación por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Avisar WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRenewOrder(localItem.order)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        title="Renovar suscripción y extender fecha"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Renovar +1 Mes</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {/* Formulario para Crear Evento Directo en Google Calendar */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <span>➕ Agregar Recordatorio en Google Calendar</span>
                </button>
              ) : (
                <form onSubmit={handleCreateGoogleEventSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-slideInRight">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Nuevo Recordatorio (Google Calendar)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Título del Evento:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Corte Netflix de Pedro, Revisión de Pago"
                      value={newEvtSummary}
                      onChange={(e) => setNewEvtSummary(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Descripción / Notas:</label>
                    <textarea
                      placeholder="Ej. Teléfono: 04241983648, Cuenta: pedro@gmail.com"
                      value={newEvtDescription}
                      onChange={(e) => setNewEvtDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Fecha de Ejecución:</label>
                    <input
                      type="date"
                      required
                      value={newEvtDate}
                      onChange={(e) => setNewEvtDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-mono"
                    />
                  </div>

                  {newEvtSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[10px] text-center">
                      ¡Creado en Google Calendar con éxito!
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-bold text-[10px] hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={newEvtLoading}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-sm disabled:bg-indigo-800"
                    >
                      {newEvtLoading ? 'Guardando...' : 'Crear Evento'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RENEW MODAL */}
      {renewOrder && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Renovar Suscripción</h3>
              </div>
              <button
                type="button"
                onClick={() => setRenewOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-600 text-xs">
              Extender la suscripción de <strong>{renewOrder.customerName}</strong> para el servicio{' '}
              <strong>{renewOrder.productName}</strong>.
            </p>

            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-indigo-950">
                <span>Monto a Cobrar:</span>
                <span className="font-mono text-sm">${renewOrder.total.toFixed(2)} USD</span>
              </div>
              <div className="flex items-center justify-between text-indigo-800 text-[11px]">
                <span>Equivalente BCV:</span>
                <span className="font-mono">Bs. {(renewOrder.total * bcvRate).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Período a Extender:
              </label>
              <select
                value={renewDuration}
                onChange={(e) => setRenewDuration(e.target.value as PlanDuration)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs"
              >
                <option value="1 mes">1 mes adicional</option>
                <option value="3 meses">3 meses adicionales</option>
                <option value="6 meses">6 meses adicionales</option>
                <option value="12 meses">12 meses adicionales</option>
              </select>
            </div>

            {renewSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>¡Suscripción renovada con éxito!</span>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRenewOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRenew}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Confirmar Renovación</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
