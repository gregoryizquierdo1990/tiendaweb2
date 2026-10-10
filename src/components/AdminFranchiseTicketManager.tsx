import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, MessageSquare, Clock, AlertCircle, 
  Search, Filter, Send, User, Building, 
  CheckCircle2, XCircle, MoreVertical, Paperclip,
  ChevronRight, ArrowLeft
} from 'lucide-react';
import { FranchiseTicket, TicketMessage, TicketStatus, TicketPriority, TicketCategory } from '../types';

interface AdminFranchiseTicketManagerProps {
  tickets: FranchiseTicket[];
  onUpdateTicket: (ticket: FranchiseTicket) => void;
  adminName: string;
}

export const AdminFranchiseTicketManager: React.FC<AdminFranchiseTicketManagerProps> = ({
  tickets,
  onUpdateTicket,
  adminName
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.franchiseName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedTicket = useMemo(() => 
    tickets.find(t => t.id === selectedTicketId),
  [tickets, selectedTicketId]);

  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return;

    const message: TicketMessage = {
      id: `MSG-${Date.now()}`,
      senderId: 'admin',
      senderName: adminName,
      senderRole: 'admin',
      content: newMessage,
      createdAt: new Date().toISOString()
    };

    const updatedTicket: FranchiseTicket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, message],
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status
    };

    onUpdateTicket(updatedTicket);
    setNewMessage('');
  };

  const handleUpdateStatus = (status: TicketStatus) => {
    if (!selectedTicket) return;

    const updatedTicket: FranchiseTicket = {
      ...selectedTicket,
      status,
      updatedAt: new Date().toISOString()
    };

    onUpdateTicket(updatedTicket);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'in_progress': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      case 'resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'closed': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'low': return 'text-slate-400';
      case 'medium': return 'text-sky-400';
      case 'high': return 'text-amber-400';
      case 'urgent': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  if (selectedTicket) {
    return (
      <div className="flex flex-col h-[600px] bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden animate-in slide-in-from-right-4 duration-300">
        {/* Chat Header */}
        <div className="p-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedTicketId(null)}
              className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-white font-bold">{selectedTicket.subject}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <Building className="w-3 h-3" />
                <span>{selectedTicket.franchiseName}</span>
                <span>•</span>
                <span>ID: {selectedTicket.id}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTicket.status}
              onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/20">
          <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30 mb-8">
            <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-sm">
              <AlertCircle className="w-4 h-4" />
              Descripción Inicial:
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {selectedTicket.description}
            </p>
          </div>

          {selectedTicket.messages.map((msg) => {
            const isAdmin = msg.senderRole === 'admin';
            return (
              <div 
                key={msg.id}
                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isAdmin ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isAdmin 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input */}
        {selectedTicket.status !== 'closed' && (
          <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>
              <button
                disabled={!newMessage.trim()}
                onClick={handleSendMessage}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por asunto, franquicia o ID..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="in_progress">En Progreso</option>
            <option value="resolved">Resueltos</option>
            <option value="closed">Cerrados</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="overflow-hidden bg-slate-800/30 rounded-2xl border border-slate-700/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700/50">
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Ticket</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Franquicia</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Categoría</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Prioridad</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Estado</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500">Última Act.</th>
              <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-500 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-700/20 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">
                      {ticket.subject}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">#{ticket.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300 text-sm">{ticket.franchiseName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-400 capitalize">{ticket.category}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      ticket.priority === 'urgent' ? 'bg-rose-500' :
                      ticket.priority === 'high' ? 'bg-amber-500' :
                      ticket.priority === 'medium' ? 'bg-sky-500' : 'bg-slate-500'
                    }`} />
                    {ticket.priority}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-500">{new Date(ticket.lastMessageAt).toLocaleDateString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white rounded-lg transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTickets.length === 0 && (
          <div className="py-20 text-center">
            <HeartHandshake className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">No hay tickets de soporte</h3>
            <p className="text-slate-500 text-sm">Los tickets abiertos por tus franquiciados aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
};
