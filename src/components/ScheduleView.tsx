/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Play, 
  ChevronRight, 
  ArrowLeft, 
  Filter, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { Pet, Client, ScheduledWalk, ScheduledWalkType, ScheduledWalkStatus } from '../types';

interface ScheduleViewProps {
  scheduledWalks: ScheduledWalk[];
  pets: Pet[];
  clients: Client[];
  onAddScheduledWalk: (data: Omit<ScheduledWalk, 'id' | 'userId'>) => void | Promise<void>;
  onUpdateScheduledWalk: (scheduled: ScheduledWalk) => void | Promise<void>;
  onDeleteScheduledWalk: (scheduledId: string) => void | Promise<void>;
  onStartWalkFromAgenda: (petId: string) => void;
}

export default function ScheduleView({
  scheduledWalks,
  pets,
  clients,
  onAddScheduledWalk,
  onUpdateScheduledWalk,
  onDeleteScheduledWalk,
  onStartWalkFromAgenda
}: ScheduleViewProps) {
  const [statusFilter, setStatusFilter] = useState<'Todos' | ScheduledWalkStatus>('Todos');
  const [dateFilter, setDateFilter] = useState<'Todos' | 'Hoje' | 'Esta Semana'>('Todos');
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledWalk | null>(null);

  // Form states
  const [selectedPetId, setSelectedPetId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<ScheduledWalkType>('Passeio');
  const [duration, setDuration] = useState('45 min');
  const [notes, setNotes] = useState('');

  const handleOpenCreateForm = () => {
    setEditingSchedule(null);
    setSelectedPetId(pets[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('10:00');
    setType('Passeio');
    setDuration('45 min');
    setNotes('');
    setShowForm(true);
  };

  const handleOpenEditForm = (schedule: ScheduledWalk) => {
    setEditingSchedule(schedule);
    setSelectedPetId(schedule.petId);
    setDate(schedule.date);
    setTime(schedule.time);
    setType(schedule.type);
    setDuration(schedule.duration);
    setNotes(schedule.notes || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) return;

    const walkData = {
      petId: selectedPetId,
      date,
      time,
      type,
      duration,
      notes: notes.trim(),
      status: editingSchedule ? editingSchedule.status : ('Pendente' as ScheduledWalkStatus)
    };

    if (editingSchedule) {
      await onUpdateScheduledWalk({
        ...editingSchedule,
        ...walkData
      });
    } else {
      await onAddScheduledWalk(walkData);
    }

    setShowForm(false);
  };

  const handleStatusChange = async (schedule: ScheduledWalk, newStatus: ScheduledWalkStatus) => {
    await onUpdateScheduledWalk({
      ...schedule,
      status: newStatus
    });
  };

  const handleDelete = async (id: string) => {
    await onDeleteScheduledWalk(id);
  };

  // Helper date lookups
  const isToday = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr === todayStr;
  };

  const isThisWeek = (dateStr: string) => {
    const walkDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Simple 7 days range from today
    const diffTime = walkDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Filters computed lists
  const filteredSchedules = scheduledWalks.filter(sch => {
    // 1. Status Filter
    if (statusFilter !== 'Todos' && sch.status !== statusFilter) {
      return false;
    }
    // 2. Date Filter
    if (dateFilter === 'Hoje' && !isToday(sch.date)) {
      return false;
    }
    if (dateFilter === 'Esta Semana' && !isThisWeek(sch.date)) {
      return false;
    }
    return true;
  });

  // Sort: pending first, then by date/time
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    if (a.status === 'Pendente' && b.status !== 'Pendente') return -1;
    if (a.status !== 'Pendente' && b.status === 'Pendente') return 1;
    
    const dateTimeA = `${a.date}T${a.time}`;
    const dateTimeB = `${b.date}T${b.time}`;
    return dateTimeA.localeCompare(dateTimeB);
  });

  return (
    <div id="schedule-module-root" className="space-y-6">
      {/* View Header with conditional form header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2.5xl font-serif text-[#D4A373] tracking-tight italic">
            {showForm ? (editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento') : 'Agenda de Atendimentos'}
          </h2>
          <p className="text-xs text-[#8C8C73] font-medium leading-relaxed mt-1">
            {showForm 
              ? 'Insira os dados do atendimento do seu pet para otimizar sua rotina diária.' 
              : 'Gerencie e agende novos passeios, visitas domiciliares, refeições ou terapias.'}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreateForm}
            className="self-start sm:self-center bg-[#5A5A40] text-white py-2.5 px-4.5 rounded-full text-xs font-bold hover:bg-[#6B6B4F] active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Agendar Atendimento
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white rounded-[32px] border border-[#E9E9D8] shadow-sm p-6 sm:p-8 max-w-xl mx-auto font-sans">
          <form onSubmit={handleSubmit} className="space-y-5.5">
            {/* Pet Selector */}
            <div>
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-2">
                Qual pet vai ser atendido?
              </label>
              {pets.length === 0 ? (
                <div className="text-sm p-3 bg-amber-50 rounded-xl text-amber-800 border border-amber-100 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Você precisa cadastrar um pet antes de agendar.</span>
                </div>
              ) : (
                <select
                  required
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E3E2DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-gray-950 focus:border-[#D4A373]"
                >
                  {pets.map((p) => {
                    const client = clients.find(c => c.id === p.clientId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.species === 'Cão' ? '🐕 Cão' : p.species === 'Gato' ? '🐈 Gato' : '🐾'}{p.breed ? ` - ${p.breed}` : ''}) {client ? ` - Tutor: ${client.fullName}` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E3E2DC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-gray-950 focus:border-[#D4A373]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E3E2DC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-gray-950 focus:border-[#D4A373]"
                />
              </div>
            </div>

            {/* Type & Duration Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-2">
                  Tipo de Atendimento
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ScheduledWalkType)}
                  className="w-full bg-[#FAF9F6] border border-[#E3E2DC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-gray-950 focus:border-[#D4A373]"
                >
                  <option value="Passeio">🐕 Passeio</option>
                  <option value="Visita Domiciliar">🏡 Visita Domiciliar</option>
                  <option value="Alimentação">🍖 Alimentação</option>
                  <option value="Medicamento">💊 Medicamento</option>
                  <option value="Outro">✨ Outro / Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-2">
                  Duração Estimada
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E3E2DC] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-gray-950 focus:border-[#D4A373]"
                >
                  <option value="15 min">15 minutos</option>
                  <option value="30 min">30 minutos</option>
                  <option value="45 min">45 minutos</option>
                  <option value="1 hora">1 hora</option>
                  <option value="1h 30m">1 hora e 30 min</option>
                  <option value="2 horas">2 horas+</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-[#5A5A40] uppercase tracking-wider mb-2">
                Instruções ou Observações
              </label>
              <textarea
                placeholder="Ex: Levar petiscos favoritos, dar ração após o passeio, focar em socializar, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#FAF9F6] border border-[#E3E2DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A373] text-gray-950 focus:border-[#D4A373] placeholder-gray-400"
              />
            </div>

            {/* Actions Bottom */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F5ED]">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold text-[#8C8C73] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pets.length === 0}
                className="px-5.5 py-3 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {editingSchedule ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Controls & Filters Bar */}
          <div className="bg-white rounded-2xl border border-[#E9E9D8] p-4 flex flex-col md:flex-row gap-3.5 justify-between items-start md:items-center shadow-xs font-sans">
            {/* Status filtering */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mr-2 shrink-0 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status:
              </span>
              {(['Todos', 'Pendente', 'Realizado', 'Cancelado'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-[#CCD5AE] text-[#424231]' 
                      : 'bg-[#F9F8F3] text-[#5A5A40] hover:bg-[#E9EDC9]/20'
                  }`}
                >
                  {st === 'Todos' ? 'Todos' : st === 'Pendente' ? 'Pendentes ⏳' : st === 'Realizado' ? 'Realizados ✅' : 'Cancelados ❌'}
                </button>
              ))}
            </div>

            {/* Date scale filtering */}
            <div className="flex items-center gap-1 border-t md:border-t-0 pt-2.5 md:pt-0 w-full md:w-auto">
              <span className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mr-2 shrink-0">
                Data:
              </span>
              {(['Todos', 'Hoje', 'Esta Semana'] as const).map((dt) => (
                <button
                  key={dt}
                  onClick={() => setDateFilter(dt)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    dateFilter === dt 
                      ? 'bg-[#E9EDC9] text-[#424231] font-bold border border-[#CCD5AE]' 
                      : 'bg-[#F9F8F3] border border-[#FAF9F6] text-[#8C8C73] hover:bg-[#E9EDC9]/10'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Listings Grid */}
          <div className="space-y-3.5">
            {sortedSchedules.length === 0 ? (
              <div className="bg-white rounded-[32px] border border-[#E9E9D8] p-12 text-center text-[#8C8C73] shadow-sm flex flex-col items-center justify-center">
                <CalendarIcon className="h-10 w-10 text-[#5A5A40]/30 mb-3" />
                <h4 className="font-serif italic text-lg text-gray-900">Nenhum compromisso encontrado</h4>
                <p className="text-xs max-w-sm mt-1 mb-5">
                  Não existem atendimentos nesta categoria. Altere os filtros acima ou crie um novo agendamento.
                </p>
                <button
                  onClick={handleOpenCreateForm}
                  className="px-5 py-2.5 bg-[#FAF9F6] hover:bg-[#F2ECE4] border border-[#D4C3B3]/40 text-[#5A5A40] rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                  Criar Primeiro Agendamento
                </button>
              </div>
            ) : (
              sortedSchedules.map((sch) => {
                const pet = pets.find(p => p.id === sch.petId);
                const client = pet ? clients.find(c => c.id === pet.clientId) : null;
                const activeWalkOption = sch.status === 'Pendente' && sch.type === 'Passeio';
                
                return (
                  <div 
                    key={sch.id}
                    className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 ${
                      sch.status === 'Pendente' 
                        ? 'border-[#E9E9D8] hover:border-[#CCD5AE]' 
                        : sch.status === 'Realizado'
                        ? 'border-emerald-100 opacity-80'
                        : 'border-rose-100 opacity-60'
                    }`}
                  >
                    {/* Left: Pet Info and Type Details */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#FAF9F6] rounded-2xl relative flex items-center justify-center text-2xl shrink-0 border border-[#E9E9D8]">
                        {pet?.photo && pet.photo.startsWith('data:image') ? (
                          <img src={pet.photo} referrerPolicy="no-referrer" alt={pet.name} className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          pet?.species === 'Cão' ? '🐕' : pet?.species === 'Gato' ? '🐈' : '🐾'
                        )}
                        <span className={`absolute -bottom-1 -right-1 leading-none text-xs rounded-full p-1 border font-bold ${
                          sch.status === 'Pendente' 
                            ? 'bg-[#FEFAE0] text-[#D4A373] border-[#E9E9D8]' 
                            : sch.status === 'Realizado'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {sch.status === 'Pendente' ? '⏳' : sch.status === 'Realizado' ? '✓' : '✗'}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-serif font-bold text-[#424231] text-base leading-snug">{pet?.name || 'Pet Removido'}</span>
                          <span className={`text-[10px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            sch.type === 'Passeio' 
                              ? 'bg-[#E9EDC9] text-[#5A5A40]' 
                              : sch.type === 'Visita Domiciliar'
                              ? 'bg-indigo-50 text-indigo-700'
                              : sch.type === 'Alimentação'
                              ? 'bg-amber-50 text-amber-700'
                              : sch.type === 'Medicamento'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-slate-50 text-gray-700'
                          }`}>
                            {sch.type}
                          </span>
                        </div>
                        {client && (
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">
                            Tutor: <span className="text-[#8C8C73]">{client.fullName}</span>
                          </p>
                        )}
                        {sch.notes && (
                          <div className="mt-1 flex items-start gap-1 p-1 bg-gray-50 rounded-lg text-[11px] text-gray-600 font-sans leading-tight">
                            <FileText className="h-3 w-3 shrink-0 text-gray-400 mt-0.5" />
                            <span className="italic">{sch.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Date, Duration, and Quick Action Controls */}
                    <div className="flex flex-col sm:items-end justify-between gap-3 sm:text-right shrink-0">
                      {/* Horizontal Date Info block */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-gray-700 bg-[#F9F8F3] border border-[#E9E9D8]/60 px-2.5 py-1.5 rounded-xl">
                          <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                          {isToday(sch.date) ? 'Hoje!' : new Date(sch.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center gap-1 text-gray-700 bg-[#F9F8F3] border border-[#E9E9D8]/60 px-2.5 py-1.5 rounded-xl">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {sch.time}
                        </span>
                        <span className="text-xs text-[#8C8C73] bg-gray-50 px-2.5 py-1.5 rounded-xl">
                          ⏱ {sch.duration}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {sch.status === 'Pendente' && (
                          <>
                            {activeWalkOption ? (
                              <button
                                onClick={() => onStartWalkFromAgenda(sch.petId)}
                                className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Play className="h-3 w-3 fill-white" /> Iniciar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(sch, 'Realizado')}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <Check className="h-3 w-3 text-white" /> Concluir
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(sch, 'Cancelado')}
                              title="Cancelar Atendimento"
                              className="p-2 border border-[#E9E9D8] hover:bg-rose-50 hover:text-rose-600 rounded-full text-[#8C8C73] transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        {sch.status !== 'Pendente' && (
                          <button
                            onClick={() => handleStatusChange(sch, 'Pendente')}
                            className="px-3 py-2 border border-[#E9E9D8] hover:bg-gray-50 text-gray-700 rounded-full text-xs font-bold transition-all cursor-pointer"
                          >
                            Reativar
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditForm(sch)}
                          title="Editar"
                          className="p-2 border border-[#E9E9D8] hover:bg-blue-50 hover:text-blue-600 rounded-full text-[#8C8C73] transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(sch.id)}
                          title="Excluir Definitivo"
                          className="p-2 border border-[#E9E9D8] hover:bg-rose-50 hover:text-rose-600 rounded-full text-[#8C8C73] transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
