import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Calendar,
  DollarSign,
  CreditCard,
  User,
  Tag,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowUpRight,
  PieChart as PieIcon,
  Receipt,
  Layers,
  ChevronDown,
  X
} from 'lucide-react';
import { ExpenseItem, ExpenseCategory, PaymentMethod } from '../types';
import { safeFormatDate } from '../utils/formatters';

interface AdminExpensesManagerProps {
  expenses: ExpenseItem[];
  onAddExpense: (expense: Omit<ExpenseItem, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod?: (method: PaymentMethod) => void;
  bcvRate: number;
}

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-servers', name: 'Alquiler de Servidores / Proxies / VPS' },
  { id: 'cat-wholesaler', name: 'Compra Mayorista de Cuentas / Proveedores' },
  { id: 'cat-ads', name: 'Publicidad & Marketing Digital (Meta / Google Ads)' },
  { id: 'cat-commissions', name: 'Comisiones Bancarias / Pasarelas de Pago' },
  { id: 'cat-salaries', name: 'Nómina / Sueldos de Operadores y Soporte' },
  { id: 'cat-internet', name: 'Servicios de Oficina, Internet & Electricidad' },
  { id: 'cat-domain', name: 'Dominios, Certificados SSL & Hosting Web' },
  { id: 'cat-hardware', name: 'Equipos, Dispositivos & Herramientas de Trabajo' },
  { id: 'cat-other', name: 'Otros Gastos Administrativos / Imprevistos' }
];

const STORAGE_CATEGORIES_KEY = 'gi_expense_categories_v1';

export const AdminExpensesManager: React.FC<AdminExpensesManagerProps> = ({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  paymentMethods,
  onAddPaymentMethod,
  bcvRate
}) => {
  // Categories state
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CATEGORIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL');

  // Modal create/edit expense
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState(categories[0]?.name || 'Otros');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<'USD' | 'BS'>('USD');
  const [formPayer, setFormPayer] = useState('Gregori Izquierdo (Admin)');
  const [formPaymentMethodId, setFormPaymentMethodId] = useState(paymentMethods[0]?.id || 'pm-default');
  const [formReference, setFormReference] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Quick add category inline modal
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Quick add payment method inline modal
  const [isNewMethodModalOpen, setIsNewMethodModalOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodType, setNewMethodType] = useState('Nacional (Bs)');
  const [newMethodAccount, setNewMethodAccount] = useState('');

  // Open modal for new expense
  const handleOpenNew = () => {
    setEditingExpense(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(categories[0]?.name || 'Otros');
    setFormDescription('');
    setFormAmount('');
    setFormCurrency('USD');
    setFormPayer('Gregori Izquierdo (Admin)');
    setFormPaymentMethodId(paymentMethods[0]?.id || '');
    setFormReference('');
    setFormVendor('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Open modal for editing expense
  const handleOpenEdit = (item: ExpenseItem) => {
    setEditingExpense(item);
    setFormDate(item.date);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormAmount(item.amount.toString());
    setFormCurrency(item.currency);
    setFormPayer(item.payer);
    setFormPaymentMethodId(item.paymentMethodId);
    setFormReference(item.referenceNumber || '');
    setFormVendor(item.supplierOrVendor || '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Handle Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseFloat(formAmount);
    if (isNaN(rawAmount) || rawAmount <= 0) {
      alert('Por favor introduce un monto numérico válido mayor a 0.');
      return;
    }

    const selectedPm = paymentMethods.find((p) => p.id === formPaymentMethodId);
    const pmName = selectedPm ? selectedPm.name : 'Método General';

    let amountUsd = rawAmount;
    let amountBs = Number((rawAmount * bcvRate).toFixed(2));

    if (formCurrency === 'BS') {
      amountBs = rawAmount;
      amountUsd = Number((rawAmount / (bcvRate > 0 ? bcvRate : 1)).toFixed(3));
    }

    if (editingExpense) {
      const updated: ExpenseItem = {
        ...editingExpense,
        date: formDate,
        category: formCategory,
        description: formDescription.trim() || 'Gasto Operativo',
        amount: rawAmount,
        currency: formCurrency,
        amountUsd,
        amountBs,
        payer: formPayer.trim() || 'Gregori Izquierdo',
        paymentMethodId: formPaymentMethodId,
        paymentMethodName: pmName,
        referenceNumber: formReference.trim() || undefined,
        supplierOrVendor: formVendor.trim() || undefined,
        notes: formNotes.trim() || undefined
      };
      onUpdateExpense(updated);
    } else {
      onAddExpense({
        date: formDate,
        category: formCategory,
        description: formDescription.trim() || 'Gasto Operativo',
        amount: rawAmount,
        currency: formCurrency,
        amountUsd,
        amountBs,
        payer: formPayer.trim() || 'Gregori Izquierdo',
        paymentMethodId: formPaymentMethodId,
        paymentMethodName: pmName,
        referenceNumber: formReference.trim() || undefined,
        supplierOrVendor: formVendor.trim() || undefined,
        notes: formNotes.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  // Save new category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const newCat: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName.trim(),
      isCustom: true
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(updated));
    setFormCategory(newCat.name);
    setNewCategoryName('');
    setIsNewCategoryModalOpen(false);
  };

  // Save new payment method
  const handleCreatePaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      name: newMethodName.trim(),
      shortName: newMethodName.trim().slice(0, 8),
      category: newMethodType.includes('Bs') ? 'venezuela' : 'internacional',
      holderName: 'Gregori Izquierdo',
      accountNumber: newMethodAccount.trim() || 'N/A',
      accountTypeLabel: 'Ahorro / Corriente',
      instructions: `Pago mediante ${newMethodName.trim()}`,
      active: true,
      acceptedCurrencies: newMethodType.includes('Bs') ? ['BS'] : ['USD', 'USDT']
    };

    if (onAddPaymentMethod) {
      onAddPaymentMethod(newMethod);
    }
    setFormPaymentMethodId(newMethod.id);
    setNewMethodName('');
    setNewMethodAccount('');
    setIsNewMethodModalOpen(false);
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.payer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.referenceNumber && item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.supplierOrVendor && item.supplierOrVendor.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategoryFilter === 'ALL' || item.category === selectedCategoryFilter;
      const matchesMonth = selectedMonthFilter === 'ALL' || item.date.startsWith(selectedMonthFilter);

      return matchesSearch && matchesCategory && matchesMonth;
    });
  }, [expenses, searchQuery, selectedCategoryFilter, selectedMonthFilter]);

  // Aggregate KPI Calculations
  const totalExpensesUsd = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (curr.amountUsd || 0), 0);
  }, [filteredExpenses]);

  const totalExpensesBs = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (curr.amountBs || 0), 0);
  }, [filteredExpenses]);

  // Breakdown by Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { totalUsd: number; count: number }> = {};
    filteredExpenses.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = { totalUsd: 0, count: 0 };
      }
      map[item.category].totalUsd += item.amountUsd;
      map[item.category].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].totalUsd - a[1].totalUsd);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-rose-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-600/30 text-rose-400 border border-rose-500/40 font-bold">
              <TrendingDown className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Control de Gastos & Egresos Operativos
            </h2>
          </div>
          <p className="text-rose-200/70 text-xs sm:text-sm mt-1 max-w-2xl">
            Registra cada desembolso en servidores, proveedores, marketing o sueldos. Correlaciona tus costos con las ventas y conciliación mensual para ver tu margen real neto.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Gasto</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs">
          <span className="text-[11px] font-bold text-rose-800 uppercase block mb-1">
            Total Egresos (USD)
          </span>
          <div className="text-2xl font-black text-rose-950 font-mono">
            ${totalExpensesUsd.toFixed(2)} USD
          </div>
          <span className="text-[11px] text-rose-700 font-medium mt-0.5 block">
            {filteredExpenses.length} desembolsos registrados
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
            Equivalente en Bolívares
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            Bs. {totalExpensesBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
            Tasa BCV: {bcvRate.toFixed(2)} Bs/USD
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
            Categoría Principal
          </span>
          <div className="text-base font-black text-slate-900 truncate">
            {categoryBreakdown[0] ? categoryBreakdown[0][0] : 'Sin gastos'}
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
            {categoryBreakdown[0] ? `$${categoryBreakdown[0][1].totalUsd.toFixed(2)} USD (${categoryBreakdown[0][1].count} reg)` : '-'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
              Categorías Activas
            </span>
            <div className="text-2xl font-black text-indigo-950 font-mono">
              {categories.length} Tipos
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Tipo de Gasto</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por concepto, proveedor, pagador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Dropdown Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="ALL">Todas las Categorías ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Month selector */}
          <input
            type="month"
            value={selectedMonthFilter === 'ALL' ? '' : selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value || 'ALL')}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-hidden"
            title="Filtrar por mes"
          />
          {selectedMonthFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedMonthFilter('ALL')}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded cursor-pointer"
            >
              Limpiar Mes
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase flex items-center gap-2">
            <span>Listado de Gastos Registrados</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
              {filteredExpenses.length}
            </span>
          </h4>
          <span className="text-[11px] text-slate-400">
            Valores computados con 2 y 3 decimales
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron gastos registrados</p>
            <p className="text-xs mt-1">Haz clic en "Registrar Nuevo Gasto" para agregar desembolsos operativos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo / Categoría</th>
                  <th className="py-3 px-4">Concepto & Beneficiario</th>
                  <th className="py-3 px-4">Pagador</th>
                  <th className="py-3 px-4">Método de Pago</th>
                  <th className="py-3 px-4 text-right">Monto USD</th>
                  <th className="py-3 px-4 text-right">Monto Bs</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {safeFormatDate(exp.date, undefined, exp.date)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block max-w-[180px] truncate">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{exp.description}</div>
                      {exp.supplierOrVendor && (
                        <div className="text-[10px] text-slate-500">
                          Proveedor: <strong>{exp.supplierOrVendor}</strong>
                        </div>
                      )}
                      {exp.notes && (
                        <div className="text-[10px] text-slate-400 italic line-clamp-1">
                          {exp.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exp.payer}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{exp.paymentMethodName}</div>
                      {exp.referenceNumber && (
                        <div className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-block">
                          Ref: {exp.referenceNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                      -${exp.amountUsd.toFixed(exp.amountUsd % 1 === 0 ? 2 : 3)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      Bs. {exp.amountBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Editar gasto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar el gasto "${exp.description}" de $${exp.amountUsd}?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Agregar / Editar Gasto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-white">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingExpense ? 'Editar Gasto / Egreso' : 'Registrar Nuevo Gasto'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Conciliación financiera y contabilidad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Fecha */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha del Gasto *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                {/* Moneda */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Moneda del Monto *</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as 'USD' | 'BS')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="USD">Dólares ($ USD)</option>
                    <option value="BS">Bolívares (Bs. Digital)</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Gasto Dropdown + Quick Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Tipo de Gasto (Categoría) *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryModalOpen(true)}
                    className="text-[11px] text-rose-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Crear nuevo tipo</span>
                  </button>
                </div>
                <select
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto / Descripción */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Concepto / Descripción *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de servidor VPN de Netflix, Publicidad Meta Ads de Octubre..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Monto (2 o 3 decimales) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Monto ({formCurrency}) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    required
                    placeholder="0.000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-black text-rose-700 text-sm"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Soporta 2 o 3 decimales</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quién Realizó el Gasto *</label>
                  <input
                    type="text"
                    required
                    value={formPayer}
                    onChange={(e) => setFormPayer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Método de Pago Dropdown + Quick Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Método de Pago Utilizado *</label>
                  <button
                    type="button"
                    onClick={() => setIsNewMethodModalOpen(true)}
                    className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar método de pago</span>
                  </button>
                </div>
                <select
                  required
                  value={formPaymentMethodId}
                  onChange={(e) => setFormPaymentMethodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name} {pm.accountNumber ? `(${pm.accountNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proveedor y Referencia */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proveedor / Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej: Hetzner, Meta, Distribuidor VIP"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nº Comprobante / Referencia</label>
                  <input
                    type="text"
                    placeholder="Ej: REF-98412"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles adicionales sobre la transacción..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md cursor-pointer"
                >
                  {editingExpense ? 'Actualizar Gasto' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nuevo Tipo de Gasto */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-rose-600" />
                <span>Crear Tipo de Gasto</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de la Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantenimiento de Software, Asesoría Legal..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Método de Pago Rápido */}
      {isNewMethodModalOpen && (
        <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Agregar Nuevo Método de Pago</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsNewMethodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePaymentMethod} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Método *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Efectivo USD Taquilla, Binance Pay USDT, Pago Móvil BNC..."
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipo de Método *</label>
                <select
                  value={newMethodType}
                  onChange={(e) => setNewMethodType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                >
                  <option value="Nacional (Bs)">Nacional (Bs. Digital / Pago Móvil)</option>
                  <option value="Internacional (USD)">Internacional ($ USD / Zelle / PayPal)</option>
                  <option value="Cripto (USDT)">Cripto (Binance USDT)</option>
                  <option value="Efectivo">Efectivo (Dólares o Bolívares en Mano)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cuenta / Teléfono / Datos</label>
                <input
                  type="text"
                  placeholder="Ej: 0414-1234567 / V-19876543 / Cuenta BNC"
                  value={newMethodAccount}
                  onChange={(e) => setNewMethodAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewMethodModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Crear Método
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
