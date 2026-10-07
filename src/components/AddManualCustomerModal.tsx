import React, { useState } from 'react';
import {
  UserPlus,
  X,
  Phone,
  Mail,
  User,
  HeartHandshake,
  CheckCircle2,
  FileText,
  Sparkles
} from 'lucide-react';
import { CustomerUser } from '../types';

interface AddManualCustomerModalProps {
  onClose: () => void;
  onSaveCustomer: (customer: CustomerUser, proceedToCredit?: boolean) => void;
}

export const AddManualCustomerModal: React.FC<AddManualCustomerModalProps> = ({
  onClose,
  onSaveCustomer
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [clientType, setClientType] = useState<'tercera_edad' | 'confianza' | 'regular'>('tercera_edad');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent, proceedToCredit: boolean = false) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Por favor ingresa el nombre y el número de WhatsApp del cliente.');
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    // Auto-generate safe email if empty
    const sanitizedEmail = email.trim()
      ? email.trim().toLowerCase()
      : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${Math.floor(100 + Math.random() * 900)}@cliente.local`;

    const nowIso = new Date().toISOString();
    const newCustomer: CustomerUser = {
      id: `CUST-${Date.now()}`,
      name: cleanName,
      phone: cleanPhone,
      email: sanitizedEmail,
      role: 'cliente',
      grpayBalance: 0,
      createdAt: nowIso,
      isSeniorCitizen: clientType === 'tercera_edad',
      isTrustClient: clientType === 'confianza' || clientType === 'tercera_edad',
      notes: notes.trim() || (clientType === 'tercera_edad' ? 'Cliente de la 3era edad registrado manualmente' : 'Cliente registrado manualmente')
    };

    onSaveCustomer(newCustomer, proceedToCredit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Registrar Cliente por Primera Vez
              </h3>
              <p className="text-slate-300 text-xs">
                Se guardará en la base de datos general de clientes de la plataforma.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Clasificación */}
          <div>
            <label className="font-bold text-slate-800 text-xs block mb-1.5">
              Clasificación del Cliente:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setClientType('tercera_edad');
                  if (!notes) setNotes('Cliente de la tercera edad. Atención telefónica y formato grande.');
                }}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                  clientType === 'tercera_edad'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg block">👴</span>
                <span className="text-[11px] block mt-0.5">3era Edad</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setClientType('confianza');
                  if (!notes) setNotes('Cliente frecuente de confianza.');
                }}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                  clientType === 'confianza'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold ring-2 ring-purple-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg block">🤝</span>
                <span className="text-[11px] block mt-0.5">Frecuente</span>
              </button>

              <button
                type="button"
                onClick={() => setClientType('regular')}
                className={`p-2.5 rounded-2xl border text-center transition cursor-pointer ${
                  clientType === 'regular'
                    ? 'bg-slate-100 border-slate-700 text-slate-950 font-bold ring-2 ring-slate-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg block">👤</span>
                <span className="text-[11px] block mt-0.5">Regular</span>
              </button>
            </div>
          </div>

          {/* Nombre y Teléfono */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nombre y Apellido *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Don Héctor Ramos (Vecino)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Número de WhatsApp / Teléfono *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="Ej. 0414-3928410"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Correo Electrónico (Opcional - Si no tiene, se autogenera)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="hector.ramos@correo.com (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Notas / Referencia de Contacto
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ej. Cobra pensión los 15; avisarle a su hija María al 0412-..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Guardar en Base de Datos</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Guardar y Asignar Crédito</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
