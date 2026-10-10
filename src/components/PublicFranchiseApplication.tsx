import React, { useState } from 'react';
import { Building, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { FranchiseApplication } from '../types';
import { syncFranchiseApplicationToFirestore } from '../services/firestoreService';

interface PublicFranchiseApplicationProps {
  onClose: () => void;
}

export const PublicFranchiseApplication: React.FC<PublicFranchiseApplicationProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    telegramUser: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const newApp: FranchiseApplication = {
        id: `APP-${Date.now()}`,
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await syncFranchiseApplicationToFirestore(newApp);
      setIsSubmitted(true);
    } catch (err) {
      setError('Error al enviar la solicitud. Por favor intente nuevamente.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans']">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 text-center shadow-2xl border border-slate-700">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">¡Solicitud Enviada!</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Hemos recibido tu solicitud para formar parte de nuestra red de franquicias. 
            Nuestro equipo revisará tu información y te contactaremos a la brevedad.
          </p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
          >
            Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-['Plus_Jakarta_Sans']">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a la tienda</span>
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-semibold border border-indigo-500/20">
              <Building className="w-4 h-4" />
              <span>Oportunidad de Negocio</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Únete a nuestra red de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Franquiciados Elite</span>
            </h1>
            
            <p className="text-lg text-slate-400 leading-relaxed">
              Expande tu negocio de streaming con nuestra infraestructura robusta, 
              precios competitivos y soporte técnico especializado. 
              Completa el formulario y comienza tu camino al éxito hoy mismo.
            </p>

            <div className="space-y-6">
              {[
                { title: 'Plataforma Propia', desc: 'Acceso a un panel administrativo exclusivo para gestionar tus clientes.' },
                { title: 'Garantía Total', desc: 'Respaldo absoluto en todas las cuentas y servicios que ofrezcas.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Building className="w-32 h-32 text-indigo-500" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del Negocio / Marca</label>
                  <input
                    required
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    placeholder="Ej: StreamPlus Venezuela"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del Propietario</label>
                  <input
                    required
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Correo Electrónico</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">WhatsApp / Teléfono</label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                      placeholder="+58 412..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Usuario de Telegram (Opcional)</label>
                  <input
                    type="text"
                    value={formData.telegramUser}
                    onChange={(e) => setFormData({ ...formData, telegramUser: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    placeholder="@usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Notas Adicionales</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500 resize-none"
                    placeholder="Cuéntanos un poco sobre tu experiencia o planes..."
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                disabled={isSubmitting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar Solicitud</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
