import React, { useState } from 'react';
import { PaymentMethod } from '../types';
import { Copy, Check, Building, Phone, Mail, User, ShieldAlert, MapPin, Hash, CreditCard } from 'lucide-react';

interface PaymentMethodFieldsDisplayProps {
  method: PaymentMethod;
  compact?: boolean;
  showCopyButtons?: boolean;
  showConciliationNotice?: boolean;
}

export const PaymentMethodFieldsDisplay: React.FC<PaymentMethodFieldsDisplayProps> = ({
  method,
  compact = false,
  showCopyButtons = true,
  showConciliationNotice = true
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Structured fields defined by user - following the requested explicit labels
  const primaryFields: { label: string; value?: string; key: string; isMono?: boolean; icon?: any }[] = [];
  const secondaryFields: { label: string; value?: string; key: string; isMono?: boolean; icon?: any }[] = [];

  // Primary Box 1: Number / Phone / ID
  const idValue = method.accountNumber || method.userId || method.phone;
  if (idValue) {
    primaryFields.push({ 
      label: 'Número de Cuenta / Teléfono / ID', 
      value: idValue, 
      key: 'id-field', 
      isMono: true, 
      icon: Hash 
    });
  }

  // Primary Box 2: Holder
  if (method.holderName) {
    primaryFields.push({ 
      label: 'Titular / Beneficiario', 
      value: method.holderName, 
      key: 'holder-field', 
      icon: User 
    });
  }

  // Secondary Details (Bank, Type, Doc, etc.)
  if (method.bankName) {
    secondaryFields.push({ label: 'Banco / Entidad', value: method.bankName, key: 'bankName', icon: Building });
  }
  if (method.bankCode) {
    secondaryFields.push({ label: 'Código (Cod)', value: method.bankCode, key: 'bankCode', isMono: true, icon: Hash });
  }
  if (method.accountType) {
    secondaryFields.push({ label: 'Tipo de Cuenta', value: method.accountType, key: 'accountType', icon: CreditCard });
  }
  if (method.docId) {
    secondaryFields.push({ label: 'Documento / RIF / ID', value: method.docId, key: 'docId', isMono: true, icon: ShieldAlert });
  }
  if (method.username) {
    secondaryFields.push({ label: 'Usuario App', value: method.username, key: 'username', isMono: true, icon: User });
  }
  if (method.routing) {
    secondaryFields.push({ label: 'Routing Number', value: method.routing, key: 'routing', isMono: true, icon: Hash });
  }
  if (method.bankAddress) {
    secondaryFields.push({ label: 'Dirección de Banco', value: method.bankAddress, key: 'bankAddress', icon: MapPin });
  }
  if (method.email) {
    secondaryFields.push({ label: 'Correo Electrónico', value: method.email, key: 'email', isMono: true, icon: Mail });
  }

  // Render a field box
  const renderFieldBox = (f: any, isPrimary = false) => {
    const isCopied = copiedKey === f.key;
    return (
      <div
        key={f.key}
        className={`flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all ${
          isPrimary ? 'sm:col-span-2' : ''
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-1">
          {f.icon && <f.icon className={`w-4 h-4 shrink-0 ${isPrimary ? 'text-indigo-500' : 'text-slate-400'}`} />}
          <div className="truncate">
            <span className="font-bold text-slate-500 uppercase text-[9px] block tracking-wider mb-0.5">
              {f.label}
            </span>
            <span className={`font-black text-slate-900 truncate block ${f.isMono ? 'font-mono text-sm' : 'text-sm'}`}>
              {f.value}
            </span>
          </div>
        </div>

        {showCopyButtons && f.value && (
          <button
            type="button"
            onClick={() => handleCopy(f.key, f.value!)}
            className={`p-2 rounded-xl text-[10px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              isCopied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 border-slate-200 hover:text-indigo-700 hover:border-indigo-200'
            }`}
            title={`Copiar ${f.label}`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 opacity-60" />
                <span>Copiar</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Primary fields (Account/Holder) - Vertical stacking or full width */}
      <div className="grid grid-cols-1 gap-2.5">
        {primaryFields.map((f) => renderFieldBox(f, true))}
      </div>

      {/* Secondary fields (Bank, Type, etc.) - Grid */}
      {secondaryFields.length > 0 && (
        <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-2.5'}`}>
          {secondaryFields.map((f) => renderFieldBox(f, false))}
        </div>
      )}

      {showConciliationNotice && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 font-black text-[11px] uppercase tracking-wider shadow-inner">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse shrink-0 shadow-sm" />
          <span>enviar comprobante de pago para conciliacion</span>
        </div>
      )}
    </div>
  );
};
