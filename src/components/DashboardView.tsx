/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, Dog, Footprints, Calendar, Clock, ChevronRight, Play, ArrowRight, CheckCircle } from 'lucide-react';
import { Client, Pet, Walk, ScheduledWalk } from '../types';

interface DashboardViewProps {
  clients: Client[];
  pets: Pet[];
  walks: Walk[];
  onNavigate: (view: 'dashboard' | 'clients' | 'pets' | 'active-walk' | 'history' | 'agenda') => void;
  onStartSpecificWalk: (petId: string) => void;
  dbScheduledWalks: ScheduledWalk[];
}

export default function DashboardView({ clients, pets, walks, onNavigate, onStartSpecificWalk, dbScheduledWalks }: DashboardViewProps) {
  // Statistics
  const totalClients = clients.length;
  const totalPets = pets.length;
  const completedWalks = walks.filter(w => w.endTime !== null).length;
  
  // Custom scheduled walks for TODAY (real, loaded from DB)
  const todayStr = new Date().toISOString().split('T')[0];
  const scheduledWalks = dbScheduledWalks
    .filter(sch => sch.date === todayStr && sch.status === 'Pendente')
    .map(sch => {
      const pet = pets.find(p => p.id === sch.petId);
      return {
        id: sch.id,
        petId: sch.petId,
        time: sch.time,
        type: sch.type,
        petName: pet ? pet.name : 'Pet Removido',
        breed: pet ? pet.breed || pet.species : '',
        duration: sch.duration,
        photo: pet ? pet.photo : ''
      };
    });

  // Latest 3 completed walks
  const recentWalks = walks.filter(w => w.endTime !== null).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#E9EDC9] text-[#424231] p-6 sm:p-8 rounded-[32px] relative overflow-hidden border border-[#E9E9D8]">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block px-3 py-1 bg-[#5A5A40] text-white text-[10px] rounded-full uppercase tracking-widest mb-4">
            Gestão Profissional
          </span>
          <h2 className="text-2.5xl sm:text-4xl font-serif italic mb-2 tracking-tight">Excelente dia de trabalho! 🐾</h2>
          <p className="mt-1.5 text-[#5A5A40] text-sm leading-relaxed">
            Pronto para passear? Acompanhe o bem-estar dos seus pets e envie diários de dar orgulho para os tutores.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('active-walk')}
              className="px-5 py-3 bg-[#5A5A40] text-white rounded-full text-xs font-bold shadow-sm hover:bg-[#6B6B4F] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-white text-white" /> Iniciar Passeio
            </button>
            <button
              onClick={() => onNavigate('clients')}
              className="px-5 py-3 border border-dashed border-[#5A5A40] text-[#5A5A40] rounded-full text-xs font-bold hover:bg-white/40 transition-colors cursor-pointer"
            >
              Ver Clientes
            </button>
          </div>
        </div>
        {/* Background Decorative Circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9E0A9] rounded-bl-full opacity-50 pointer-events-none" />
        <div className="absolute -right-3 -bottom-3 h-24 w-24 bg-[#CCD5AE]/30 rounded-full blur-lg pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E9E9D8] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#FEFAE0] text-[#D4A373] flex items-center justify-center shrink-0">
            <Users className="h-5.5 w-5.55" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#8C8C73] font-bold">Clientes</p>
            <h3 className="text-2xl font-serif text-[#D4A373] leading-none mt-1">{totalClients}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E9E9D8] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#E9EDC9] text-[#5A5A40] flex items-center justify-center shrink-0 font-bold">
            <Dog className="h-5.5 w-5.55" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#8C8C73] font-bold">Pets</p>
            <h3 className="text-2xl font-serif text-[#D4A373] leading-none mt-1">{totalPets}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E9E9D8] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#CCD5AE]/40 text-[#5A5A40] flex items-center justify-center shrink-0">
            <Footprints className="h-5.5 w-5.55" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#8C8C73] font-bold font-sans">Visitas</p>
            <h3 className="text-2xl font-serif text-[#D4A373] leading-none mt-1">{completedWalks}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E9E9D8] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#FEFAE0]/70 text-[#D4A373] flex items-center justify-center shrink-0">
            <Calendar className="h-5.5 w-5.55" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#8C8C73] font-bold font-sans">Hoje</p>
            <h3 className="text-2xl font-serif text-[#D4A373] leading-none mt-1">{scheduledWalks.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        {/* Today's Schedule Card */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#F5F5ED]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#5A5A40]" />
              <h3 className="font-serif italic text-xl text-[#424231]">Agenda de Hoje</h3>
            </div>
            <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest bg-[#E9EDC9] px-2.5 py-1 rounded-full">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="mt-4 space-y-3.5 flex-1">
            {scheduledWalks.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-[#8C8C73]">
                <CheckCircle className="h-8 w-8 text-[#5A5A40]/30 mb-2" />
                <p className="text-xs font-semibold">Nenhum agendamento ativo para hoje!</p>
                <p className="text-[11px] opacity-80 mt-1">Crie clientes e pets para organizar sua agenda.</p>
              </div>
            ) : (
              scheduledWalks.map((sch) => (
                <div 
                  key={sch.id}
                  className="p-4 rounded-2xl border border-[#E9E9D8]/60 bg-[#F9F8F3] hover:bg-[#E9EDC9]/10 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-[#FEFAE0] rounded-xl flex items-center justify-center text-xl shrink-0 font-bold border border-[#E9E9D8] overflow-hidden">
                      {sch.photo && sch.photo.startsWith('data:image') ? (
                        <img src={sch.photo} referrerPolicy="no-referrer" alt={sch.petName} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        sch.type === 'Visita Domiciliar' ? '🐈' : '🐕'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#424231] text-sm">{sch.petName}</span>
                        <span className="text-[10px] font-bold text-[#5A5A40] bg-[#E9EDC9] px-2 py-0.5 rounded-full">
                          {sch.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#8C8C73] mt-0.5 font-medium">{sch.breed} &bull; Duração: {sch.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="flex items-center gap-1.5 text-[#5A5A40] text-xs font-bold bg-white border border-[#E9E9D8] px-2.5 py-1 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-[#8C8C73]" />
                      {sch.time}
                    </div>
                    <button
                      onClick={() => onStartSpecificWalk(sch.petId)}
                      className="px-4 py-2 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Iniciar <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Bento/Actions Box */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6">
            <h3 className="font-serif italic text-lg text-[#424231] mb-4 flex items-center gap-2">
              Atalhos Rápidos
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => onNavigate('agenda')}
                className="w-full p-4 rounded-xl border border-dashed border-[#5A5A40]/40 bg-[#FAF9F6] hover:bg-[#E9EDC9]/35 text-[#5A5A40] text-left font-bold text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span className="flex items-center gap-1.5">📅 GERENCIAR SUA AGENDA</span>
                <ChevronRight className="h-4 w-4 text-[#5A5A40] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('active-walk')}
                className="w-full p-4 rounded-xl border border-[#E9E9D8] bg-[#E9EDC9]/30 hover:bg-[#E9EDC9]/65 text-[#5A5A40] text-left font-bold text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span>ACOMPANHAR PASSEIO</span>
                <ChevronRight className="h-4 w-4 text-[#5A5A40] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('clients')}
                className="w-full p-4 rounded-xl border border-[#E9E9D8] bg-[#FEFAE0]/50 hover:bg-[#FEFAE0] text-[#D4A373] text-left font-bold text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span>CADASTRAR NOVO TUTOR</span>
                <ChevronRight className="h-4 w-4 text-[#D4A373] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('pets')}
                className="w-full p-4 rounded-xl border border-[#E9E9D8] bg-[#CCD5AE]/20 hover:bg-[#CCD5AE]/40 text-[#5A5A40] text-left font-bold text-xs transition-colors flex items-center justify-between group cursor-pointer"
              >
                <span>ADICIONAR FICHA PET</span>
                <ChevronRight className="h-4 w-4 text-[#5A5A40] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Tip Reminder exactly from Design */}
          <div className="bg-[#CCD5AE] hover:shadow-xs transition-shadow duration-300 rounded-3xl p-6 flex items-start gap-4">
            <div className="text-2xl mt-1">📸</div>
            <p className="text-xs leading-relaxed text-[#424231]">
              <strong className="block mb-1">Dica Profissional:</strong>
              Não esqueça de registrar pelo menos 2 fotos ou ocorrências para gerar um diário completo de WhatsApp!
            </p>
          </div>
        </div>
      </div>

      {/* Recent Walks Log list */}
      <div className="bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#F5F5ED]">
          <div className="flex items-center gap-2">
            <Footprints className="h-4.5 w-4.5 text-[#5A5A40]" />
            <h3 className="font-serif italic text-lg text-[#424231]">Atendimentos Recentes</h3>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-bold text-[#D4A373] hover:text-[#5A5A40] transition-colors flex items-center gap-0.5 font-sans cursor-pointer"
          >
            Ver histórico completo &rarr;
          </button>
        </div>

        <div className="mt-4 space-y-3 font-sans">
          {recentWalks.length === 0 ? (
            <div className="text-center py-6 text-[#8C8C73] text-xs font-medium">
              Nenhum passeio registrado no histórico ainda. Faça seu primeiro atendimento!
            </div>
          ) : (
            recentWalks.map((w) => {
              // Find pet names involved
              const participatingPets = pets.filter(p => w.petIds.includes(p.id));
              const names = participatingPets.map(p => p.name).join(', ') || 'Pet Desconhecido';
              return (
                <div 
                  key={w.id}
                  onClick={() => onNavigate('history')}
                  className="p-3.5 hover:bg-[#F9F8F3] rounded-2xl transition-all border border-transparent hover:border-[#E9E9D8] cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#E9EDC9]/60 text-[#5A5A40] flex items-center justify-center shrink-0 border border-[#CCD5AE]/40">
                      <Footprints className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#424231] text-sm">{names}</h4>
                      <p className="text-xs text-[#8C8C73] mt-0.5">
                        {new Date(w.startTime).toLocaleDateString('pt-BR')} &bull; Duração: {w.durationMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40]">
                    <span className="bg-[#FEFAE0]/75 px-2 py-0.5 rounded-md text-[10px]">{w.events.length} logs</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
