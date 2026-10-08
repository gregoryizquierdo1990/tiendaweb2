import React, { useState, useEffect } from 'react';
import { 
  SupplierPurchase, 
  AccountProfileSlot, 
  PurchaseCurrency, 
  AccountSaleType,
  Order,
  CustomerUser,
  Supplier 
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
  Cell 
} from 'recharts';

interface AdminPurchasesAndFinanceManagerProps {
  purchases: SupplierPurchase[];
  onAddPurchase: (purchase: Omit<SupplierPurchase, 'id' | 'createdAt'>) => void;
  onUpdatePurchase: (purchase: SupplierPurchase) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onUpdateCredentials: (purchaseId: string, email: string, pass: string) => void;
  orders: Order[];
  customers: CustomerUser[];
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
  customers
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'purchases' | 'renewals' | 'suppliers' | 'finances'>('matrix');
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


  // Financial calculations
  const totalPurchasesCostUsd = purchases.reduce((acc, p) => acc + p.costUsd, 0);
  const totalSalesUsd = orders
    .filter(o => o.status === 'delivered' || o.status === 'confirmed')
    .reduce((acc, o) => acc + (o.currency === 'BS' ? o.total / 36.5 : o.total), 0);
  const netProfitUsd = totalSalesUsd - totalPurchasesCostUsd;
  const profitMarginPercent = totalSalesUsd > 0 ? (netProfitUsd / totalSalesUsd) * 100 : 0;

  // Unsold stock analysis (Membresías compradas que no se vendieron en el mes y corren al siguiente)
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

    // Remaining days before expiration
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
    let csv = 'REPORTE FINANCIERO Y CONTROL DE INVENTARIO REMANENTE - GREGORI IZQUIERDO STREAMING\n';
    csv += `Generado el: ${new Date().toLocaleString('es-VE')}\n\n`;
    csv += 'RESUMEN GENERAL FINANCIERO\n';
    csv += `Total Ventas Facturadas (USD),${totalSalesUsd.toFixed(2)}\n`;
    csv += `Total Compras a Proveedores (USD),${totalPurchasesCostUsd.toFixed(2)}\n`;
    csv += `Ganancia Neta Estimada (USD),${netProfitUsd.toFixed(2)}\n`;
    csv += `Margen de Ganancia,${profitMarginPercent.toFixed(1)}%\n`;
    csv += `Membresias/Slots No Vendidos (Existencia Remanente),${totalUnsoldSlots} slots\n`;
    csv += `Capital en Stock que Corre al Siguiente Mes (USD),${totalUnsoldCapitalUsd.toFixed(2)}\n\n`;

    csv += 'DETALLE DE SUSCRIPCIONES Y CUENTAS NO VENDIDAS QUE CORREN DE UN MES A OTRO\n';
    csv += 'ID Compra,Proveedor,Plataforma,Servicio / Plan,Modo Venta,Slots Libres / Total,Costo No Vendido (USD),Fecha Vence,Dias Restantes,Correo Cuenta Madre,Estado\n';

    unsoldStockItems.forEach((i) => {
      csv += `"${i.purchase.id}","${i.purchase.supplierName}","${i.purchase.platform}","${i.purchase.serviceName}","${i.purchase.saleType === 'by_profiles' ? 'Perfiles' : 'Cuenta Completa'}",${i.availableSlots}/${i.totalSlots},${i.unsoldValue.toFixed(2)},${i.purchase.expirationDate},${i.diffDays} dias,"${i.purchase.accountEmail}","${i.diffDays > 0 ? 'Activo (Pasa al prox mes)' : 'Vencido'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Finanzas_Inventario_Remanente_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareFinancialSummary = () => {
    const text = `📊 *BALANCE FINANCIERO & EXISTENCIA REMANENTE* - Gregori Izquierdo Streaming\n` +
      `📅 Fecha: ${new Date().toLocaleDateString('es-VE')}\n\n` +
      `💰 *Ventas Totales:* $${totalSalesUsd.toFixed(2)} USD\n` +
      `📦 *Compras Proveedores:* $${totalPurchasesCostUsd.toFixed(2)} USD\n` +
      `📈 *Ganancia Neta:* $${netProfitUsd.toFixed(2)} USD (${profitMarginPercent.toFixed(1)}% margen)\n\n` +
      `🏷️ *INVENTARIO QUE CORRE AL SIGUIENTE MES:*\n` +
      `• Membresías/Perfiles No Vendidos: *${totalUnsoldSlots} slots disponibles*\n` +
      `• Capital Activo en Existencia: *$${totalUnsoldCapitalUsd.toFixed(2)} USD*\n\n` +
      `🌐 www.gregoryizquierdo.xyz`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Filtered purchases
  const filteredPurchases = purchases.filter(p => {
    const matchesPlatform = selectedPlatform === 'TODAS' || p.platform === selectedPlatform;
    const matchesSearch = p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.accountEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  // Recharts Monthly Data
  const monthlyChartData = [
    { month: 'Junio', Ventas: 320, Compras: 140, Ganancia: 180 },
    { month: 'Julio', Ventas: 480, Compras: 210, Ganancia: 270 },
    { month: 'Agosto', Ventas: 650, Compras: 290, Ganancia: 360 },
    { month: 'Septiembre (Actual)', Ventas: Number(totalSalesUsd.toFixed(2)) || 740, Compras: Number(totalPurchasesCostUsd.toFixed(2)) || 310, Ganancia: Number(netProfitUsd.toFixed(2)) || 430 },
  ];

  const serviceMarginData = [
    { name: 'Netflix', Ventas: 450, Compras: 150, Margen: '66%' },
    { name: 'Max', Ventas: 230, Compras: 90, Margen: '60%' },
    { name: 'Disney+', Ventas: 180, Compras: 70, Margen: '61%' },
    { name: 'Prime Video', Ventas: 120, Compras: 40, Margen: '66%' },
    { name: 'Spotify', Ventas: 95, Compras: 30, Margen: '68%' },
  ];

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

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
          <div className="absolute top-0 right-0 p-4 text-indigo-500/20">
            <Users className="w-12 h-12" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfiles y Cuentas</p>
          <h3 className="text-2xl font-black text-white mt-2">
            {purchases.reduce((acc, p) => acc + (p.profiles?.length || 1), 0)} slots
          </h3>
          <p className="text-xs text-indigo-400 mt-1 font-medium">
            {purchases.reduce((acc, p) => acc + (p.profiles?.filter(pf => pf.status === 'available').length || 0), 0)} disponibles
          </p>
        </div>
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
          Estadísticas & Gráficos Recharts
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
