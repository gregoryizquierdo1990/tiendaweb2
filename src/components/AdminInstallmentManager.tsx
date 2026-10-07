import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Percent,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Sliders,
  DollarSign,
  Users,
  Check,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Save,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Product, Order, PlanDuration, ServiceCategory } from '../types';
import { safeFormatDate } from '../utils/formatters';

interface AdminInstallmentManagerProps {
  products: Product[];
  orders: Order[];
  bcvRate: number;
  onUpdateProduct: (product: Product) => void;
  onUpdateProductsBulk?: (products: Product[]) => void;
  onUpdateOrder?: (updatedOrder: Order) => void;
}

export const AdminInstallmentManager: React.FC<AdminInstallmentManagerProps> = ({
  products,
  orders,
  bcvRate,
  onUpdateProduct,
  onUpdateProductsBulk,
  onUpdateOrder
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'tracking' | 'settings'>('catalog');

  // Search & Filters for Catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'todos'>('todos');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Bulk Edit Form State
  const [bulkAllowInstallments, setBulkAllowInstallments] = useState<boolean>(true);
  const [bulkRequireDownPayment, setBulkRequireDownPayment] = useState<boolean>(true);
  const [bulkDownPaymentPercent, setBulkDownPaymentPercent] = useState<number>(50);
  const [bulkNumberOfInstallments, setBulkNumberOfInstallments] = useState<number>(2);
  const [bulkInstallmentIntervalDays, setBulkInstallmentIntervalDays] = useState<number>(15);
  const [bulkSavedSuccess, setBulkSavedSuccess] = useState<boolean>(false);

  // Single Product Quick Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formAllowInstallments, setFormAllowInstallments] = useState<boolean>(false);
  const [formRequireDownPayment, setFormRequireDownPayment] = useState<boolean>(true);
  const [formDownPaymentPercent, setFormDownPaymentPercent] = useState<number>(50);
  const [formNumberOfInstallments, setFormNumberOfInstallments] = useState<number>(2);
  const [formInstallmentIntervalDays, setFormInstallmentIntervalDays] = useState<number>(15);
  const [singleSavedSuccess, setSingleSavedSuccess] = useState<boolean>(false);

  // Global Installment Settings State
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(3);
  const [lateFeePercent, setLateFeePercent] = useState<number>(5);
  const [autoReminderDays, setAutoReminderDays] = useState<number>(2);
  const [globalSettingsSaved, setGlobalSettingsSaved] = useState<boolean>(false);

  // Tracking Filters
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingFilterStatus, setTrackingFilterStatus] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');

  // Filter products for catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'todos' ? true : p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, catalogSearch]);

  // Filter orders with installment plans
  const installmentOrders = useMemo(() => {
    return orders.filter((o) => o.paymentCondition === 'cuotas' || Boolean(o.installmentPlan));
  }, [orders]);

  const filteredInstallmentOrders = useMemo(() => {
    return installmentOrders.filter((o) => {
      const matchSearch =
        o.customerName.toLowerCase().includes(trackingSearch.toLowerCase()) ||
        o.customerPhone.includes(trackingSearch) ||
        o.productName.toLowerCase().includes(trackingSearch.toLowerCase());

      if (!matchSearch) return false;

      const plan = o.installmentPlan;
      if (trackingFilterStatus === 'all') return true;
      if (trackingFilterStatus === 'completed') return plan?.status === 'completed';
      if (trackingFilterStatus === 'overdue') return plan?.status === 'overdue' || (plan?.nextDueDate ? new Date(plan.nextDueDate) < new Date() : false);
      if (trackingFilterStatus === 'active') return plan?.status === 'in_progress' || !plan?.status;

      return true;
    });
  }, [installmentOrders, trackingSearch, trackingFilterStatus]);

  // Open single product edit modal
  const handleOpenProductEdit = (product: Product) => {
    setEditingProduct(product);
    setFormAllowInstallments(product.allowInstallments ?? false);
    setFormRequireDownPayment(product.requireDownPayment ?? true);
    setFormDownPaymentPercent(product.downPaymentPercent ?? 50);
    setFormNumberOfInstallments(product.numberOfInstallments ?? 2);
    setFormInstallmentIntervalDays(product.installmentIntervalDays ?? 15);
  };

  // Save single product
  const handleSaveProductInstallments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const updated: Product = {
      ...editingProduct,
      allowInstallments: formAllowInstallments,
      requireDownPayment: formRequireDownPayment,
      downPaymentPercent: formDownPaymentPercent,
      numberOfInstallments: formNumberOfInstallments,
      installmentIntervalDays: formInstallmentIntervalDays
    };

    onUpdateProduct(updated);
    setSingleSavedSuccess(true);
    setTimeout(() => {
      setSingleSavedSuccess(false);
      setEditingProduct(null);
    }, 1200);
  };

  // Toggle selection for bulk actions
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  // Execute bulk update
  const handleApplyBulkInstallments = () => {
    if (selectedProductIds.length === 0) return;

    const updatedList = products.map((p) => {
      if (selectedProductIds.includes(p.id)) {
        return {
          ...p,
          allowInstallments: bulkAllowInstallments,
          requireDownPayment: bulkRequireDownPayment,
          downPaymentPercent: bulkDownPaymentPercent,
          numberOfInstallments: bulkNumberOfInstallments,
          installmentIntervalDays: bulkInstallmentIntervalDays
        };
      }
      return p;
    });

    if (onUpdateProductsBulk) {
      onUpdateProductsBulk(updatedList);
    } else {
      updatedList.forEach((prod) => {
        if (selectedProductIds.includes(prod.id)) {
          onUpdateProduct(prod);
        }
      });
    }

    setBulkSavedSuccess(true);
    setTimeout(() => {
      setBulkSavedSuccess(false);
    }, 2000);
  };

  // Send WhatsApp payment reminder for installments
  const handleSendInstallmentReminder = (order: Order) => {
    const plan = order.installmentPlan;
    const pendingAmountUsd = plan
      ? plan.totalAmountUsd - plan.downPaymentUsd * (plan.paidCount > 0 ? 1 : 0) - (plan.paidCount - 1) * plan.installmentAmountUsd
      : order.total * 0.5;
    const pendingAmountBs = (pendingAmountUsd * bcvRate).toFixed(2);

    const message = `Hola ${order.customerName}! 👋 Le recordamos que tiene una cuota pendiente para su servicio *${order.productName}*.\n\n` +
      `📌 *Monto a pagar:* $${pendingAmountUsd.toFixed(2)} USD (Bs. ${pendingAmountBs})\n` +
      `📅 *Fecha límite:* ${safeFormatDate(plan?.nextDueDate, undefined, 'Próxima cuota')}\n` +
      `🏦 *Tasa BCV:* Bs. ${bcvRate.toFixed(2)}\n\n` +
      `Por favor envíenos el comprobante de pago por este medio para mantener su servicio activo de inmediato. ¡Muchas gracias! ✨`;

    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('58') ? cleanPhone : `58${cleanPhone.replace(/^0/, '')}`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Register payment of an installment
  const handleRegisterInstallmentPayment = (order: Order) => {
    if (!order.installmentPlan || !onUpdateOrder) return;

    const currentPlan = order.installmentPlan;
    const newPaidCount = currentPlan.paidCount + 1;
    const isFullyPaid = newPaidCount >= currentPlan.numberOfInstallments;

    const nextDueDateObj = new Date();
    nextDueDateObj.setDate(nextDueDateObj.getDate() + currentPlan.intervalDays);

    const updatedOrder: Order = {
      ...order,
      installmentPlan: {
        ...currentPlan,
        paidCount: newPaidCount,
        status: isFullyPaid ? 'completed' : 'in_progress',
        nextDueDate: isFullyPaid ? undefined : nextDueDateObj.toISOString().split('T')[0]
      }
    };

    onUpdateOrder(updatedOrder);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl border border-indigo-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
              <span>Módulo de Ventas Fraccionadas & Financiamiento</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              Gestión Integral de Pago en Cuotas
            </h2>
            <p className="text-indigo-200/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Configura cuotas iniciales, número de pagos e intervalos para cualquier servicio de tu catálogo, aplica reglas masivas y lleva el control en tiempo real del cobro a tus clientes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-slate-800/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase text-indigo-300 font-bold tracking-wider block">Servicios Habilitados</span>
              <span className="text-xl font-extrabold text-amber-400">
                {products.filter((p) => p.allowInstallments).length} / {products.length}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-indigo-800/40 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/10 hover:bg-white/20 text-indigo-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Reglas por Servicio ({products.filter((p) => p.allowInstallments).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'tracking'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/10 hover:bg-white/20 text-indigo-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Control & Cobro de Clientes ({installmentOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/10 hover:bg-white/20 text-indigo-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Días de Gracia & Recargos</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOG CONFIGURATION & BULK APPLY */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Bulk Action Panel */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-indigo-200/60 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Aplicación Masiva de Reglas de Cuotas</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aplica la misma regla de financiamiento a múltiples servicios del catálogo simultáneamente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {selectedProductIds.length} seleccionados
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllProducts}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  {selectedProductIds.length === filteredProducts.length ? 'Deseleccionar Todos' : 'Seleccionar Visibles'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-white rounded-2xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">¿Permitir Cuotas?</label>
                <select
                  value={bulkAllowInstallments ? 'yes' : 'no'}
                  onChange={(e) => setBulkAllowInstallments(e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                >
                  <option value="yes">Sí, Permitir</option>
                  <option value="no">No (Solo Contado)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">Cuota Inicial %</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="90"
                    step="5"
                    value={bulkDownPaymentPercent}
                    onChange={(e) => setBulkDownPaymentPercent(Number(e.target.value))}
                    className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">N° de Cuotas</label>
                <select
                  value={bulkNumberOfInstallments}
                  onChange={(e) => setBulkNumberOfInstallments(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                >
                  <option value="2">2 Cuotas (50% + 50%)</option>
                  <option value="3">3 Cuotas</option>
                  <option value="4">4 Cuotas</option>
                  <option value="6">6 Cuotas</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">Días entre Cuotas</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={bulkInstallmentIntervalDays}
                  onChange={(e) => setBulkInstallmentIntervalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleApplyBulkInstallments}
                  disabled={selectedProductIds.length === 0}
                  className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Masivo</span>
                </button>
              </div>
            </div>

            {bulkSavedSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡Reglas de cuotas aplicadas con éxito a {selectedProductIds.length} servicios!</span>
              </div>
            )}
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar servicio para configurar..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
              {(['todos', 'series_peliculas', 'musica', 'deportes_tv', 'gaming_otros', 'combos'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'todos' ? 'Todos' : cat.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => {
              const hasInstallments = Boolean(prod.allowInstallments);
              const isSelected = selectedProductIds.includes(prod.id);

              return (
                <div
                  key={prod.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    hasInstallments
                      ? 'bg-white border-indigo-200 shadow-sm hover:border-indigo-400'
                      : 'bg-slate-50 border-slate-200 opacity-90'
                  } ${isSelected ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectProduct(prod.id)}
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{prod.brand}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{prod.name}</h4>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        hasInstallments
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {hasInstallments ? 'Cuotas Activas' : 'Solo Contado'}
                    </span>
                  </div>

                  {/* Pricing info */}
                  <div className="p-3 rounded-xl bg-slate-100/80 mb-3 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Precio 1 Mes:</span>
                      <span className="font-mono text-indigo-700">${prod.prices['1 mes']?.USD || 3.5} USD</span>
                    </div>

                    {hasInstallments ? (
                      <div className="pt-2 border-t border-slate-200 text-[11px] space-y-0.5 text-slate-600">
                        <div className="flex justify-between">
                          <span>Cuota Inicial ({prod.downPaymentPercent ?? 50}%):</span>
                          <span className="font-bold font-mono text-emerald-700">
                            ${(((prod.prices['1 mes']?.USD || 3.5) * (prod.downPaymentPercent ?? 50)) / 100).toFixed(2)} USD
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Esquema:</span>
                          <span className="font-bold text-slate-800">{prod.numberOfInstallments ?? 2} cuotas cada {prod.installmentIntervalDays ?? 15} días</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Este producto se vende únicamente de contado.
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => handleOpenProductEdit(prod)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configurar Cuotas de este Servicio</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER INSTALLMENT TRACKING & RECOVERY */}
      {activeTab === 'tracking' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o servicio..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filtrar:</span>
              {(['all', 'active', 'overdue', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTrackingFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    trackingFilterStatus === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'all' && 'Todos'}
                  {st === 'active' && 'En Curso'}
                  {st === 'overdue' && 'Vencidos / Mora'}
                  {st === 'completed' && 'Completados'}
                </button>
              ))}
            </div>
          </div>

          {filteredInstallmentOrders.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No hay registros de compras en cuotas</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Los clientes que realicen compras fraccionadas aparecerán en esta lista para su seguimiento de pagos y cobro por WhatsApp.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInstallmentOrders.map((ord) => {
                const plan = ord.installmentPlan;
                const paidCount = plan?.paidCount ?? 1;
                const totalCount = plan?.numberOfInstallments ?? 2;
                const nextDueDate = plan?.nextDueDate || ord.createdAt.split('T')[0];
                const isOverdue = plan?.status === 'overdue' || new Date(nextDueDate) < new Date();
                const isCompleted = plan?.status === 'completed' || paidCount >= totalCount;

                return (
                  <div
                    key={ord.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isOverdue
                        ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-300'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">#{ord.id}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {isCompleted ? 'Totalmente Pagado' : isOverdue ? 'Cuota En Mora' : 'Cuota Pendiente'}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-base mt-1">{ord.customerName}</h4>
                        <p className="text-xs text-slate-600">
                          Teléfono: <span className="font-semibold text-slate-800">{ord.customerPhone}</span> • Servicio:{' '}
                          <span className="font-bold text-indigo-700">{ord.productName}</span> ({ord.duration})
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Progreso de Cuotas</span>
                          <span className="text-lg font-black text-slate-900">
                            {paidCount} de {totalCount} cuotas
                          </span>
                          <span className="text-xs text-slate-500 block">
                            Próximo cobro: <strong className="text-slate-800">{nextDueDate}</strong>
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSendInstallmentReminder(ord)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Cobrar por WhatsApp</span>
                          </button>

                          {!isCompleted && onUpdateOrder && (
                            <button
                              type="button"
                              onClick={() => handleRegisterInstallmentPayment(ord)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 justify-center"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Marcar Cuota Pagada</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GLOBAL SETTINGS (GRACE PERIODS & LATE FEES) */}
      {activeTab === 'settings' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-3xl space-y-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              <span>Configuración Global de Políticas de Financiamiento</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Establece los días de tolerancia para cobros, automatización de recordatorios y penalización por cuotas vencidas.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Días de Gracia (Sin recargo tras vencimiento)
              </label>
              <input
                type="number"
                min="0"
                max="15"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tiempo de tolerancia antes de marcar la cuota como suspendida o en mora.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Recargo por Mora en Cuotas Vencidas (%)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="1"
                  value={lateFeePercent}
                  onChange={(e) => setLateFeePercent(Number(e.target.value))}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono"
                />
                <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">
                Aviso Automático de Recordatorio (Días Antes)
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={autoReminderDays}
                onChange={(e) => setAutoReminderDays(Number(e.target.value))}
                className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold font-mono"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setGlobalSettingsSaved(true);
                  setTimeout(() => setGlobalSettingsSaved(false), 2000);
                }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Políticas de Cuotas</span>
              </button>

              {globalSettingsSaved && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Políticas globales de financiamiento guardadas exitosamente!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PRODUCT EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{editingProduct.brand}</span>
                <h3 className="font-extrabold text-slate-900 text-base">{editingProduct.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductInstallments} className="space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="font-extrabold text-slate-900 block">Permitir Pago en Cuotas</label>
                  <p className="text-[11px] text-slate-500">Habilita compras fraccionadas en el checkout</p>
                </div>
                <input
                  type="checkbox"
                  checked={formAllowInstallments}
                  onChange={(e) => setFormAllowInstallments(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {formAllowInstallments && (
                <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">¿Requiere Cuota Inicial?</label>
                    <input
                      type="checkbox"
                      checked={formRequireDownPayment}
                      onChange={(e) => setFormRequireDownPayment(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                    />
                  </div>

                  {formRequireDownPayment && (
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Porcentaje Cuota Inicial (%)</label>
                      <input
                        type="number"
                        min="10"
                        max="90"
                        step="5"
                        value={formDownPaymentPercent}
                        onChange={(e) => setFormDownPaymentPercent(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Número de Cuotas Totales</label>
                    <select
                      value={formNumberOfInstallments}
                      onChange={(e) => setFormNumberOfInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value="2">2 Cuotas</option>
                      <option value="3">3 Cuotas</option>
                      <option value="4">4 Cuotas</option>
                      <option value="6">6 Cuotas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Días entre cada Cuota</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={formInstallmentIntervalDays}
                      onChange={(e) => setFormInstallmentIntervalDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Configuración</span>
                </button>
              </div>

              {singleSavedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-center text-xs">
                  ¡Configuración del producto guardada con éxito!
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
