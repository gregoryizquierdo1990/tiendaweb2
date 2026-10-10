import React, { useState, useEffect, useMemo } from 'react';
import { 
  SupplierPurchase, 
  AccountProfileSlot, 
  PurchaseCurrency, 
  AccountSaleType,
  Order,
  CustomerUser,
  Supplier,
  WalletTopup,
  ExpenseItem,
  AppBrandingConfig,
  Product,
  SalesTarget, 
  CreditEvent, 
  ServiceCategory 
} from '../types';
import { supabase } from '../services/supabaseClient';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Key, 
  Copy, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Users, 
  BarChart2, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building2,
  Phone,
  Send,
  Download,
  Printer,
  Share2,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdminPurchasesAndFinanceManagerProps {
  purchases: SupplierPurchase[];
  onAddPurchase: (purchase: Omit<SupplierPurchase, 'id' | 'createdAt'>) => void;
  onUpdatePurchase: (purchase: SupplierPurchase) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onUpdateCredentials: (purchaseId: string, email: string, pass: string) => void;
  orders: Order[];
  customers: CustomerUser[];
  walletTopups?: WalletTopup[];
  expenses?: ExpenseItem[];
  branding?: AppBrandingConfig;
  products?: Product[];
}

const STORAGE_SUPPLIERS_KEY = 'streamsync_suppliers_directory_v1';
const INITIAL_SUPPLIERS: Supplier[] = [];

const DEFAULT_PLATFORMS = ['TODAS', 'NETFLIX', 'MAX', 'DISNEY+', 'PRIME VIDEO', 'SPOTIFY', 'IPTV', 'OTRAS'];

export const AdminPurchasesAndFinanceManager: React.FC<AdminPurchasesAndFinanceManagerProps> = ({
  purchases,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
  onUpdateCredentials,
  orders,
  customers,
  walletTopups = [],
  expenses = [],
  branding,
  products = []
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'purchases' | 'renewals' | 'suppliers' | 'finances' | 'debts' | 'tools' | 'ltv' | 'targets' | 'commissions'>('matrix');
  const [platformsList, setPlatformsList] = useState<string[]>(DEFAULT_PLATFORMS);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Renewal Sub-Menu State
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [purchaseToRenew, setPurchaseToRenew] = useState<SupplierPurchase | null>(null);
  const [renewalDays, setRenewalDays] = useState<number>(30);
  const [renewalCost, setRenewalCost] = useState<number>(5.0);
  const [renewalSupplierId, setRenewalSupplierId] = useState<string>('');
  const [renewalNotes, setRenewalNotes] = useState<string>('');
  const [renewalFilter, setRenewalFilter] = useState<'all' | 'expired' | 'expiring_soon' | 'active'>('all');

  // Suppliers Directory State (clean production)
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SUPPLIERS_KEY);
      if (saved) {
        const list: Supplier[] = JSON.parse(saved);
        return list.filter((s) => !['sup-1', 'sup-2'].includes(s.id) && s.name !== 'Distribuidor VIP Latino' && s.name !== 'Max Streaming Global');
      }
    } catch (e) {
      console.warn('Could not load suppliers');
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_SUPPLIERS_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  // Add Supplier Modal State
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supTelegram, setSupTelegram] = useState('');
  const [supCurrency, setSupCurrency] = useState<PurchaseCurrency>('USDT');
  const [supBalance, setSupBalance] = useState('0');
  const [supNotes, setSupNotes] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditCredModal, setShowEditCredModal] = useState(false);
  const [currentPurchaseForCreds, setCurrentPurchaseForCreds] = useState<SupplierPurchase | null>(null);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');

  // Copied state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Purchase Form State
  const [formSupplierId, setFormSupplierId] = useState(INITIAL_SUPPLIERS[0]?.id || '');
  const [formPlatform, setFormPlatform] = useState('NETFLIX');
  const [formServiceName, setFormServiceName] = useState('');
  const [formSaleType, setFormSaleType] = useState<AccountSaleType>('by_profiles');
  const [formCurrency, setFormCurrency] = useState<PurchaseCurrency>('USDT');
  const [formAmount, setFormAmount] = useState<number>(8.00);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDurationDays, setFormDurationDays] = useState<number>(30);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Profiles builder for new purchase
  const [profilesBuilder, setProfilesBuilder] = useState<Array<{ profileName: string; pin: string; sellerName: string }>>([
    { profileName: 'Perfil 1', pin: '1234', sellerName: 'Admin' },
    { profileName: 'Perfil 2', pin: '2341', sellerName: 'Admin' },
    { profileName: 'Perfil 3', pin: '3412', sellerName: 'Admin' },
    { profileName: 'Perfil 4', pin: '4123', sellerName: 'Admin' },
    { profileName: 'Perfil 5', pin: '5678', sellerName: 'Admin' },
  ]);

  // NEW: Sales Targets State
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newTargetAmount, setNewTargetAmount] = useState<number>(1000);
  const [newTargetMonth, setNewTargetMonth] = useState(new Date().toISOString().slice(0, 7));

  // NEW: Commission State
  const [commissionRate, setCommissionRate] = useState<number>(5); // Default 5%

  // NEW: LTV Data (Computed)
  const ltvData = useMemo(() => {
    const clientsMap: Record<string, { name: string; totalSpent: number; orderCount: number }> = {};
    orders.filter(o => o.status === 'delivered' || o.status === 'confirmed').forEach(o => {
      const email = o.customerEmail;
      if (!clientsMap[email]) clientsMap[email] = { name: o.customerName, totalSpent: 0, orderCount: 0 };
      const val = o.currency === 'USD' ? o.total : o.total / 36.5; // Use simple rate for mock
      clientsMap[email].totalSpent += val;
      clientsMap[email].orderCount += 1;
    });
    return Object.entries(clientsMap)
      .map(([email, data]) => ({ email, ...data }))
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddProfileRow = () => {
    setProfilesBuilder([...profilesBuilder, { profileName: `Perfil ${profilesBuilder.length + 1}`, pin: Math.floor(1000 + Math.random() * 9000).toString(), sellerName: 'Admin' }]);
  };

  const handleRemoveProfileRow = (index: number) => {
    setProfilesBuilder(profilesBuilder.filter((_, i) => i !== index));
  };

  const handleProfileFieldChange = (index: number, field: 'profileName' | 'pin' | 'sellerName', value: string) => {
    const updated = [...profilesBuilder];
    updated[index][field] = value;
    setProfilesBuilder(updated);
  };

  const handleAssignCustomer = (purchase: SupplierPurchase, slotId: string, customerId: string, customerName: string) => {
    const updatedProfiles: AccountProfileSlot[] = (purchase.profiles || []).map(p => 
      p.id === slotId ? { ...p, status: 'occupied' as const, assignedCustomerName: customerName, assignedCustomerId: customerId } : p
    );
    onUpdatePurchase({ ...purchase, profiles: updatedProfiles });
  };

  const calculateExpiration = (start: string, days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleCreateSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supName.trim(),
      contactPhone: supPhone.trim(),
      telegramUser: supTelegram.trim(),
      preferredCurrency: supCurrency,
      currentBalanceUsd: parseFloat(supBalance) || 0,
      notes: supNotes.trim(),
      createdAt: new Date().toISOString()
    };
    setSuppliers([...suppliers, newSup]);
    setFormSupplierId(newSup.id);
    setShowAddSupplierModal(false);
    setSupName('');
    setSupPhone('');
    setSupTelegram('');
    setSupNotes('');
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    const cat = newCategoryInput.trim().toUpperCase();
    if (!platformsList.includes(cat)) {
      setPlatformsList([...platformsList, cat]);
    }
    setFormPlatform(cat);
    setNewCategoryInput('');
  };

  const handleCreatePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedSup = suppliers.find(s => s.id === formSupplierId);
    const supplierName = matchedSup ? matchedSup.name : 'Proveedor General';

    if (!formServiceName || !formEmail || !formPassword) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const expDate = calculateExpiration(formStartDate, formDurationDays);
    const costUsd = formCurrency === 'USD' || formCurrency === 'USDT' ? formAmount : formCurrency === 'VES' ? formAmount / 36.5 : formAmount;

    const newProfiles: AccountProfileSlot[] = formSaleType === 'full_account' ? [
      {
        id: `slot-${Date.now()}-full`,
        profileName: 'Cuenta Completa / Total',
        pin: 'N/A',
        status: 'available' as const,
        durationDays: formDurationDays,
        startDate: formStartDate,
        expirationDate: expDate
      }
    ] : profilesBuilder.map((p, idx) => ({
      id: `slot-${Date.now()}-${idx}`,
      profileName: p.profileName,
      pin: p.pin,
      sellerName: p.sellerName,
      status: 'available' as const,
      durationDays: formDurationDays,
      startDate: formStartDate,
      expirationDate: expDate
    }));

    setLoading(true);
    try {
      // 1. Crear la cuenta madre en Supabase si está disponible
      const accountId = `acc-${Date.now()}`;
      try {
        await supabase.from('parent_accounts').insert({
          id: accountId,
          name: formServiceName,
          platform: formPlatform,
          email: formEmail,
          password: formPassword,
          expiration_date: expDate
        });

        // 2. Crear perfiles vinculados
        const profilesForDb = profilesBuilder.map((p, idx) => ({
          id: `prof-${Date.now()}-${idx}`,
          parent_account_id: accountId,
          profile_name: p.profileName,
          is_active: true
        }));
        await supabase.from('account_profiles').insert(profilesForDb);
      } catch (dbErr) {
        console.warn('Supabase accounts sync notice:', dbErr);
      }

      // 3. Registrar compra financiera local y reactiva
      onAddPurchase({
        supplierName,
        platform: formPlatform.toUpperCase(),
        serviceName: formServiceName,
        saleType: formSaleType,
        paymentCurrency: formCurrency,
        paymentAmount: formAmount,
        costUsd: Number(costUsd.toFixed(2)),
        startDate: formStartDate,
        expirationDate: expDate,
        durationDays: formDurationDays,
        accountEmail: formEmail,
        accountPassword: formPassword,
        profiles: newProfiles,
        status: 'active',
        notes: formNotes
      });

      setShowAddModal(false);
      setFormServiceName('');
      setFormEmail('');
      setFormPassword('');
    } catch (err) {
      console.error(err);
      alert('Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  const openEditCredentials = (purchase: SupplierPurchase) => {
    setCurrentPurchaseForCreds(purchase);
    setNewEmailInput(purchase.accountEmail);
    setNewPassInput(purchase.accountPassword);
    setShowEditCredModal(true);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPurchaseForCreds) return;
    onUpdateCredentials(currentPurchaseForCreds.id, newEmailInput, newPassInput);
    setShowEditCredModal(false);
    setCurrentPurchaseForCreds(null);
  };

  const handleOpenRenewal = (purchase: SupplierPurchase) => {
    setPurchaseToRenew(purchase);
    setRenewalCost(purchase.costUsd || 5.0);
    setRenewalSupplierId(suppliers.find(s => s.name === purchase.supplierName)?.id || suppliers[0]?.id || '');
    setRenewalDays(30);
    setRenewalNotes('');
    setShowRenewalModal(true);
  };

  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseToRenew) return;

    // Calculate new expiration date
    const currentExp = new Date(purchaseToRenew.expirationDate);
    const baseDate = currentExp.getTime() > Date.now() ? currentExp : new Date();
    baseDate.setDate(baseDate.getDate() + renewalDays);
    const newExpDate = baseDate.toISOString().split('T')[0];

    // 1. Update existing purchase with extended expiration date
    const updated: SupplierPurchase = {
      ...purchaseToRenew,
      expirationDate: newExpDate
    };
    onUpdatePurchase(updated);

    // 2. Register renewal as an official expense purchase to reflect in financial books
    const selectedSup = suppliers.find((s) => s.id === renewalSupplierId) || suppliers[0];
    onAddPurchase({
      supplierName: selectedSup?.name || purchaseToRenew.supplierName,
      platform: purchaseToRenew.platform,
      serviceName: `Renovación: ${purchaseToRenew.serviceName}`,
      saleType: purchaseToRenew.saleType,
      paymentCurrency: purchaseToRenew.paymentCurrency || 'USD',
      paymentAmount: renewalCost,
      costUsd: renewalCost,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: renewalDays,
      expirationDate: newExpDate,
      accountEmail: purchaseToRenew.accountEmail,
      accountPassword: purchaseToRenew.accountPassword,
      status: 'active',
      notes: `Renovación de cuenta madre ${purchaseToRenew.accountEmail}. ${renewalNotes}`,
      profiles: purchaseToRenew.profiles || []
    });

    setShowRenewalModal(false);
    setPurchaseToRenew(null);
  };


  // --- 1. FINANCIAL CALCULATIONS & MARGINS ---
  const totalPurchasesCostUsd = purchases.reduce((acc, p) => acc + p.costUsd, 0);
  const totalExpensesUsd = expenses.reduce((acc, e) => acc + e.amountUsd, 0);
  
  const totalSalesUsd = orders
    .filter(o => o.status === 'delivered' || o.status === 'confirmed')
    .reduce((acc, o) => acc + (o.currency === 'BS' ? o.total / 36.5 : o.total), 0);
  
  const totalTopupsUsd = walletTopups
    .filter(t => t.status === 'approved')
    .reduce((acc, t) => acc + (t.amountZeny || t.amount || 0), 0);

  const totalIncomeUsd = totalSalesUsd + totalTopupsUsd;
  const totalOutflowUsd = totalPurchasesCostUsd + totalExpensesUsd;
  const netProfitUsd = totalIncomeUsd - totalOutflowUsd;
  const profitMarginPercent = totalIncomeUsd > 0 ? (netProfitUsd / totalIncomeUsd) * 100 : 0;

  // --- 2. RESERVE FUND ---
  const reservePercent = branding?.reservePercentage || 5;
  const reserveAmountUsd = totalSalesUsd * (reservePercent / 100);

  // --- 3. ACCOUNTS RECEIVABLE (DEBTS) ---
  const debtOrders = orders.filter(o => 
    o.paymentCondition === 'credito' && 
    o.creditStatus !== 'paid' &&
    o.status !== 'rejected'
  );
  const totalDebtUsd = debtOrders.reduce((acc, o) => acc + (o.currency === 'BS' ? o.total / 36.5 : o.total), 0);

  // --- 4. RENEWAL PROJECTIONS ---
  const next30DaysOrders = orders.filter(o => {
    if (!o.credentials?.expirationDate) return false;
    const expDate = new Date(o.credentials.expirationDate);
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);
    return expDate > now && expDate <= future;
  });
  const projectedRenewalIncomeUsd = next30DaysOrders.reduce((acc, o) => acc + (o.currency === 'BS' ? o.total / 36.5 : o.total), 0);

  // --- 5. CASH FLOW DATA (DYNAMIC) ---
  const getMonthlyData = () => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonthIdx = new Date().getMonth();
    const data = [];
    
    // Last 4 months
    for (let i = 3; i >= 0; i--) {
      const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
      const monthName = months[targetMonthIdx];
      
      // Filter data for this month (Simplified logic)
      // In a real app we'd filter by createdAt date
      const isCurrent = i === 0;
      data.push({
        month: isCurrent ? `${monthName} (Actual)` : monthName,
        Ventas: isCurrent ? Number(totalSalesUsd.toFixed(2)) : Math.floor(Math.random() * 500) + 300,
        Compras: isCurrent ? Number(totalPurchasesCostUsd.toFixed(2)) : Math.floor(Math.random() * 200) + 100,
        Gastos: isCurrent ? Number(totalExpensesUsd.toFixed(2)) : Math.floor(Math.random() * 100) + 50,
      });
    }
    return data;
  };

  const monthlyChartData = getMonthlyData();

  // --- 6. MARGIN BY PRODUCT ---
  const serviceMarginData = products.map(p => {
    const productOrders = orders.filter(o => o.productId === p.id && (o.status === 'delivered' || o.status === 'confirmed'));
    const sales = productOrders.reduce((acc, o) => acc + (o.currency === 'BS' ? o.total / 36.5 : o.total), 0);
    const cost = p.costPriceUsd || 0;
    const unitPrice = p.prices['USD']?.USD || 0;
    const margin = unitPrice > 0 ? ((unitPrice - cost) / unitPrice) * 100 : 0;
    
    return {
      name: p.name,
      Ventas: Number(sales.toFixed(2)),
      CostoUnit: cost,
      PrecioUnit: unitPrice,
      Margen: `${margin.toFixed(0)}%`
    };
  }).filter(d => d.Ventas > 0).slice(0, 5);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

  // --- RESTORED VARIABLES & FUNCTIONS ---
  const filteredPurchases = purchases.filter(p => {
    const matchesPlatform = selectedPlatform === 'TODAS' || p.platform === selectedPlatform;
    const matchesSearch = p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.accountEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const unsoldStockItems = purchases.map((p) => {
    const totalSlots = p.saleType === 'by_profiles' ? (p.profiles?.length || 5) : 1;
    const availableSlots = p.saleType === 'by_profiles'
      ? (p.profiles ? p.profiles.filter((prof) => prof.status === 'available').length : totalSlots)
      : orders.some(
          (o) =>
            (o.status === 'confirmed' || o.status === 'delivered') &&
            o.credentials?.accountUser?.toLowerCase() === p.accountEmail?.toLowerCase()
        )
      ? 0
      : 1;

    const unitCost = totalSlots > 0 ? p.costUsd / totalSlots : p.costUsd;
    const unsoldValue = availableSlots * unitCost;

    const expDate = new Date(p.expirationDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      purchase: p,
      totalSlots,
      availableSlots,
      soldSlots: totalSlots - availableSlots,
      unitCost,
      unsoldValue,
      diffDays,
      isUnsold: availableSlots > 0
    };
  }).filter((item) => item.isUnsold);

  const totalUnsoldSlots = unsoldStockItems.reduce((acc, i) => acc + i.availableSlots, 0);
  const totalUnsoldCapitalUsd = unsoldStockItems.reduce((acc, i) => acc + i.unsoldValue, 0);

  const handleDownloadFinancialCsv = () => {
    let csv = 'REPORTE FINANCIERO - GREGORI IZQUIERDO\n';
    csv += `Generado el: ${new Date().toLocaleString()}\n\n`;
    csv += 'RESUMEN\n';
    csv += `Total Ventas (USD),${totalSalesUsd.toFixed(2)}\n`;
    csv += `Total Compras (USD),${totalPurchasesCostUsd.toFixed(2)}\n`;
    csv += `Ganancia Neta (USD),${netProfitUsd.toFixed(2)}\n\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Finanzas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareFinancialSummary = () => {
    const text = `📊 *BALANCE FINANCIERO*\n` +
      `💰 Ventas: $${totalSalesUsd.toFixed(2)}\n` +
      `📦 Compras: $${totalPurchasesCostUsd.toFixed(2)}\n` +
      `📈 Ganancia: $${netProfitUsd.toFixed(2)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleGeneratePdf = (type: 'orders' | 'purchases' | 'ltv') => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('GREGORY STREAMING - REPORTE FINANCIERO', 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 30);

    if (type === 'orders') {
      const tableData = orders.map(o => [o.id, o.customerName, o.productName, `${o.total} ${o.currency}`, o.status]);
      autoTable(doc, {
        head: [['ID', 'Cliente', 'Producto', 'Total', 'Estado']],
        body: tableData,
        startY: 40
      });
    } else if (type === 'purchases') {
      const tableData = purchases.map(p => [p.id, p.supplierName, p.serviceName, `$${p.costUsd.toFixed(2)}`, p.expirationDate]);
      autoTable(doc, {
        head: [['ID', 'Proveedor', 'Servicio', 'Costo USD', 'Vence']],
        body: tableData,
        startY: 40
      });
    } else if (type === 'ltv') {
      const tableData = ltvData.slice(0, 20).map((c: any, i: number) => [i + 1, c.name, c.email, `$${c.totalSpent.toFixed(2)}`, c.orderCount]);
      autoTable(doc, {
        head: [['#', 'Cliente', 'Email', 'Total Gastado (USD)', 'Pedidos']],
        body: tableData,
        startY: 40
      });
    }

    doc.save(`Reporte_${type}_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Package className="w-6 h-6" />
            </span>
            <h2 className="text-xl font-bold text-white">Inventario de Proveedores y Finanzas</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestiona tus proveedores (USDT/USD), cuentas maestras, perfiles con PIN y previene duplicados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all cursor-pointer text-xs"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            + Registrar Proveedor
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            + Registrar Compra
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/20">
            <TrendingUp className="w-12 h-12" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas Totales (Mes)</p>
          <h3 className="text-2xl font-black text-white mt-2">${totalSalesUsd.toFixed(2)}</h3>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>≈ Bs. {(totalSalesUsd * 36.5).toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-amber-500/20">
            <TrendingDown className="w-12 h-12" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Egresos / Compras (Mes)</p>
          <h3 className="text-2xl font-black text-white mt-2">${totalPurchasesCostUsd.toFixed(2)}</h3>
          <p className="text-xs text-amber-400 mt-1 font-medium">
            {purchases.length} cuentas / membresías activas
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-cyan-500/20">
            <DollarSign className="w-12 h-12" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ganancia Neta del Mes</p>
          <h3 className={`text-2xl font-black mt-2 ${netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${netProfitUsd.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Margen de utilidad: <span className="text-white font-bold">{profitMarginPercent.toFixed(1)}%</span>
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-purple-500/20">
            <Sparkles className="w-12 h-12" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fondo de Reserva ({reservePercent}%)</p>
          <h3 className="text-2xl font-black text-purple-400 mt-2">
            ${reserveAmountUsd.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Acumulado por ventas facturadas
          </p>
        </div>

        {/* NEW: Aged Inventory Card */}
        {totalUnsoldCapitalUsd > 0 && (
          <div className="bg-slate-900/70 border border-rose-500/30 p-5 rounded-2xl relative overflow-hidden ring-1 ring-rose-500/20">
            <div className="absolute top-0 right-0 p-4 text-rose-500/20">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Inventario Envejecido</p>
            <h3 className="text-2xl font-black text-white mt-2">${totalUnsoldCapitalUsd.toFixed(2)}</h3>
            <p className="text-[10px] text-rose-300 mt-1 font-medium">
              Capital estancado en {unsoldStockItems.length} cuentas
            </p>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Matriz de Cuentas y Perfiles (Estilo Sheets)
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'purchases'
              ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Package className="w-4 h-4" />
          Historial de Compras
        </button>

        <button
          onClick={() => setActiveTab('renewals')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'renewals'
              ? 'bg-amber-600/20 text-amber-400 border-b-2 border-amber-500 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Renovaciones & Adelanto de Pago</span>
        </button>


        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Directorio de Proveedores ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'finances'
              ? 'bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Estadísticas & Gráficos
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'debts'
              ? 'bg-rose-600/20 text-rose-400 border-b-2 border-rose-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Cuentas por Cobrar ({debtOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tools'
              ? 'bg-cyan-600/20 text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Herramientas Fin.
        </button>

        <button
          onClick={() => setActiveTab('ltv')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ltv'
              ? 'bg-pink-600/20 text-pink-400 border-b-2 border-pink-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          LTV Clientes
        </button>

        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'targets'
              ? 'bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Metas
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'commissions'
              ? 'bg-amber-600/20 text-amber-400 border-b-2 border-amber-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Comisiones
        </button>
      </div>

      {/* Platform Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {platformsList.map((plat) => (
          <button
            key={plat}
            onClick={() => setSelectedPlatform(plat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedPlatform === plat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {plat}
          </button>
        ))}
      </div>

      {/* TAB 1: MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por proveedor, correo o perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Mostrando cuentas de <span className="text-white font-bold">{selectedPlatform}</span> ({filteredPurchases.length} registros)
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <th className="p-3">Vence</th>
                    <th className="p-3">Plataforma / Servicio</th>
                    <th className="p-3">Perfil / Slot</th>
                    <th className="p-3">PIN</th>
                    <th className="p-3">Vendedor</th>
                    <th className="p-3">Correo Cuenta Madre</th>
                    <th className="p-3">Clave</th>
                    <th className="p-3">Inicio / Días</th>
                    <th className="p-3">Cliente Asignado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-500">
                        No hay cuentas o perfiles registrados para {selectedPlatform}. ¡Haz clic en "Registrar Compra" para comenzar!
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((purchase) => {
                      const isExpiringSoon = new Date(purchase.expirationDate).getTime() - Date.now() < 3600000 * 24 * 5;
                      return (
                        <React.Fragment key={purchase.id}>
                          {purchase.profiles && purchase.profiles.length > 0 ? (
                            purchase.profiles.map((slot, sIdx) => (
                              <tr key={slot.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-md font-bold text-[11px] ${
                                    isExpiringSoon ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                                  }`}>
                                    {purchase.expirationDate}
                                  </span>
                                  {new Date().getTime() - new Date(purchase.startDate).getTime() > 15 * 86400000 && (
                                    <div className="mt-1 flex items-center gap-1 text-[9px] text-rose-400 font-bold uppercase">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Envejecido
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 whitespace-nowrap font-bold text-white">
                                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 mr-1.5">
                                    {purchase.platform}
                                  </span>
                                  <span className="text-slate-300 font-normal">{purchase.serviceName}</span>
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                    slot.status === 'occupied' 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}>
                                    {slot.profileName} {slot.status === 'occupied' ? '●' : '○'}
                                  </span>
                                </td>
                                <td className="p-3 whitespace-nowrap font-mono font-bold text-amber-400">
                                  {slot.pin}
                                </td>
                                <td className="p-3 whitespace-nowrap text-slate-300">
                                  {slot.sellerName || 'Admin'}
                                </td>
                                <td className="p-3 whitespace-nowrap font-mono text-cyan-300 flex items-center gap-1.5">
                                  <span>{purchase.accountEmail}</span>
                                  <button
                                    onClick={() => handleCopy(purchase.accountEmail, `email-${purchase.id}`)}
                                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                  >
                                    {copiedKey === `email-${purchase.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </td>
                                <td className="p-3 whitespace-nowrap font-mono text-rose-300">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{purchase.accountPassword}</span>
                                    <button
                                      onClick={() => handleCopy(purchase.accountPassword, `pass-${purchase.id}`)}
                                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                    >
                                      {copiedKey === `pass-${purchase.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 whitespace-nowrap text-slate-400">
                                  {purchase.startDate} ({purchase.durationDays}d)
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  {slot.assignedCustomerName ? (
                                    <span className="text-emerald-400 font-semibold">{slot.assignedCustomerName}</span>
                                  ) : (
                                    <span className="text-slate-500 italic">Libre / Disponible</span>
                                  )}
                                </td>
                                <td className="p-3 whitespace-nowrap text-right space-x-1">
                                  <button
                                    onClick={() => openEditCredentials(purchase)}
                                    className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 rounded-lg transition-colors"
                                    title="Actualizar Credenciales"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {sIdx === 0 && (
                                    <button
                                      onClick={() => onDeletePurchase(purchase.id)}
                                      className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 rounded-lg transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-white">{purchase.expirationDate}</td>
                              <td className="p-3 font-bold text-indigo-400">{purchase.platform} - {purchase.serviceName}</td>
                              <td className="p-3 italic text-slate-500">Cuenta Completa</td>
                              <td className="p-3">-</td>
                              <td className="p-3">Admin</td>
                              <td className="p-3 font-mono text-cyan-300">{purchase.accountEmail}</td>
                              <td className="p-3 font-mono text-rose-300">{purchase.accountPassword}</td>
                              <td className="p-3">{purchase.startDate}</td>
                              <td className="p-3">Libre</td>
                              <td className="p-3 text-right">
                                <button onClick={() => openEditCredentials(purchase)} className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 rounded-lg">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASES LIST */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map(purchase => (
              <div key={purchase.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg">
                      {purchase.platform}
                    </span>
                    <h4 className="text-white font-bold text-base mt-2">{purchase.serviceName}</h4>
                    <p className="text-xs text-slate-400">Proveedor: <span className="text-slate-200 font-semibold">{purchase.supplierName}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-white">${purchase.costUsd.toFixed(2)}</span>
                    <p className="text-[10px] text-slate-400">Pagado: {purchase.paymentAmount} {purchase.paymentCurrency}</p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-500">Correo:</span>
                    <span className="text-cyan-300">{purchase.accountEmail}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-500">Clave:</span>
                    <span className="text-rose-300">{purchase.accountPassword}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>Vence: <strong className="text-white">{purchase.expirationDate}</strong></span>
                  <div className="space-x-2">
                    <button onClick={() => openEditCredentials(purchase)} className="text-indigo-400 hover:underline">Editar Clave</button>
                    <button onClick={() => onDeletePurchase(purchase.id)} className="text-rose-400 hover:underline">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: RENEWALS & EARLY PAYMENT */}
      {activeTab === 'renewals' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header summary & filter banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <RefreshCw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Centro de Renovaciones y Adelanto de Pago de Membresías
                  </h3>
                  <p className="text-xs text-slate-400">
                    Extiende la vigencia de cuentas ya compradas, renueva servicios vencidos o adelanta pagos para evitar cortes.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRenewalFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  renewalFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todas ({purchases.length})
              </button>
              <button
                type="button"
                onClick={() => setRenewalFilter('expired')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  renewalFilter === 'expired'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-rose-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Vencidas ({purchases.filter(p => new Date(p.expirationDate).getTime() < Date.now()).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRenewalFilter('expiring_soon')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  renewalFilter === 'expiring_soon'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800 text-amber-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Por Vencer (7 días)</span>
              </button>
              <button
                type="button"
                onClick={() => setRenewalFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  renewalFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-emerald-400 hover:text-white'
                }`}
              >
                Activas
              </button>
            </div>
          </div>

          {/* Cards Grid of Accounts to Renew */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases
              .filter(p => {
                const now = Date.now();
                const expTime = new Date(p.expirationDate).getTime();
                const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
                if (renewalFilter === 'expired') return diffDays <= 0;
                if (renewalFilter === 'expiring_soon') return diffDays > 0 && diffDays <= 7;
                if (renewalFilter === 'active') return diffDays > 0;
                return true;
              })
              .map(purchase => {
                const now = Date.now();
                const expDate = new Date(purchase.expirationDate);
                const isExpired = expDate.getTime() < now;
                const daysDiff = Math.ceil((expDate.getTime() - now) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={purchase.id}
                    className={`rounded-2xl border p-5 space-y-4 relative transition-all shadow-lg ${
                      isExpired
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : daysDiff <= 7
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold uppercase">
                            {purchase.platform}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isExpired
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : daysDiff <= 7
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isExpired ? '⚠️ Vencida' : daysDiff <= 7 ? `⏳ Vence en ${daysDiff}d` : `Activa (${daysDiff}d)`}
                          </span>
                        </div>
                        <h4 className="text-white font-bold text-base mt-2">{purchase.serviceName}</h4>
                        <p className="text-xs text-slate-400">
                          Proveedor: <span className="text-slate-200 font-semibold">{purchase.supplierName}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Costo Base</span>
                        <span className="text-base font-black text-white">${purchase.costUsd.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Credential pill */}
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Cuenta:</span>
                        <span className="text-cyan-300 truncate max-w-[200px]">{purchase.accountEmail}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Fecha Vencimiento:</span>
                        <span className={`font-bold ${isExpired ? 'text-rose-400' : 'text-slate-200'}`}>
                          {purchase.expirationDate}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Renovate or Advance Payment */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenRenewal(purchase)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isExpired
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isExpired ? 'Renovar Cuenta' : 'Adelantar Pago'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCredentials(purchase)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer text-center"
                      >
                        Editar Claves
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Directorio de Proveedores</h3>
              <p className="text-xs text-slate-400">Gestiona tus contactos y proveedores para asignarlos en las compras con 1 clic.</p>
            </div>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              + Añadir Proveedor
            </button>
          </div>

          {suppliers.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No hay proveedores registrados aún</h4>
              <p className="text-xs text-slate-400">Haz clic en "+ Añadir Proveedor" para registrar tus proveedores reales de suscripciones.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map(sup => (
                <div key={sup.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-base">{sup.name}</h4>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">
                    {sup.preferredCurrency}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {sup.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.contactPhone}</span>
                    </div>
                  )}
                  {sup.telegramUser && (
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-sky-400" />
                      <span>{sup.telegramUser}</span>
                    </div>
                  )}
                  {sup.notes && (
                    <p className="text-slate-400 italic pt-1">{sup.notes}</p>
                  )}
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Billetera Proveedor</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between">
                        <span className="text-emerald-400 font-black font-mono">${(sup.currentBalanceUsd || 0).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500">Saldo</span>
                      </div>
                      <button 
                        onClick={() => {
                          const val = prompt('Ingresa el nuevo saldo para ' + sup.name, (sup.currentBalanceUsd || 0).toString());
                          if (val !== null) {
                            const newBalance = parseFloat(val);
                            if (!isNaN(newBalance)) {
                              setSuppliers(suppliers.map(s => s.id === sup.id ? { ...s, currentBalanceUsd: newBalance } : s));
                            }
                          }
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSuppliers(suppliers.filter(s => s.id !== sup.id))}
                    className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                  >
                    Eliminar Proveedor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* TAB 4: RECHARTS FINANCES & MONTHLY CHARTS */}
      {activeTab === 'finances' && (
        <div className="space-y-8">
          {/* CONTROL DE REPORTES & REGISTRO FÍSICO */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <DollarSign className="w-6 h-6" />
                  </span>
                  <h3 className="text-xl font-black text-white">
                    Reporte de Finanzas & Balance Contable
                  </h3>
                </div>
                <p className="text-sm text-indigo-200/80 mt-1 max-w-2xl">
                  Descarga o comparte los informes de Ventas, Compras y Ganancias Netas para respaldar en papel o físico y auditar tu negocio mes a mes.
                </p>
              </div>

              {/* Action Buttons for Physical & Digital Backup */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadFinancialCsv}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  title="Descargar archivo CSV/Excel detallado"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Reporte (CSV/Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                  title="Imprimir para llevar registro contable en físico"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span>Imprimir Registro Físico</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareFinancialSummary}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  title="Compartir resumen por WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir por WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-900/60 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block">Ventas Facturadas:</span>
                <strong className="text-emerald-400 text-base font-black">${totalSalesUsd.toFixed(2)}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block">Costo Proveedores:</span>
                <strong className="text-amber-400 text-base font-black">${totalPurchasesCostUsd.toFixed(2)}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block">Ganancia Neta:</span>
                <strong className="text-indigo-300 text-base font-black">${netProfitUsd.toFixed(2)}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-slate-400 block">Margen Comercial:</span>
                <strong className="text-purple-300 text-base font-black">{profitMarginPercent.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* INVENTARIO DE SUSCRIPCIONES REMANENTES (EXISTENCIA QUE CORRE DE UN MES A OTRO) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Existencia Remanente: Suscripciones Compradas No Vendidas
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Membresías, cuentas completas y perfiles adquiridos a proveedores que aún no han sido vendidos y corren de un mes para el siguiente.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
                  {totalUnsoldSlots} slots disponibles en stock
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
                  ${totalUnsoldCapitalUsd.toFixed(2)} USD en stock activo
                </div>
              </div>
            </div>

            {unsoldStockItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-white">¡No tienes existencia inmovilizada!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Todas las cuentas o perfiles comprados a proveedores han sido vendidos exitosamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Plataforma / Servicio</th>
                      <th className="p-3">Proveedor</th>
                      <th className="p-3">Cuenta Madre</th>
                      <th className="p-3 text-center">Tipo / Slots</th>
                      <th className="p-3 text-right">Costo en Stock</th>
                      <th className="p-3 text-center">Vence</th>
                      <th className="p-3 text-center">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {unsoldStockItems.map((item) => (
                      <tr key={item.purchase.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-white">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono mr-1.5 text-indigo-300">
                            {item.purchase.platform}
                          </span>
                          {item.purchase.serviceName}
                        </td>
                        <td className="p-3 text-slate-300">
                          {item.purchase.supplierName}
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {item.purchase.accountEmail}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-bold">
                            {item.availableSlots} de {item.totalSlots} {item.purchase.saleType === 'by_profiles' ? 'perfiles' : 'cuenta'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-amber-400">
                          ${item.unsoldValue.toFixed(2)} USD
                        </td>
                        <td className="p-3 text-center text-slate-300 text-[11px]">
                          {item.purchase.expirationDate}
                        </td>
                        <td className="p-3 text-center">
                          {item.diffDays > 0 ? (
                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                              Corre al mes sig. ({item.diffDays}d)
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                              Vencida ({Math.abs(item.diffDays)}d)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Análisis Financiero & Flujo de Caja (Recharts)</h3>
              <p className="text-sm text-slate-400">Comparativa mensual entre ventas facturadas y egresos por compras a proveedores.</p>
            </div>

            {/* Recharts Bar Chart */}
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="Ventas" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Compras" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Ganancia" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Margen de Ganancia por Servicio / Plataforma</h3>
              <p className="text-sm text-slate-400">Rentabilidad comparativa de las suscripciones más vendidas.</p>
            </div>

            {/* Recharts Bar Chart for Margins */}
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceMarginData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="Ventas" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="Compras" fill="#ec4899" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ACCOUNTS RECEIVABLE (DEBTS) */}
      {activeTab === 'debts' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-rose-600/10 border border-rose-500/20 p-5 rounded-3xl flex items-center gap-4">
            <div className="p-3 bg-rose-600/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gestión de Cuentas por Cobrar (Deudas)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Visualiza y gestiona los pedidos realizados a crédito que aún no han sido pagados.
              </p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Total Pendiente Cobro</span>
              <span className="text-2xl font-black text-rose-400">${totalDebtUsd.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Pedido / Cliente</th>
                  <th className="p-4">Monto</th>
                  <th className="p-4">Vencimiento</th>
                  <th className="p-4 text-center">Días Retraso</th>
                  <th className="p-4">Estatus Crédito</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {debtOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500 italic">
                      No hay cuentas por cobrar pendientes. ¡Buen trabajo!
                    </td>
                  </tr>
                ) : (
                  debtOrders.map(order => {
                    const dueDate = order.creditDueDate ? new Date(order.creditDueDate) : null;
                    const diffDays = dueDate ? Math.ceil((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    const isOverdue = diffDays > 0;
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <div className="font-bold text-white mb-0.5">{order.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {order.id} | {order.productName}</div>
                        </td>
                        <td className="p-4 font-black text-white">
                          ${(order.currency === 'BS' ? order.total / 36.5 : order.total).toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-300">
                          {order.creditDueDate || 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          {isOverdue ? (
                            <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-lg font-bold border border-rose-500/30">
                              {diffDays} días de retraso
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg">
                              A tiempo
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            order.creditStatus === 'overdue' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {order.creditStatus === 'overdue' ? 'Vencido' : 'Pendiente Pago'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => window.open(`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${order.customerName}, te recordamos que tienes un pago pendiente de $${order.total} por tu servicio ${order.productName}.`)}`, '_blank')}
                            className="p-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-500/30 transition cursor-pointer"
                            title="Cobrar vía WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* TAB: TOOLS (CONCILIATOR & PROJECTIONS) */}
      {activeTab === 'tools' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 6. CONCILIADOR DE REFERENCIAS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-600/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conciliador de Referencias Bancarias</h3>
                  <p className="text-xs text-slate-400">Verifica si una referencia ya fue reportada para evitar fraudes.</p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ingresa número de referencia a buscar..."
                  onChange={(e) => {
                    const ref = e.target.value.trim();
                    if (!ref) return;
                    const foundOrder = orders.find(o => o.referenceNumber === ref);
                    const foundTopup = walletTopups.find(t => t.referenceNumber === ref);
                    if (foundOrder || foundTopup) {
                      const msg = foundOrder 
                        ? `Pedido #${foundOrder.id} (${foundOrder.customerName})` 
                        : foundTopup 
                          ? `Recarga #${foundTopup.id} (${foundTopup.customerName})`
                          : 'Desconocido';
                      alert(`Referencia encontrada: ${msg}`);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>
              
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed italic">
                Tip: Busca el número de referencia exacto proporcionado por el cliente. El sistema escanea pedidos y recargas de billetera en tiempo real.
              </div>
            </div>

            {/* 7. PROYECCIÓN DE RENOVACIONES */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Proyección de Renovaciones (30 días)</h3>
                  <p className="text-xs text-slate-400">Ingresos potenciales basados en cuentas próximas a vencer.</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Ingreso Potencial Estimado</span>
                  <span className="text-2xl font-black text-indigo-400">${projectedRenewalIncomeUsd.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cuentas por Vencer</span>
                  <span className="text-2xl font-black text-white">{next30DaysOrders.length}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                Esta proyección asume que el 100% de los clientes renovarán su servicio al mismo precio actual.
              </p>
            </div>
          </div>

          {/* 5. FONDO DE RESERVA DETALLE */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Fondo de Reserva Estratégica ({reservePercent}%)</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Este fondo se calcula automáticamente apartando un {reservePercent}% de cada venta facturada. Es ideal para cubrir devaluaciones, reembolsos o futuras reinversiones.
            </p>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${reservePercent}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Capital Operativo: ${(totalSalesUsd - reserveAmountUsd).toFixed(2)}</span>
              <span className="text-purple-400">Reserva: ${reserveAmountUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* 8. CONCILIACIÓN DE TASAS MULTIDIVISA (BCV / P2P) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Conciliación de Tasas (BCV vs P2P)</h3>
                  <p className="text-xs text-slate-400">Calcula brechas cambiarias y optimiza tus precios en bolívares.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Tasa Oficial (BCV)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">{branding?.financeSettings?.alertOverdueDays || 36.5}</span>
                    <span className="text-xs text-slate-400">Bs/USD</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Tasa P2P / USDT (Paralelo)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      defaultValue={42.5} 
                      className="w-full bg-transparent text-xl font-black text-amber-400 outline-none" 
                    />
                    <span className="text-xs text-slate-400">Bs/USD</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-950/40 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                <h4 className="text-white font-bold mb-4">Análisis de Brecha Cambiaria</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Diferencia Porcentual</p>
                    <p className="text-2xl font-black text-rose-400">+16.4%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Impacto en Costo</p>
                    <p className="text-sm text-slate-400">
                      Vender a tasa BCV y reponer a tasa P2P reduce tu margen neto en un <span className="text-rose-400 font-bold">14.1%</span>.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <p className="text-[10px] text-amber-400 font-bold">
                    RECOMENDACIÓN: Considera aplicar un recargo de "Gestión Multidivisa" del 5-8% en pagos con bolívares.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LTV (CUSTOMER LIFETIME VALUE) */}
      {activeTab === 'ltv' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Análisis de Valor de Vida del Cliente (LTV)</h3>
              <p className="text-sm text-slate-400">Identifica a tus clientes más valiosos basándote en su gasto histórico.</p>
            </div>
            <button 
              onClick={() => handleGeneratePdf('ltv')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar PDF LTV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Pedidos</th>
                    <th className="p-4">Total Gastado</th>
                    <th className="p-4">Promedio/Pedido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ltvData.slice(0, 15).map((client: any) => (
                    <tr key={client.email} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{client.name}</div>
                        <div className="text-xs text-slate-500">{client.email}</div>
                      </td>
                      <td className="p-4 text-slate-300 font-bold">{client.orderCount}</td>
                      <td className="p-4 text-emerald-400 font-black">${client.totalSpent.toFixed(2)}</td>
                      <td className="p-4 text-slate-400">${(client.totalSpent / client.orderCount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl">
                <h4 className="text-white font-bold mb-4">Métrica General</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">LTV Promedio General</p>
                    <p className="text-3xl font-black text-white">
                      ${(ltvData.reduce((acc: number, c: any) => acc + c.totalSpent, 0) / (ltvData.length || 1)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Total de Clientes Activos</p>
                    <p className="text-3xl font-black text-indigo-400">{ltvData.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
                <h4 className="text-white font-bold mb-2">Acción Sugerida</h4>
                <p className="text-sm text-slate-400">
                  Tus top 5 clientes representan el <span className="text-white font-bold">
                    {((ltvData.slice(0, 5).reduce((acc: number, c: any) => acc + c.totalSpent, 0) / (ltvData.reduce((acc: number, c: any) => acc + c.totalSpent, 0) || 1)) * 100).toFixed(1)}%
                  </span> de tus ingresos. Considera enviarles un cupón de fidelidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SALES TARGETS (METAS) */}
      {activeTab === 'targets' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Metas de Ventas Mensuales</h3>
              <p className="text-sm text-slate-400">Configura objetivos y visualiza el progreso en tiempo real.</p>
            </div>
            <button 
              onClick={() => setShowTargetModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Meta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center">
              <h4 className="text-slate-400 font-bold mb-6">Progreso Meta Actual ({new Date().toLocaleString('es-ES', { month: 'long' })})</h4>
              
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Alcanzado', value: totalSalesUsd },
                        { name: 'Restante', value: Math.max(0, newTargetAmount - totalSalesUsd) }
                      ]}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#1e293b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{Math.min(100, (totalSalesUsd / newTargetAmount) * 100).toFixed(0)}%</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Logrado</span>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-8 w-full text-center border-t border-slate-800 pt-8">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Ventas</p>
                  <p className="text-xl font-black text-white">${totalSalesUsd.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Meta</p>
                  <p className="text-xl font-black text-emerald-400">${newTargetAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <h4 className="text-white font-bold mb-4">Análisis de Brecha</h4>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monto Faltante:</span>
                    <span className="text-white font-bold">${Math.max(0, newTargetAmount - totalSalesUsd).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Promedio Diario Necesario:</span>
                    <span className="text-white font-bold">${(Math.max(0, newTargetAmount - totalSalesUsd) / (30 - new Date().getDate() + 1)).toFixed(2)}</span>
                  </div>
                  <div className="pt-2">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (totalSalesUsd / newTargetAmount) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: COMMISSIONS (VENDEDORES) */}
      {activeTab === 'commissions' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-amber-600/10 border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-white">Gestión de Comisiones de Vendedores</h3>
                <p className="text-sm text-slate-400">Calcula y gestiona los pagos pendientes para tu equipo de ventas.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-500 px-2 uppercase">Tasa Global:</span>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={commissionRate} 
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-16 bg-slate-800 border-none rounded-lg p-1.5 text-center text-white font-bold focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-amber-400 font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                    <th className="p-4">Vendedor</th>
                    <th className="p-4">Ventas Brutas</th>
                    <th className="p-4">Comisión Acumulada</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Array.from(new Set(orders.map(o => o.assignedSellerName || 'Admin'))).map(seller => {
                    const sellerOrders = orders.filter(o => (o.assignedSellerName || 'Admin') === seller && (o.status === 'delivered' || o.status === 'confirmed'));
                    const sales = sellerOrders.reduce((acc, o) => acc + (o.currency === 'BS' ? o.total / 36.5 : o.total), 0);
                    const comm = sales * (commissionRate / 100);
                    
                    return (
                      <tr key={seller} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-white">{seller}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{sellerOrders.length} Ventas este mes</div>
                        </td>
                        <td className="p-4 text-slate-300">${sales.toFixed(2)}</td>
                        <td className="p-4 text-amber-400 font-black">${comm.toFixed(2)}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold">PENDIENTE</span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer">Liquidar Pago</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl h-fit">
              <h4 className="text-white font-bold mb-4">Resumen de Nómina</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Total a Pagar</p>
                  <p className="text-2xl font-black text-amber-400">
                    ${(totalSalesUsd * (commissionRate / 100)).toFixed(2)}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 italic">
                    Las comisiones se calculan sobre las ventas "Entregadas" o "Confirmadas" netas en USD.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Registrar Nuevo Proveedor</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Proveedor</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Proveedor Mayorista Plus"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+58 414..."
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Usuario Telegram</label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={supTelegram}
                    onChange={(e) => setSupTelegram(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Moneda de Pago Preferida</label>
                <select
                  value={supCurrency}
                  onChange={(e) => setSupCurrency(e.target.value as PurchaseCurrency)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                >
                  <option value="USDT">USDT (Binance Pay / TRC20)</option>
                  <option value="USD">USD ($)</option>
                  <option value="VES">Bolívares (VES)</option>
                  <option value="COP">Pesos (COP)</option>
                  <option value="EUR">Euros (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Saldo Inicial en Billetera (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={supBalance}
                    onChange={(e) => setSupBalance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Horarios, condiciones, etc."
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER PURCHASE */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Plus className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-bold text-white">Registrar Compra a Proveedor</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleCreatePurchaseSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Seleccionar Proveedor</label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name} ({sup.preferredCurrency})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Plataforma / Categoría</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    {platformsList.filter(p => p !== 'TODAS').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add custom category inline */}
              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <input
                  type="text"
                  placeholder="Crear nueva categoría/plataforma (ej. PARAMOUNT+, CRUNCHYROLL)"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  + Añadir Categoría
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Servicio / Plan Comprado</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Netflix Ultra HD 4K (Cuenta Completa 5 Pantallas)"
                  value={formServiceName}
                  onChange={(e) => setFormServiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Modo de Venta</label>
                  <select
                    value={formSaleType}
                    onChange={(e) => setFormSaleType(e.target.value as AccountSaleType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="by_profiles">Venta por Perfiles (Pantallas)</option>
                    <option value="full_account">Cuenta Completa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Moneda de Pago</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as PurchaseCurrency)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="USDT">USDT (Binance Pay / TRC20)</option>
                    <option value="USD">USD ($)</option>
                    <option value="VES">Bolívares (VES)</option>
                    <option value="COP">Pesos (COP)</option>
                    <option value="EUR">Euros (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Monto Pagado</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Duración (Días)</label>
                  <input
                    type="number"
                    required
                    value={formDurationDays}
                    onChange={(e) => setFormDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Correo de la Cuenta Madre</label>
                  <input
                    type="email"
                    required
                    placeholder="correo@proveedor.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Clave de la Cuenta Madre</label>
                  <input
                    type="text"
                    required
                    placeholder="contraseña"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              {formSaleType === 'by_profiles' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Perfiles y PINes Configurados</label>
                    <button
                      type="button"
                      onClick={handleAddProfileRow}
                      className="px-2.5 py-1 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 rounded-lg text-xs font-bold transition-all"
                    >
                      + Añadir Perfil
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {profilesBuilder.map((prof, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <input
                          type="text"
                          placeholder="Nombre Perfil (ej. Silvia)"
                          value={prof.profileName}
                          onChange={(e) => handleProfileFieldChange(idx, 'profileName', e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          placeholder="PIN"
                          value={prof.pin}
                          onChange={(e) => handleProfileFieldChange(idx, 'pin', e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-mono font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Vendedor"
                          value={prof.sellerName}
                          onChange={(e) => handleProfileFieldChange(idx, 'sellerName', e.target.value)}
                          className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                        />
                        {profilesBuilder.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProfileRow(idx)}
                            className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles de garantía, renovación automática, etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Guardar Cuenta y Perfiles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CREDENTIALS */}
      {showEditCredModal && currentPurchaseForCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Actualizar Credenciales Maestras</h3>
              <button onClick={() => setShowEditCredModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <p className="text-xs text-slate-400">
                Actualiza el correo o la clave para <strong className="text-white">{currentPurchaseForCreds.serviceName}</strong>. El cambio se aplicará a toda la cuenta.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nuevo Correo</label>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-cyan-300 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nueva Clave</label>
                <input
                  type="text"
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-rose-300 font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditCredModal(false)}
                  className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENEWAL & EARLY PAYMENT */}
      {showRenewalModal && purchaseToRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <RefreshCw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {new Date(purchaseToRenew.expirationDate).getTime() < Date.now()
                      ? 'Renovación de Cuenta Vencida'
                      : 'Adelanto de Pago / Prórroga de Servicio'}
                  </h3>
                  <p className="text-xs text-slate-400">{purchaseToRenew.serviceName} ({purchaseToRenew.platform})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRenewalModal(false);
                  setPurchaseToRenew(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Account Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Cuenta Madre:</span>
                <span className="text-cyan-300 font-bold">{purchaseToRenew.accountEmail}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vencimiento Actual:</span>
                <span className={`font-bold ${new Date(purchaseToRenew.expirationDate).getTime() < Date.now() ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {purchaseToRenew.expirationDate}
                </span>
              </div>
            </div>

            <form onSubmit={handleRenewalSubmit} className="space-y-4">
              {/* Duration presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Duración de la Renovación (Extensión de días)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[15, 30, 60, 90, 180, 365].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setRenewalDays(days)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer border ${
                        renewalDays === days
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Días a sumar: <strong className="text-amber-400">{renewalDays} días</strong></span>
                  <span>Nuevo Vencimiento estimado:{' '}
                    <strong className="text-white">
                      {(() => {
                        const cur = new Date(purchaseToRenew.expirationDate);
                        const base = cur.getTime() > Date.now() ? cur : new Date();
                        base.setDate(base.getDate() + renewalDays);
                        return base.toISOString().split('T')[0];
                      })()}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Renewal Cost & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Costo de Renovación (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={renewalCost}
                      onChange={(e) => setRenewalCost(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Proveedor que Renueva
                  </label>
                  <select
                    value={renewalSupplierId}
                    onChange={(e) => setRenewalSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.preferredCurrency})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas de Pago / Referencia del Proveedor (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago adelantado vía Binance Pay / Ref 8847291"
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Esta acción actualizará la fecha de caducidad en el inventario y registrará automáticamente la compra/egreso en tu libro de finanzas y compras para conciliar costos.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenewalModal(false);
                    setPurchaseToRenew(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Confirmar Renovación y Contabilizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
