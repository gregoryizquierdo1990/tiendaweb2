import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, CreditCard, RefreshCw, Wallet } from 'lucide-react';
import { useFaqItems } from '../store/useAppStore';

export const FAQSection: React.FC = () => {
  const storeFaqItems = useFaqItems();

  const faqs = storeFaqItems.map(f => ({
    q: f.question,
    a: f.answer,
    cat: f.category
  }));

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
