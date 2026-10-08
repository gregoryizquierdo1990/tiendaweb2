import React, { useState } from 'react';
import {
  FileText,
  X,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  FileSpreadsheet,
  MessageCircle,
  Copy,
  Eye,
  Bot,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  MessageTemplate,
  SheetsConnectionState,
  PlatformActionTrigger,
  ActionTemplateMapping
} from '../types';
import {
  DEFAULT_MESSAGE_TEMPLATES,
  DOMAIN_OFFICIAL,
  renderTemplate,
  PLATFORM_ACTION_DEFINITIONS,
  DEFAULT_ACTION_MAPPING
} from '../utils/messageTemplates';

interface AdminMessageTemplatesModalProps {
  templates: MessageTemplate[];
  sheetsState: SheetsConnectionState;
  bcvRate: number;
  actionMapping?: ActionTemplateMapping;
  onSaveTemplates: (updated: MessageTemplate[], updatedMapping?: ActionTemplateMapping) => void;
  onSyncWithSheets: () => Promise<void>;
  onClose: () => void;
}

export const AdminMessageTemplatesModal: React.FC<AdminMessageTemplatesModalProps> = ({
  templates,
  sheetsState,
  bcvRate,
  actionMapping,
  onSaveTemplates,
  onSyncWithSheets,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'mapping'>('editor');
  const [localTemplates, setLocalTemplates] = useState<MessageTemplate[]>(
    templates && templates.length > 0 ? templates : DEFAULT_MESSAGE_TEMPLATES
  );
  const [localMapping, setLocalMapping] = useState<ActionTemplateMapping>(
    actionMapping || DEFAULT_ACTION_MAPPING
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    localTemplates[0]?.id || 'entrega_credito_senior'
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Template Modal state
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'whatsapp' | 'bot' | 'notificacion'>('whatsapp');
  const [newDescription, setNewDescription] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAssignAction, setNewAssignAction] = useState<PlatformActionTrigger>('personalizado');

  const currentTemplate =
    localTemplates.find((t) => t.id === selectedTemplateId) || localTemplates[0];

  const handleUpdateContent = (newContentText: string) => {
    setLocalTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedTemplateId
          ? { ...t, content: newContentText, lastModified: new Date().toISOString() }
          : t
      )
    );
  };

  const handleInsertVariable = (variable: string) => {
    if (!currentTemplate) return;
    const newContentText = currentTemplate.content + ' ' + variable;
    handleUpdateContent(newContentText);
  };

  const handleResetToDefault = () => {
    const defaultOne = DEFAULT_MESSAGE_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (defaultOne) {
      handleUpdateContent(defaultOne.content);
    }
  };

  const handleSaveAll = () => {
    onSaveTemplates(localTemplates, localMapping);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSyncSheets = async () => {
    try {
      setIsSyncing(true);
      await onSyncWithSheets();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Por favor completa el título y el contenido de la plantilla.');
      return;
    }

    const templateId = `custom_${Date.now()}`;
    const createdTemplate: MessageTemplate = {
      id: templateId,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Plantilla personalizada creada por el administrador.',
      content: newContent.trim(),
      variables: [
        '{cliente}',
        '{servicio}',
        '{tipo_cuenta}',
        '{duracion}',
        '{usuario}',
        '{clave}',
        '{perfil}',
        '{pin}',
        '{monto_usd}',
        '{monto_bs}',
        '{fecha_limite}',
        '{fecha_vencimiento}',
        '{tasa_bcv}',
        '{dominio}'
      ],
      isCustom: true,
      lastModified: new Date().toISOString()
    };

    setLocalTemplates((prev) => [...prev, createdTemplate]);
    setSelectedTemplateId(templateId);

    // If user chose to assign it directly to an action
    if (newAssignAction !== 'personalizado') {
      setLocalMapping((prev) => ({
        ...prev,
        [newAssignAction]: templateId
      }));
    }

    setIsNewTemplateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewContent('');
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    const target = localTemplates.find((t) => t.id === templateId);
    if (!target?.isCustom) {
      alert('No se pueden eliminar las plantillas esenciales del sistema.');
      return;
    }

    if (window.confirm(`¿Estás seguro de eliminar la plantilla personalizada "${target.title}"?`)) {
      setLocalTemplates((prev) => prev.filter((t) => t.id !== templateId));

      // Reset mapping if this template was assigned to any action
      setLocalMapping((prev) => {
        const next = { ...prev };
        for (const [actionKey, mappedId] of Object.entries(next)) {
          if (mappedId === templateId) {
            next[actionKey as PlatformActionTrigger] =
              DEFAULT_ACTION_MAPPING[actionKey as PlatformActionTrigger] || '';
          }
        }
        return next;
      });

      setSelectedTemplateId(localTemplates[0]?.id || 'entrega_credito_senior');
    }
  };

  // Preview data
  const sampleVariables = {
    cliente: 'Don Pedro Martínez',
    servicio: 'Netflix Premium',
    tipo_cuenta: 'Perfil con PIN',
    duracion: '1 mes',
    usuario: 'pedro.martinez@gmail.com',
    clave: 'Segura2026*',
    perfil: 'Don Pedro',
    pin: '7821',
    monto_usd: '4.50',
    monto_bs: (4.5 * bcvRate).toFixed(2),
    fecha_limite: '15 de Octubre de 2026',
    fecha_vencimiento: '29 de Octubre de 2026',
    tasa_bcv: bcvRate.toFixed(2),
    banco: 'Banesco (0134)',
    pago_movil: '0414-3928410',
    cedula: '20.892.410',
    monto_renovacion_usd: '4.50',
    monto_renovacion_bs: (4.5 * bcvRate).toFixed(2),
    saldo_actual: '15.00',
    tiempo_atencion: '15 minutos',
    dominio: DOMAIN_OFFICIAL
  };

  const livePreview = currentTemplate
    ? renderTemplate(currentTemplate.content, sampleVariables)
    : '';

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Gestor de Plantillas & Asignador de Acciones
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {(DOMAIN_OFFICIAL || '').replace('https://', '')}
                </span>
              </div>
              <p className="text-slate-300 text-xs">
                Crea nuevas plantillas y define en qué acción o sección de la tienda se disparará cada una.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sheetsState.isConnected && (
              <button
                type="button"
                onClick={handleSyncSheets}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Sincronizar plantillas con la hoja de Google Sheets en Drive"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isSyncing ? 'Sincronizando...' : 'Exportar a Google Sheets'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector: Editor de Plantillas vs Asignador de Acciones */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Plantillas ({localTemplates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mapping')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'mapping'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Asignación de Acciones (7 eventos)</span>
            </button>
          </div>

          {activeTab === 'editor' && (
            <button
              type="button"
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nueva Plantilla</span>
            </button>
          )}
        </div>

        {/* Workspace Body */}
        {activeTab === 'editor' ? (
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Left Column: Template Selector List */}
            <div className="w-full md:w-72 p-4 bg-slate-50 space-y-1.5 shrink-0 overflow-y-auto max-h-[680px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Plantillas Disponibles
              </span>
              {localTemplates.map((t) => (
                <div key={t.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedTemplateId === t.id
                        ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-200'
                        : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pr-6">
                      <div className="flex items-center gap-1.5">
                        {t.category === 'whatsapp' ? (
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-slate-900 line-clamp-1">{t.title}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{t.description}</p>
                    {t.isCustom && (
                      <span className="mt-1.5 inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                        ⭐ Creada por ti
                      </span>
                    )}
                  </button>

                  {t.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomTemplate(t.id)}
                      className="absolute right-2 top-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Eliminar plantilla personalizada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column: Template Editor & Live Preview */}
            {currentTemplate && (
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{currentTemplate.title}</h4>
                      {currentTemplate.isCustom && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">
                          Personalizada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{currentTemplate.description}</p>
                  </div>

                  {!currentTemplate.isCustom && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium shrink-0"
                      title="Restablecer a la redacción sugerida original"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer</span>
                    </button>
                  )}
                </div>

                {/* Variables Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block mb-1">
                    Variables disponibles (haz clic para insertar en el texto):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentTemplate.variables.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => handleInsertVariable(variable)}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-mono font-semibold transition cursor-pointer border border-indigo-200"
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Textarea */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Contenido de la plantilla:
                  </label>
                  <textarea
                    rows={8}
                    value={currentTemplate.content}
                    onChange={(e) => handleUpdateContent(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  />
                </div>

                {/* Live Preview */}
                <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>Vista previa del mensaje final:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{DOMAIN_OFFICIAL}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed shadow-xs">
                    {livePreview}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: ASIGNADOR DE ACCIONES DE LA PLATAFORMA */
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-3">
              <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm">
                  Configuración de Disparadores Automáticos & Manuales
                </strong>
                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                  Aquí defines qué plantilla exacta se enviará para cada evento de la plataforma. Puedes asignar tus propias plantillas personalizadas o las oficiales del sistema.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLATFORM_ACTION_DEFINITIONS.map((action) => {
                const assignedTemplateId = localMapping[action.id] || action.defaultTemplateId;
                const assignedTemplate =
                  localTemplates.find((t) => t.id === assignedTemplateId) ||
                  localTemplates[0];

                return (
                  <div
                    key={action.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                          Acción #{action.category.toUpperCase()}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{action.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Plantilla asignada a esta acción:
                      </label>
                      <select
                        value={assignedTemplateId}
                        onChange={(e) => {
                          const newTmplId = e.target.value;
                          setLocalMapping((prev) => ({
                            ...prev,
                            [action.id]: newTmplId
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {localTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} {t.isCustom ? '(⭐ Personalizada)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {assignedTemplate && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 line-clamp-2 italic font-mono">
                        "{assignedTemplate.content.substring(0, 110)}..."
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>¡Plantillas y asignaciones guardadas con éxito!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Todo</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: CREAR NUEVA PLANTILLA */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-lg space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Crear Nueva Plantilla Personalizada</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Recordatorio 3 Días Antes (Preventivo)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Canal Principal
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="bot">Bot Asistente</option>
                    <option value="notificacion">Notificación</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Asignar a Acción Ahora:
                  </label>
                  <select
                    value={newAssignAction}
                    onChange={(e) => setNewAssignAction(e.target.value as PlatformActionTrigger)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                  >
                    <option value="personalizado">Ninguna (Uso libre / Manual)</option>
                    <option value="aviso_vencimiento">4. Aviso de Vencimiento / Renovación</option>
                    <option value="cobro_credito">3. Recordatorio Amable de Cobro</option>
                    <option value="entrega_credito">2. Entrega a Crédito</option>
                    <option value="entrega_regular">1. Entrega Regular</option>
                    <option value="bienvenida_cliente">5. Bienvenida a Nuevos Clientes</option>
                    <option value="recarga_wallet">6. Recarga Zeny Acreditada</option>
                    <option value="soporte_falla">7. Respuesta a Incidencias</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Descripción Breve:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mensaje cordial de renovación con 3 días de antelación"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Contenido del Mensaje *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`Hola *{cliente}*, te recordamos que tu servicio de *{servicio}* vence el {fecha_vencimiento}. Renovación: \${monto_renovacion_usd} USD (Bs. {monto_renovacion_bs} BCV). Visítanos en {dominio}`}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Plantilla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
