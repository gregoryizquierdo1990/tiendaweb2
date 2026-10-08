import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, CreditCard, RefreshCw, Wallet } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const faqs = [
    {
      q: '¿Cómo funciona la pasarela de pago con conciliación manual?',
      a: 'Seleccionas tu plataforma y plan (1, 3, 6 o 12 meses). Puedes pagar en Dólares ($ USD) o en Bolívares (Bs.) calculados a la tasa oficial del BCV. Contamos con 9 métodos de pago: Cuenta en EEUU (Zelle / ACH), Airtm, Pago Móvil (Venezuela), Binance Pay (USDT), Banco Pichincha (Ecuador), Wally, Zinli, UglyCash y TDC (Banesco Conecta). Realizas la transferencia, ingresas tu número de referencia bancario y nuestro equipo valida el ingreso en minutos para activar tu suscripción.'
    },
    {
      q: '¿Qué es la Wallet Zeny y cómo funciona?',
      a: 'Zeny es la moneda y billetera interna de StreamSync (1 Zeny = 1 USD / 1 USDT / equivalente en Bs. a tasa BCV). Puedes solicitar recargas de saldo abonando por cualquiera de nuestros métodos de pago. Una vez que el administrador acredita tu saldo en tu cuenta, puedes adquirir o renovar suscripciones con 1 solo clic y activación inmediata sin esperas. Importante: este saldo es exclusivo para compras y renovaciones en la plataforma, no es retirable ni canjeable por efectivo.'
    },
    {
      q: '¿Cómo se actualiza la tasa oficial del Banco Central de Venezuela (BCV)?',
      a: 'Nuestra plataforma se conecta diariamente y de forma automática a los servicios oficiales del BCV para actualizar el valor en Bolívares. Además, el administrador tiene la facultad de ajustar o fijar la tasa manualmente desde el panel de control si fuera necesario.'
    },
    {
      q: '¿Dónde veo mis cuentas activas y su fecha de vencimiento?',
      a: 'Al registrarte en el Área de Clientes con tu correo y contraseña, dispones de una pestaña llamada "Mis Suscripciones & Vencimientos". Allí verás cada servicio contratado, tus credenciales de acceso (usuario, clave, perfil y PIN) y una cuenta regresiva con los días exactos que restan para el vencimiento de cada pantalla.'
    },
    {
      q: '¿Cómo se guardan los datos en Google Sheets?',
      a: 'La plataforma integra Google Sheets oficial de tu Google Drive. Cada pedido, usuario y recarga se refleja en tiempo real en tu hoja de cálculo, permitiéndote llevar el control administrativo de tu negocio sin depender de bases de datos externas.'
    },
    {
      q: '¿Qué garantía tienen las cuentas de streaming?',
      a: 'Todas nuestras cuentas y pantallas cuentan con garantía total durante el 100% de la duración contratada (30, 90, 180 o 365 días). Si alguna plataforma presenta caída o bloqueo por actualización, nuestro equipo de soporte te restituye el perfil o cuenta en menos de 30 minutos sin costo adicional.'
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 bg-slate-50/70 border-t border-slate-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Respuestas Rápidas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Preguntas Frecuentes
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Todo sobre los 9 métodos de pago, wallet Zeny, tasa BCV y garantías.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <span className="font-bold text-slate-900 text-sm">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-indigo-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
