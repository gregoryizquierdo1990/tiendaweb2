import React, { useState } from 'react';
import {
  Receipt, Package, RotateCcw, BarChart3, CreditCard, Wallet,
  Clock, Tv, Users, HeartHandshake, Layers, CalendarDays, Bell, Building, AlertTriangle,
  Palette, Bot, FileText, TrendingUp, TrendingDown, BookOpen,
  ClipboardList, ShieldCheck,
  FileSpreadsheet, Globe, HelpCircle, Megaphone,
  ChevronDown, ChevronRight, Search
} from 'lucide-react';
import { useToggleGeminiPanel } from '../store/useAppStore';

export interface MenuItemDef {
  id: string;
  label: string;
  icon: React.ElementType;
  badgeKey?: string;
  color?: string;
}

export interface MenuCategoryDef {
  category: string;
  description: string;
  items: MenuItemDef[];
}

export const MENU_STRUCTURE: MenuCategoryDef[] = [
  {
    category: 'Finanzas',
    description: 'Facturas, compras, gastos, contabilidad y conciliación',
    items: [
      { id: 'billing_contracts', label: 'Facturación y Contratos', icon: Receipt, color: 'text-emerald-400' },
      { id: 'purchases_finance', label: 'Compras & Finanzas', icon: Package, color: 'text-indigo-400' },
      { id: 'expenses', label: 'Gastos & Egresos', icon: TrendingDown, color: 'text-rose-400' },
      { id: 'refunds', label: 'Reversos & Devoluciones', icon: RotateCcw, color: 'text-rose-400' },
      { id: 'finance', label: 'Conciliación Mensual', icon: BarChart3, color: 'text-emerald-400' },
      { id: 'methods', label: 'Métodos de Pago', icon: CreditCard, color: 'text-slate-400' },
      { id: 'topups', label: 'Wallet Zeny', icon: Wallet, badgeKey: 'topups', color: 'text-emerald-400' },
    ]
  },
  {
    category: 'Gestión',
    description: 'Ventas, clientes, créditos y catálogos',
    items: [
      { id: 'reconciliation', label: 'Ventas & Pedidos', icon: Clock, badgeKey: 'orders', color: 'text-indigo-400' },
      { id: 'products', label: 'Catálogo & Tarjetas', icon: Tv, color: 'text-indigo-400' },
      { id: 'clients', label: 'Clientes', icon: Users, color: 'text-sky-400' },
      { id: 'credits', label: 'Créditos & Cobranzas', icon: HeartHandshake, badgeKey: 'credits', color: 'text-amber-400' },
      { id: 'installments', label: 'Gestión de Cuotas', icon: Layers, badgeKey: 'installments', color: 'text-amber-400' },
      { id: 'calendar', label: 'Calendario Vencimientos', icon: CalendarDays, color: 'text-indigo-400' },
      { id: 'incidents', label: 'Incidencias', icon: AlertTriangle, badgeKey: 'incidents', color: 'text-rose-400' },
    ]
  },
  {
    category: 'Configuración',
    description: 'Categorías de servicios, bots, tasas y plantillas',
    items: [
      { id: 'categories', label: 'Categorías de Servicios', icon: Layers, color: 'text-amber-400' },
      { id: 'telegram_bot', label: 'Bot de Telegram', icon: Bot, color: 'text-sky-400' },
      { id: 'templates', label: 'Plantillas de Mensajes', icon: FileText, color: 'text-indigo-400' },
      { id: 'bcv', label: 'Tasa BCV', icon: TrendingUp, color: 'text-amber-400' },
      { id: 'footer_config', label: 'Pie de Página (Footer)', icon: Palette, color: 'text-pink-400' },
    ]
  },
  {
    category: 'Marketing',
    description: 'Campañas, redes sociales y comunidades',
    items: [
      { id: 'marketing', label: 'Módulo de Marketing Pro', icon: Megaphone, color: 'text-indigo-400' }
    ]
  },
  {
    category: 'Seguridad',
    description: 'Auditoría, bitácora y usuarios',
    items: [
      { id: 'bitacora', label: 'Bitácora de Auditoría', icon: ClipboardList, color: 'text-rose-400' },
      { id: 'users', label: 'Usuarios Administradores', icon: ShieldCheck, color: 'text-purple-400' },
    ]
  },
  {
    category: 'Sistemas',
    description: 'Bases de datos, nube, integraciones y dominio',
    items: [
      { id: 'integrations', label: 'Catálogo de Integraciones', icon: Layers, color: 'text-purple-400' },
      { id: 'domain', label: 'Dominio Oficial', icon: Globe, color: 'text-emerald-400' },
      { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle, color: 'text-slate-400' },
    ]
  }
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  badges?: Record<string, number | boolean>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, badges = {} }) => {
  const toggleGemini = useToggleGeminiPanel();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'Finanzas',
    'Gestión',
    'Configuración',
    'Marketing',
    'Seguridad',
    'Sistemas'
  ]);
  const [search, setSearch] = useState('');

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const filteredMenu = MENU_STRUCTURE.map(section => {
    const items = section.items.filter(item =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      section.category.toLowerCase().includes(search.toLowerCase())
    );
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  return (
    <aside className="w-72 bg-slate-950 text-slate-300 h-full overflow-y-auto shrink-0 flex flex-col border-r border-slate-800 select-none shadow-xl">
      {/* Header Info */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Navegación Modular
          </span>
        </div>
        <button
          onClick={toggleGemini}
          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 transition cursor-pointer"
          title="Abrir Gemini IA"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar sección o módulo..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 py-2 px-2 space-y-3">
        {filteredMenu.map((section) => {
          const isExpanded = expandedCategories.includes(section.category) || search.trim().length > 0;
          
          // Calculate category total badge count
          const categoryBadgeCount = section.items.reduce((acc, it) => {
            if (it.badgeKey && typeof badges[it.badgeKey] === 'number') {
              return acc + (badges[it.badgeKey] as number);
            }
            return acc;
          }, 0);

          return (
            <div key={section.category} className="rounded-xl overflow-hidden bg-slate-900/40 border border-slate-800/60">
              <button
                type="button"
                onClick={() => toggleCategory(section.category)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    {section.category}
                  </span>
                  {categoryBadgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {categoryBadgeCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-1 space-y-0.5 border-t border-slate-800/40">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const badgeVal = item.badgeKey ? badges[item.badgeKey] : undefined;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30'
                            : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color || 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Badges */}
                        {typeof badgeVal === 'number' && badgeVal > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                              isActive
                                ? 'bg-white text-indigo-900'
                                : 'bg-amber-400 text-slate-950 shadow-xs'
                            }`}
                          >
                            {badgeVal}
                          </span>
                        )}

                        {item.badgeKey === 'sheets' && Boolean(badgeVal) && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="font-mono">v2026.3 Modular</span>
        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
          ● En Línea
        </span>
      </div>
    </aside>
  );
};
