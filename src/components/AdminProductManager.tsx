import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Tag,
  ShieldCheck,
  Tv,
  DollarSign,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Product, PlanDuration, ServiceCategory, AccountType } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AdminProductManagerProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  bcvRate: number;
}

const COMMON_ACCOUNT_TYPES = [
  'Perfil privado',
  'Cuenta compartida',
  'Perfil con PIN',
  'Cuenta Completa',
  'Activación a tu Correo',
  'Código de Canje'
];

const STANDARD_DURATIONS: PlanDuration[] = [
  '10 días',
  '15 días',
  '30 días',
  '1 mes',
  '3 meses',
  '6 meses',
  '90 días',
  '180 días',
  '12 meses'
];

export const AdminProductManager: React.FC<AdminProductManagerProps> = ({
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  bcvRate
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'todos'>('todos');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form states for Editing or Creating
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCategory>('series_peliculas');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAccountType, setFormAccountType] = useState<AccountType>('Perfil privado');
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(0);
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formScreens, setFormScreens] = useState<number>(1);
  const [formWarrantyMonths, setFormWarrantyMonths] = useState<number>(1);
  const [formInStock, setFormInStock] = useState<boolean>(true);
  const [formPopular, setFormPopular] = useState<boolean>(false);
  const [formIsStockManual, setFormIsStockManual] = useState<boolean>(false);
  const [formManualStock, setFormManualStock] = useState<number>(10);
  const [formColor, setFormColor] = useState('#4f46e5');
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  
  // Pricing states
  const [pricesState, setPricesState] = useState<Record<string, number>>({});

  const filteredProducts = products.filter((p) => {
    const matchCat = categoryFilter === 'todos' ? true : p.category === categoryFilter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.accountType.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsCreatingNew(false);
    setFormName(prod.name);
    setFormBrand(prod.brand);
    setFormCategory(prod.category);
    setFormTagline(prod.tagline || '');
    setFormDescription(prod.description || '');
    setFormAccountType(prod.accountType || 'Perfil privado');
    setFormDiscountPercent(prod.discountPercent || 0);
    setFormBadgeText(prod.badgeText || '');
    setFormScreens(prod.screens || 1);
    setFormWarrantyMonths(prod.warrantyMonths || 1);
    setFormInStock(prod.inStock);
    setFormPopular(Boolean(prod.popular));
    setFormIsStockManual(Boolean(prod.isStockManual));
    setFormManualStock(prod.manualStock ?? prod.stock ?? 10);
    setFormColor(prod.color || '#4f46e5');
    setFormFeatures(prod.features || []);

    const pState: Record<string, number> = {};
    Object.keys(prod.prices).forEach((dur) => {
      pState[dur] = prod.prices[dur as PlanDuration]?.USD || 0;
    });
    setPricesState(pState);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormBrand('');
    setFormCategory('series_peliculas');
    setFormTagline('Acceso garantizado y activación rápida');
    setFormDescription('Cuenta o pantalla de streaming con soporte directo');
    setFormAccountType('Perfil privado');
    setFormDiscountPercent(0);
    setFormBadgeText('');
    setFormScreens(1);
    setFormWarrantyMonths(1);
    setFormInStock(true);
    setFormPopular(false);
    setFormIsStockManual(false);
    setFormManualStock(10);
    setFormColor('#4f46e5');
    setFormFeatures([
      'Calidad Ultra HD 4K',
      'Sin caídas, renovación en la misma cuenta',
      'Garantía total durante todo el periodo'
    ]);
    setPricesState({
      '30 días': 3.0
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBrand.trim()) return;

    const formattedPrices: Record<string, { USD: number }> = {};
    Object.keys(pricesState).forEach((d) => {
      const val = Number(pricesState[d]);
      if (!isNaN(val) && val > 0) {
        formattedPrices[d] = { USD: val };
      }
    });

    const targetProduct: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formName.trim(),
      brand: formBrand.trim(),
      category: formCategory,
      tagline: formTagline.trim(),
      description: formDescription.trim(),
      accountType: formAccountType,
      discountPercent: formDiscountPercent > 0 ? formDiscountPercent : undefined,
      badgeText: formBadgeText.trim() || undefined,
      screens: formScreens,
      warrantyMonths: formWarrantyMonths,
      inStock: formInStock,
      popular: formPopular,
      isStockManual: formIsStockManual,
      manualStock: formManualStock,
      stock: formIsStockManual ? formManualStock : (editingProduct?.stock ?? 10),
      color: formColor,
      accentBg: editingProduct?.accentBg || 'from-indigo-50 to-blue-100/50',
      logo: editingProduct?.logo || '',
      defaultDuration: editingProduct?.defaultDuration || Object.keys(formattedPrices)[0] || '30 días',
      features: formFeatures.length > 0 ? formFeatures : ['Garantía total de servicio'],
      prices: formattedPrices
    };

    if (editingProduct) {
      onUpdateProduct(targetProduct);
    } else {
      onAddProduct(targetProduct);
    }

    setEditingProduct(null);
    setIsCreatingNew(false);
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormFeatures([...formFeatures, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            Editor de Servicios & Tarjetas del Catálogo
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Personaliza el contenido de cada tarjeta: Perfil privado, cuenta compartida, precios por duración y descuentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por servicio, marca o tipo de cuenta..."
            className="w-full text-xs bg-transparent border-none focus:outline-hidden text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {(['todos', 'series_peliculas', 'musica', 'deportes_tv', 'gaming_otros', 'combos'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'todos' ? 'Todos' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Table/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((prod) => {
          const priceEntries = Object.entries(prod.prices);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: prod.color || '#4f46e5' }}
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        {prod.brand}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {prod.name}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                      title="Editar contenido de tarjeta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar ${prod.name} del catálogo?`)) {
                          onDeleteProduct(prod.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                  {prod.tagline}
                </p>

                {/* Account Type Badge & Discount */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                    prod.accountType === 'Perfil privado'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : prod.accountType === 'Cuenta compartida'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {prod.accountType}
                  </span>

                  {prod.discountPercent && prod.discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded-md font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                      -{prod.discountPercent}% OFF
                    </span>
                  )}

                  {prod.badgeText && (
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {prod.badgeText}
                    </span>
                  )}

                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                    prod.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {prod.inStock ? 'En Stock' : 'Agotado'}
                  </span>
                </div>

                {/* Duration Prices preview */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tarifas Configuradas en USD:
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                    {priceEntries.map(([dur, pObj]) => (
                      <div key={dur} className="truncate">
                        {dur}: <strong>${pObj.USD}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{prod.screens} Pantalla(s) • {prod.warrantyMonths}m garantía</span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(prod)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Editar Tarjeta →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Edit / Create Modal Window */}
      {(editingProduct || isCreatingNew) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingProduct ? `Editar Tarjeta: ${formName || editingProduct.name}` : 'Crear Nuevo Servicio'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define tipo de cuenta, precios por duración y descuentos para la tienda
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsCreatingNew(false);
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nombre del Servicio *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Netflix Premium 4K"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Marca / Plataforma *</label>
                  <input
                    type="text"
                    required
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ej. Netflix, Disney+, Spotify..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tagline & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Categoría</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="series_peliculas">Series y Películas</option>
                    <option value="musica">Música & Audio</option>
                    <option value="deportes_tv">Deportes & Televisión en Vivo</option>
                    <option value="gaming_otros">Gaming, Utilidades & Otros</option>
                    <option value="combos">Combos & Paquetes</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Color de Marca (HEX)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Subtítulo o Lema en la Tarjeta</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="Ej. Calidad Ultra HD 4K + HDR con entrega inmediata"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Account Type */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
                <label className="block font-bold text-indigo-950 text-xs">
                  Tipo de Cuenta / Servicio (Visible en la Tarjeta) *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ACCOUNT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormAccountType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        formAccountType === type
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    required
                    value={formAccountType}
                    onChange={(e) => setFormAccountType(e.target.value)}
                    placeholder="Escribe el tipo de cuenta personalizado..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-indigo-200 text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Pricing by Duration Matrix */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-xs">
                    Precios en Dólares (USD) por Duración:
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tasa actual: {bcvRate} Bs/USD
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {STANDARD_DURATIONS.map((dur) => (
                    <div key={dur} className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 text-xs block mb-1">
                        {dur}:
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pricesState[dur] || 0}
                          onChange={(e) =>
                            setPricesState({
                              ...pricesState,
                              [dur]: parseFloat(e.target.value) || 0
                            })
                          }
                          placeholder="0.00"
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        ≈ Bs. {(((pricesState[dur] || 0)) * bcvRate).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Badges */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-3">
                <h4 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-600" />
                  <span>Descuentos y Promociones Especiales</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Descuento en Precio (% de Descuento)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={formDiscountPercent}
                        onChange={(e) => setFormDiscountPercent(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="Ej. 10 para 10% OFF"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-mono font-bold"
                      />
                      <span className="font-bold text-rose-700">% OFF</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Insignia Promocional (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      placeholder="Ej. Oferta Especial, Más Vendido..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles & Features */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInStock}
                    onChange={(e) => setFormInStock(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">En Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPopular}
                    onChange={(e) => setFormPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">Destacado</span>
                </label>

                <div>
                  <span className="block text-[10px] font-semibold text-slate-500">Pantallas:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formScreens}
                    onChange={(e) => setFormScreens(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 rounded-lg border bg-white text-xs font-bold"
                  />
                </div>

                <div>
                  <span className="block text-[10px] font-semibold text-slate-500">Meses Garantía:</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formWarrantyMonths}
                    onChange={(e) => setFormWarrantyMonths(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 rounded-lg border bg-white text-xs font-bold"
                  />
                </div>
              </div>

              {/* Control de Existencia e Inventario */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <span>📦 Control de Existencia & Inventario</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Sincroniza automáticamente el stock con los perfiles libres de las Cuentas Madre o fíjalo de manera manual.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-xl border border-amber-200">
                    <input
                      type="checkbox"
                      checked={formIsStockManual}
                      onChange={(e) => setFormIsStockManual(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Existencia Manual</span>
                      <span className="text-[9px] text-slate-400 block">Ignorar perfiles automáticos de cuentas madre</span>
                    </div>
                  </label>

                  <div className={`p-3 rounded-xl border transition ${
                    formIsStockManual ? 'bg-white border-amber-200' : 'bg-slate-100/50 border-slate-200 text-slate-400'
                  }`}>
                    <label className="block font-semibold text-xs mb-1">
                      Cantidad en Existencia:
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={!formIsStockManual}
                      value={formManualStock}
                      onChange={(e) => setFormManualStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 rounded-lg border bg-white text-xs font-mono font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Features Editor */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Beneficios y Características de la Tarjeta
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Ej. Pantalla exclusiva sin caídas"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {formFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-100 text-slate-700 text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios de Tarjeta' : 'Crear y Publicar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
