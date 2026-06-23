/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Calendar, Clock, Footprints, ChevronUp, ChevronDown, MessageSquare, Copy, Filter, Camera, ShieldAlert, MapPin } from 'lucide-react';
import { Client, Pet, Walk, ActivityEvent } from '../types';
import MapComponent from './MapComponent';

interface HistoryViewProps {
  walks: Walk[];
  pets: Pet[];
  clients: Client[];
}

export default function HistoryView({ walks, pets, clients }: HistoryViewProps) {
  // Filtering states
  const [filterClientId, setFilterClientId] = useState<string>('ALL');
  const [filterPetId, setFilterPetId] = useState<string>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<string>('ALL'); // ALL, TODAY, WEEK, MONTH
  
  // Expanded card tracking
  const [expandedWalkId, setExpandedWalkId] = useState<string | null>(null);
  const [copiedWalkId, setCopiedWalkId] = useState<string | null>(null);

  // Compute filters
  const filteredWalks = walks.filter(w => {
    // Client filter: check if participating pets belong to client
    const participatingPets = pets.filter(p => w.petIds.includes(p.id));
    
    const matchesClient = filterClientId === 'ALL' || 
      participatingPets.some(p => p.clientId === filterClientId);

    // Pet filter
    const matchesPet = filterPetId === 'ALL' || w.petIds.includes(filterPetId);

    // Period filter
    const walkDate = new Date(w.startTime);
    const now = new Date();
    let matchesPeriod = true;

    if (filterPeriod === 'TODAY') {
      matchesPeriod = walkDate.toDateString() === now.toDateString();
    } else if (filterPeriod === 'WEEK') {
      const diffTime = Math.abs(now.getTime() - walkDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesPeriod = diffDays <= 7;
    } else if (filterPeriod === 'MONTH') {
      matchesPeriod = walkDate.getMonth() === now.getMonth() && 
                      walkDate.getFullYear() === now.getFullYear();
    }

    return matchesClient && matchesPet && matchesPeriod;
  });

  const getPetNames = (walk: Walk) => {
    const fromState = pets
      .filter(p => walk.petIds.includes(p.id))
      .map(p => p.name);

    if (fromState.length > 0) {
      return fromState.join(', ');
    }

    if (walk.petDetails && walk.petDetails.length > 0) {
      return walk.petDetails.map(p => p.name).join(', ');
    }

    return 'Pet Desconhecido';
  };

  const formatWalkDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatWalkTimes = (startIso: string, endIso: string | null) => {
    const s = new Date(startIso);
    const startStr = s.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (!endIso) return `${startStr} - Em andamento`;
    const e = new Date(endIso);
    const endStr = e.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${startStr} às ${endStr}`;
  };

  const getWhatsAppDigest = (walk: Walk) => {
    const participatingPets = pets.filter(p => walk.petIds.includes(p.id));
    const petNames = participatingPets.map(p => p.name).join(' e ');

    let report = `🐾 *RELATÓRIO PETSITTER: ${petNames.toUpperCase()}* 🐾\n\n`;
    report += `⏱ *Duração:* ${walk.durationMinutes} minutos\n\n`;
    
    if (walk.events.length > 0) {
      report += `*Atividades registradas:*\n`;
      walk.events.forEach(ev => {
        const timeStr = new Date(ev.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        report += `• [${timeStr}] ${ev.label}${ev.notes ? ` (${ev.notes})` : ''}\n`;
      });
      report += `\n`;
    }

    report += `*Relato de Campo:*\n`;
    report += `"${walk.notes}"\n\n`;
    report += `Obrigado por confiar no meu trabalho profissional! ❤️🐶`;

    return report;
  };

  const handleCopyReport = (walk: Walk, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getWhatsAppDigest(walk));
    setCopiedWalkId(walk.id);
    setTimeout(() => setCopiedWalkId(null), 3500);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Search Filter Banner */}
      <div className="bg-white p-5 rounded-3xl border border-[#E9E9D8] shadow-xs">
        <h4 className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-3.5 flex items-center gap-1.5 font-sans">
          <Filter className="h-3.5 w-3.5 text-[#5A5A40]" /> Filtrar Histórico de Serviços
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Client select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8C8C73] uppercase block font-sans">Filtrar por Tutor</label>
            <select
              value={filterClientId}
              onChange={(e) => {
                setFilterClientId(e.target.value);
                setFilterPetId('ALL'); // Reset pet when switching client
              }}
              className="w-full text-xs bg-[#F9F8F3] rounded-xl py-2.5 px-3 border border-[#E9E9D8] font-bold text-[#424231] focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
            >
              <option value="ALL">Qualquer Tutor</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
          </div>

          {/* Pet select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8C8C73] uppercase block font-sans">Filtrar por Pet</label>
            <select
              value={filterPetId}
              onChange={(e) => setFilterPetId(e.target.value)}
              className="w-full text-xs bg-[#F9F8F3] rounded-xl py-2.5 px-3 border border-[#E9E9D8] font-bold text-[#424231] focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
            >
              <option value="ALL">Qualquer Pet</option>
              {pets
                .filter(p => filterClientId === 'ALL' || p.clientId === filterClientId)
                .map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                ))}
            </select>
          </div>

          {/* Timeframe select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8C8C73] uppercase block font-sans">Período de Atendimento</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full text-xs bg-[#F9F8F3] rounded-xl py-2.5 px-3 border border-[#E9E9D8] font-bold text-[#424231] focus:outline-hidden focus:ring-2 focus:ring-[#D4A373] transition-all"
            >
              <option value="ALL">Todo o Histórico</option>
              <option value="TODAY">Apenas Hoje</option>
              <option value="WEEK">Últimos 7 dias</option>
              <option value="MONTH">Deste Mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Walks logs layout list */}
      <div className="space-y-4">
        {filteredWalks.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E9E9D8] text-center text-[#8C8C73] text-sm">
            Nenhum atendimento correspondente aos filtros foi encontrado.
          </div>
        ) : (
          filteredWalks.map((walk) => {
            const isExpanded = expandedWalkId === walk.id;
            const walkPets = pets.filter(p => walk.petIds.includes(p.id));
            const firstPet = walkPets[0];
            const client = firstPet ? clients.find(c => c.id === firstPet.clientId) : null;

            return (
              <div 
                key={walk.id}
                className="bg-white rounded-3xl border border-[#E9E9D8] shadow-xs hover:border-[#CCD5AE] transition-all overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  onClick={() => setExpandedWalkId(isExpanded ? null : walk.id)}
                  className="p-5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-10 w-10 bg-[#E9EDC9] text-[#5A5A40] rounded-xl flex items-center justify-center font-bold border border-[#CCD5AE]/40 shrink-0 select-none">
                      <Footprints className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-serif italic text-base sm:text-lg text-[#424231] leading-none">
                        {getPetNames(walk)}
                      </h4>
                      <p className="text-xs text-[#8C8C73] mt-1.5 flex items-center gap-2 flex-wrap font-medium">
                        <span className="flex items-center gap-1 shrink-0">
                          <Calendar className="h-3.5 w-3.5 text-[#8C8C73]/70" />
                          {formatWalkDate(walk.startTime)}
                        </span>
                        &bull;
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-[#8C8C73]/70" />
                          {walk.durationMinutes} min
                        </span>
                        &bull;
                        <span className="text-[10px] text-[#5A5A40] font-bold bg-[#E9EDC9] px-2.5 py-0.5 rounded-sm shrink-0">
                          Tutor: {client ? client.fullName : 'Sem Tutor'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => handleCopyReport(walk, e)}
                      className={`px-3 py-1.5 border hover:bg-[#F9F8F3] text-xs font-bold rounded-full transition-all flex items-center gap-1 shadow-xs cursor-pointer ${copiedWalkId === walk.id ? 'bg-[#E9EDC9] text-[#5A5A40] border-[#CCD5AE]/60' : 'bg-white border-[#E9E9D8] text-[#5A5A40]'}`}
                      title="Copiar relatório"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{copiedWalkId === walk.id ? 'Copiado!' : 'Copiar Diário'}</span>
                    </button>
                    <div className="text-[#8C8C73] hover:text-[#5A5A40] transition-colors p-1">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-[#F5F5ED] bg-[#F9F8F3]/60 p-5 space-y-5">
                    {/* Walk timing breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-[#8C8C73]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#5A5A40]" />
                        <span>Horário do Atendimento: </span>
                        <span className="font-bold text-[#424231] font-mono">
                          {formatWalkTimes(walk.startTime, walk.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Footprints className="h-4 w-4 text-[#5A5A40]" />
                        <span>Resumo de Atividades: </span>
                        <span className="font-bold text-[#424231] bg-[#FEFAE0] border border-[#E9E9D8] px-2.5 py-0.5 rounded-full font-sans text-[10px]">
                          {walk.events.length} logs coletados
                        </span>
                      </div>
                    </div>

                    {/* Photos list if any */}
                    {walk.photos && walk.photos.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-[#8C8C73] block tracking-widest font-sans">
                          Registro Fotográfico ({walk.photos.length})
                        </span>
                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                          {walk.photos.map((ph, idx) => (
                            <div key={idx} className="relative aspect-square h-24 rounded-2xl border border-[#E9E9D8] bg-white overflow-hidden shrink-0 group shadow-inner">
                              <img src={ph} alt="Walk snapshot log" className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Field Notes Relato */}
                    <div className="bg-white p-4.5 rounded-2xl border border-[#E9E9D8]">
                      <span className="text-[10px] font-bold uppercase text-[#D4A373] block tracking-widest mb-1.5 flex items-center gap-1 font-sans">
                        <MessageSquare className="h-3.5 w-3.5" /> Relato do Diário de Campo
                      </span>
                      <p className="text-xs sm:text-sm text-[#424231] italic leading-relaxed whitespace-pre-wrap">
                        "{walk.notes}"
                      </p>
                    </div>

                    {/* Live GPS Route Map of Completed Walk */}
                    {walk.routeSimulated && walk.routeSimulated.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase text-[#8C8C73] block tracking-widest font-sans flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#5A5A40]" /> Mapa do Percurso Coletado
                        </span>
                        <MapComponent 
                          coordinates={walk.routeSimulated} 
                          heightClass="h-44 sm:h-52"
                          interactive={true}
                        />
                      </div>
                    )}

                    {/* Chronological Activities bullet listing */}
                    {walk.events && walk.events.length > 0 && (
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold uppercase text-[#8C8C73] block tracking-widest font-sans">
                          Linha do Tempo de Atividades
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {walk.events.map((ev) => {
                            const evTime = new Date(ev.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            return (
                              <div key={ev.id} className="p-3 bg-white border border-[#E9E9D8] rounded-2xl text-xs flex items-center justify-between shadow-xxs">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-bold text-[#5A5A40] bg-[#E9EDC9] px-2 py-0.5 rounded-sm shrink-0 font-mono text-[10px]">
                                    {evTime}
                                  </span>
                                  <div>
                                    <span className="font-bold text-[#424231]">{ev.label}</span>
                                    {ev.notes && <span className="text-[#8C8C73] block text-[10px] italic mt-0.5">"{ev.notes}"</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
