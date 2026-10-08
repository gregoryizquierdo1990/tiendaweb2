import React, { useState } from 'react';
import { Check, ShieldCheck, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { Product, PlanDuration, CurrencyCode, CustomerUser } from '../types';
import { formatCurrency, calculateDiscountedPrice } from '../utils/formatters';

interface ProductCardProps {
  product: Product;
  currency: CurrencyCode;
  bcvRate: number;
  customerUser?: CustomerUser | null;
  onSelectProduct: (product: Product, duration: PlanDuration) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  bcvRate,
  customerUser,
  onSelectProduct
}) => {
  const availableDurations = Object.keys(product.prices) as PlanDuration[];
  const initialDuration = product.prices[product.defaultDuration]
    ? product.defaultDuration
    : (availableDurations[0] || '1 mes');

  const [selectedDuration, setSelectedDuration] = useState<PlanDuration>(initialDuration);

  // Fallback if selected duration not in prices
  const safeDuration = product.prices[selectedDuration] ? selectedDuration : (availableDurations[0] || '1 mes');
  const basePriceUsd = product.prices[safeDuration]?.USD || 3.0;

  // Calculate discount for product or customer
  const { finalPrice: finalPriceUsd, discountPercent, savings } = calculateDiscountedPrice(
    basePriceUsd,
    product.discountPercent,
    customerUser?.discountPercent,
    customerUser?.role
  );

  const priceBs = Number((finalPriceUsd * bcvRate).toFixed(2));
  const currentPrice = currency === 'BS' ? priceBs : finalPriceUsd;

  const originalPriceBs = Number((basePriceUsd * bcvRate).toFixed(2));
  const originalDisplayPrice = currency === 'BS' ? originalPriceBs : basePriceUsd;

  return (
    <div className={`relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group ${
      product.popular ? 'ring-2 ring-indigo-500/20' : ''
    }`}>
      {/* Top Brand & Badges */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: product.color || '#4f46e5' }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {product.brand}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
              <Tag className="w-3 h-3" />
              {discountPercent}% OFF
            </span>
          )}

          {product.badgeText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {product.badgeText}
            </span>
          )}

          {product.popular && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Popular
            </span>
          )}
        </div>
      </div>

      {/* Title & Tagline */}
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition">
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {product.tagline}
        </p>
      </div>

      {/* Account Type & Warranty & Stock */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs font-medium">
        <span className={`px-2.5 py-1 rounded-lg border font-semibold ${
          product.accountType === 'Perfil privado'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : product.accountType === 'Cuenta compartida'
            ? 'bg-sky-50 text-sky-700 border-sky-200'
            : 'bg-slate-100 text-slate-700 border-slate-200/60'
        }`}>
          {product.accountType}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          {product.warrantyMonths} mes garantía
        </span>
        <span className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 ${
          (product.stock ?? 0) > 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-100'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            (product.stock ?? 0) > 0 ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
          {(product.stock ?? 0) > 0 ? `${product.stock} disponibles` : 'Agotado'}
        </span>
      </div>

      {/* Duration Selector Tabs */}
      <div className="mb-5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Seleccionar Duración:</span>
          {availableDurations.length > 4 && (
            <span className="text-[10px] text-indigo-600 font-bold">10d, 15d, 1m+</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {availableDurations.map((dur) => (
            <button
              key={dur}
              type="button"
              onClick={() => setSelectedDuration(dur)}
              className={`flex-1 min-w-[50px] py-1.5 text-center text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap px-1.5 ${
                safeDuration === dur
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dur.replace(' meses', 'm').replace(' mes', 'm').replace(' días', 'd').replace(' día', 'd')}
            </button>
          ))}
        </div>
      </div>

      {/* Price Display */}
      <div className="mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(currentPrice, currency)}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            / {safeDuration}
          </span>
        </div>

        {discountPercent > 0 && (
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="line-through text-slate-400 font-medium">
              {formatCurrency(originalDisplayPrice, currency)}
            </span>
            <span className="text-rose-600 font-bold">
              ¡Ahorras {discountPercent}% ({currency === 'BS' ? `Bs. ${(savings * bcvRate).toFixed(2)}` : `$${savings.toFixed(2)}`})!
            </span>
          </div>
        )}

        {currency === 'BS' && (
          <div className="text-[11px] text-slate-400 mt-0.5">
            Equivalente: ${finalPriceUsd.toFixed(2)} USD (Tasa BCV {bcvRate})
          </div>
        )}
      </div>

      {/* Features checklist */}
      <ul className="space-y-2 mb-6 text-xs text-slate-600">
        {product.features.slice(0, 4).map((feat, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-tight">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        type="button"
        disabled={(product.stock ?? 0) === 0}
        onClick={() => onSelectProduct(product, safeDuration)}
        className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
          (product.stock ?? 0) > 0
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-indigo-100'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none hover:bg-slate-200'
        }`}
      >
        <span>{(product.stock ?? 0) > 0 ? 'Comprar Ahora' : 'Agotado'}</span>
        {(product.stock ?? 0) > 0 && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        )}
      </button>
    </div>
  );
};
