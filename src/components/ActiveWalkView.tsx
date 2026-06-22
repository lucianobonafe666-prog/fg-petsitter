/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertCircle, Camera, Check, Clock, Edit2, MapPin, Plus, ShieldCheck, Droplet, Smile, MessageSquare, Trash, Sparkles, Footprints, ChevronUp, Copy, HelpCircle } from 'lucide-react';
import { Pet, Walk, ActivityEvent, ActivityEventType } from '../types';

interface ActiveWalkViewProps {
  pets: Pet[];
  onWalkFinished: (walk: Walk) => void;
  quickSelectedPetId?: string | null;
}

// Default simulated camera shots
const MOCK_PHOTOS = [
  { id: 'p1', name: 'No Gramado', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400' },
  { id: 'p2', name: 'Bebendo Água', url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=400' },
  { id: 'p3', name: 'Correndo', url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=400' },
  { id: 'p4', name: 'Descanso Sombra', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400' },
];

export default function ActiveWalkView({ pets, onWalkFinished, quickSelectedPetId = null }: ActiveWalkViewProps) {
  // App states
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(
    quickSelectedPetId ? [quickSelectedPetId] : []
  );
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  // Simulation metrics
  const [simulatedDistance, setSimulatedDistance] = useState(0); // km
  const [simulatedSpeed, setSimulatedSpeed] = useState(0); // km/h
  const [gpsPoints, setGpsPoints] = useState<{ x: number; y: number }[]>([]);

  // Event logger helper modal
  const [activeEventModal, setActiveEventModal] = useState<ActivityEventType | null>(null);
  const [eventNoteInput, setEventNoteInput] = useState('');

  // Finished summarization modal
  const [finishedWalk, setFinishedWalk] = useState<Walk | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Interval timers reference
  const clockIntervalRef = useRef<any>(null);
  const simulationIntervalRef = useRef<any>(null);

  // Auto handle selected pet from deep-link starting
  useEffect(() => {
    if (quickSelectedPetId && pets.some(p => p.id === quickSelectedPetId)) {
      setSelectedPetIds([quickSelectedPetId]);
    }
  }, [quickSelectedPetId, pets]);

  // Start chronometer
  useEffect(() => {
    if (isActive) {
      clockIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Setup GPS trail simulation coords
      const trail = [{ x: 50, y: 150 }];
      setGpsPoints(trail);

      simulationIntervalRef.current = setInterval(() => {
        setSimulatedSpeed(3.8 + Math.random() * 1.5); // constant human walking speed
        setSimulatedDistance(prev => {
          const increment = (3.8 + Math.random() * 1.5) / 3600; // per second rate approx
          return Number((prev + increment).toFixed(2));
        });
        setGpsPoints(prev => {
          if (prev.length >= 12) return prev; // limit path coordinates length
          const last = prev[prev.length - 1];
          const newX = last.x + (15 + Math.random() * 15);
          const newY = last.y + (Math.sin(last.x / 40) * 30 + (Math.random() - 0.5) * 15);
          return [...prev, { x: newX, y: newY }];
        });
      }, 2000);
    } else {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    }

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [isActive]);

  const handleTogglePet = (petId: string) => {
    setSelectedPetIds(prev =>
      prev.includes(petId) ? prev.filter(id => id !== petId) : [...prev, petId]
    );
  };

  const handleStartWalk = () => {
    if (selectedPetIds.length === 0) {
      alert('Selecione pelo menos 1 pet para iniciar o atendimento.');
      return;
    }
    setStartTime(new Date().toISOString());
    setElapsedSeconds(0);
    setEvents([]);
    setPhotos([]);
    setNotes('');
    setSimulatedDistance(0);
    setSimulatedSpeed(4.1);
    setIsActive(true);
  };

  // Log active event
  const triggerEventLogging = (type: ActivityEventType) => {
    setEventNoteInput('');
    setActiveEventModal(type);
  };

  const confirmEventLogging = () => {
    if (!activeEventModal) return;

    const labels: Record<ActivityEventType, string> = {
      xixi: 'Fez Xixi 💦',
      coco: 'Fez Cocô 💩',
      agua: 'Bebeu Água 🥛',
      racao: 'Comeu Ração 🍗',
      petisco: 'Recebeu Petisco 🍪',
      medicamento: 'Tomou Medicamento 💊',
      brincadeira: 'Brincou muito ⚽',
      interacao: 'Interagiu 🐶',
    };

    const newEvent: ActivityEvent = {
      id: 'ev_' + Math.random().toString(36).substr(2, 9),
      type: activeEventModal,
      timestamp: new Date().toISOString(),
      label: labels[activeEventModal],
      notes: eventNoteInput.trim() || undefined
    };

    setEvents(prev => [...prev, newEvent]);
    setActiveEventModal(null);
  };

  // Simulated photo snap click
  const injectMockPhoto = (url: string) => {
    setPhotos(prev => [...prev, url]);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stop Walk
  const handleFinishWalk = () => {
    if (!startTime) return;
    const endTime = new Date().toISOString();
    const duration = Math.max(1, Math.round(elapsedSeconds / 60));

    const finalWalk: Walk = {
      id: 'walk_' + Math.random().toString(36).substr(2, 9),
      userId: pets[0]?.userId || 'user_default',
      petIds: selectedPetIds,
      startTime,
      endTime,
      durationMinutes: duration,
      notes: notes.trim() || 'Passeio realizado com sucesso.',
      photos,
      events,
      routeSimulated: gpsPoints.map(p => ({ lat: p.x, lng: p.y }))
    };

    // Save back to db
    onWalkFinished(finalWalk);
    setFinishedWalk(finalWalk);
    setIsActive(false);
  };

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  // Formulate the beautiful Portuguese WhatsApp report
  const getWhatsAppDigest = () => {
    if (!finishedWalk) return '';
    const participatingPets = pets.filter(p => finishedWalk.petIds.includes(p.id));
    const petNames = participatingPets.map(p => p.name).join(' e ');

    let report = `🐾 *RELATÓRIO PETSITTER: ${petNames.toUpperCase()}* 🐾\n\n`;
    report += `⏱ *Duração:* ${finishedWalk.durationMinutes} minutos\n`;
    report += `📍 *Distância:* ${simulatedDistance} km percorridos\n\n`;
    
    if (finishedWalk.events.length > 0) {
      report += `*Atividades registradas:*\n`;
      finishedWalk.events.forEach(ev => {
        const timeStr = new Date(ev.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        report += `• [${timeStr}] ${ev.label}${ev.notes ? ` (${ev.notes})` : ''}\n`;
      });
      report += `\n`;
    }

    report += `*Relato de Campo:*\n`;
    report += `"${finishedWalk.notes}"\n\n`;
    report += `Obrigado por confiar no meu trabalho profissional! ❤️🐶`;

    return report;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(getWhatsAppDigest());
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  // Render Finished Summary Modal Overlay
  if (finishedWalk) {
    const participating = pets.filter(p => finishedWalk.petIds.includes(p.id));
    return (
      <div className="bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6 sm:p-8 max-w-2xl mx-auto space-y-6 font-sans">
        <div className="text-center space-y-2">
          <div className="h-16 w-16 bg-[#E9EDC9] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#CCD5AE]/40">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-[#424231] tracking-tight">Atendimento Concluído!</h2>
          <p className="text-[#8C8C73] text-sm">O histórico de {participating.map(p => p.name).join(', ')} foi devidamente salvo.</p>
        </div>

        {/* Report summary preview */}
        <div className="bg-[#F9F8F3] p-5 rounded-2xl border border-[#E9E9D8] relative">
          <span className="absolute top-3 right-3 text-[9px] font-bold uppercase text-[#8C8C73]/70 select-none">
            Relatório de Envio
          </span>
          <p className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest mb-3">Prévia da Mensagem (Copiar p/ WhatsApp)</p>
          <pre className="text-xs sm:text-sm font-mono text-[#424231] whitespace-pre-wrap leading-relaxed">
            {getWhatsAppDigest()}
          </pre>
        </div>

        {/* Copy share button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleCopyReport}
            className="flex-1 py-3 bg-[#5A5A40] hover:bg-[#6B6B4F] text-white rounded-full shadow-xs text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedMessage ? (
              <>Copiado com Sucesso! ✓</>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar Diário Profissional
              </>
            )}
          </button>
          <button
            onClick={() => setFinishedWalk(null)}
            className="py-3 px-6 border border-[#E9E9D8] bg-white hover:bg-[#F9F8F3] text-[#5A5A40] rounded-full text-sm font-semibold transition-colors cursor-pointer"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    );
  }

  // Active tracking console
  if (isActive) {
    const participatingPets = pets.filter(p => selectedPetIds.includes(p.id));
    return (
      <div className="bg-[#424231] text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-6 relative overflow-hidden font-sans border border-[#373727]">
        {/* Background gradient effects */}
        <div className="absolute right-0 top-0 h-40 w-40 bg-[#E9EDC9]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-400 animate-pulse shrink-0" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#E9EDC9]">Atendimento Ativo</span>
              <h3 className="font-serif italic text-lg sm:text-xl text-white">
                Passeio de {participatingPets.map(p => p.name).join(', ')}
              </h3>
            </div>
          </div>

          {/* Chrono */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <Clock className="h-4 w-4 text-[#FEFAE0] animate-spin-slow" />
            <span className="font-mono text-lg font-bold text-white tracking-widest">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Simulated Telemetry Indicators */}
        <div className="grid grid-cols-3 gap-3 bg-white/5 p-3.5 border border-white/5 rounded-2xl text-center select-none">
          <div>
            <span className="text-[9px] font-semibold text-[#FEFAE0]/70 uppercase block tracking-wider">Distância</span>
            <span className="text-base sm:text-lg font-bold text-white mt-1 block">{simulatedDistance} km</span>
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[#FEFAE0]/70 uppercase block tracking-wider">Velocidade</span>
            <span className="text-base sm:text-lg font-bold text-[#E9EDC9] mt-1 block font-mono">{simulatedSpeed.toFixed(1)} km/h</span>
          </div>
          <div>
            <span className="text-[9px] font-semibold text-[#FEFAE0]/70 uppercase block tracking-wider">Eventos</span>
            <span className="text-base sm:text-lg font-bold text-white mt-1 block">{events.length} logs</span>
          </div>
        </div>

        {/* Live coordinate map tracker path */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#313123] p-4 relative h-40 sm:h-48">
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#424231]/90 border border-white/10 text-[9px] font-bold uppercase text-[#FEFAE0] px-2 py-0.5 rounded-md z-15 backdrop-blur-xs">
            <MapPin className="h-3 w-3 text-red-400" /> Sensor de Telemetria de Rota
          </div>

          {/* Custom SVG simulated walker track line */}
          <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 450 180" xmlns="http://www.w3.org/2000/svg">
            {/* Grid coordinate lines */}
            <line x1="0" y1="30" x2="450" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="0" y1="90" x2="450" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
            <line x1="0" y1="150" x2="450" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
            
            {/* The actual line trail */}
            {gpsPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#E9EDC9"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2, 2"
                points={gpsPoints.map(p => `${p.x},${p.y}`).join(' ')}
              />
            )}

            {/* Current walking dot locator */}
            {gpsPoints.length > 0 && (
              <g transform={`translate(${gpsPoints[gpsPoints.length - 1].x}, ${gpsPoints[gpsPoints.length - 1].y})`}>
                <circle r="10" fill="rgba(233, 237, 201, 0.2)" className="animate-ping" />
                <circle r="5" fill="#E9EDC9" />
              </g>
            )}
          </svg>
        </div>

        {/* Quick event toggles logs console */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-[#FEFAE0]/70 tracking-wider block uppercase">Registar Ocorrências / Atividades</label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-white">
            <button
              onClick={() => triggerEventLogging('xixi')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-[#E9EDC9] hover:text-[#424231] transition-colors cursor-pointer text-center"
            >
              Fez Xixi 💦
            </button>
            <button
              onClick={() => triggerEventLogging('coco')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-[#D4A373] hover:text-[#424231] transition-colors cursor-pointer text-center"
            >
              Fez Cocô 💩
            </button>
            <button
              onClick={() => triggerEventLogging('agua')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-sky-600 hover:text-white transition-colors cursor-pointer text-center"
            >
              Bebeu Água 🥛
            </button>
            <button
              onClick={() => triggerEventLogging('racao')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-amber-600 hover:text-white transition-colors cursor-pointer text-center"
            >
              Comeu Ração 🍗
            </button>
            <button
              onClick={() => triggerEventLogging('petisco')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-yellow-500 hover:text-[#424231] transition-colors cursor-pointer text-center"
            >
              Recebeu Petisco 🍪
            </button>
            <button
              onClick={() => triggerEventLogging('medicamento')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-center"
            >
              Tomou Remédio 💊
            </button>
            <button
              onClick={() => triggerEventLogging('brincadeira')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-pink-500 hover:text-white transition-colors cursor-pointer text-center"
            >
              Brincou ⚽
            </button>
            <button
              onClick={() => triggerEventLogging('interacao')}
              className="py-3 px-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-[#CCD5AE] hover:text-[#424231] transition-colors cursor-pointer text-center"
            >
              Interagiu Dog 🐶
            </button>
          </div>
        </div>

        {/* Photos logger */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[#FEFAE0]/70 tracking-wider block uppercase font-sans">Adicionar Fotos da Sessão</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadPhoto}
                className="hidden"
                id="walk-file-upload"
              />
              <label
                htmlFor="walk-file-upload"
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-[#FEFAE0] rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-white/10 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-[#E9EDC9]" /> Enviar Foto
              </label>
            </div>
          </div>

          {/* Quick injection simulated photos bank */}
          <div className="flex gap-2 pb-1 overflow-x-auto whitespace-nowrap scrollbar-none">
            {MOCK_PHOTOS.map(p => (
              <button
                key={p.id}
                onClick={() => injectMockPhoto(p.url)}
                className="px-2.5 py-1.5 border border-white/10 bg-white/5 hover:bg-[#E9EDC9] hover:text-[#424231] rounded-lg text-[10px] text-slate-200 font-medium shrink-0 transition-colors cursor-pointer"
              >
                + Foto: {p.name}
              </button>
            ))}
          </div>

          {/* Photos list */}
          {photos.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {photos.map((ph, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-white/10 bg-[#313123] overflow-hidden group">
                  <img src={ph} alt="Walk snap" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 h-5 w-5 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center text-[10px] transition-colors"
                    title="Excluir foto"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input remarks/diário */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#FEFAE0]/70 tracking-wider block uppercase">Diário de Campo / Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2.5}
            placeholder="Escreva como foi o passeio de hoje, o humor dos pets e detalhes para enviar ao tutor..."
            className="w-full text-[#424231] text-xs sm:text-sm bg-white border border-transparent rounded-2xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#D4A373] focus:outline-hidden resize-none"
          />
        </div>

        {/* Chronological events stack list inside walk */}
        {events.length > 0 && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="text-[10px] font-bold uppercase text-[#FEFAE0]/70 block tracking-wider">Cronologia Recente</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {events.slice().reverse().map((ev) => (
                <div key={ev.id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-xs flex items-center gap-2">
                  <span className="text-[10px] text-[#E9EDC9] font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <span className="font-bold text-white">{ev.label}</span>
                    {ev.notes && <span className="text-slate-300 block text-[10px] mt-0.5">"{ev.notes}"</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom actions control */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleFinishWalk}
            className="w-full py-4 bg-[#D4A373] hover:bg-[#E2B384] text-[#424231] rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Square className="h-4.5 w-4.5 fill-[#424231] text-transparent" /> Finalizar Passeio e Gerar Relatório
          </button>
        </div>

        {/* Event logging overlay modal */}
        {activeEventModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#424231] border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                Detalhes da Ocorrência
              </h4>
              <p className="text-xs text-slate-300">Adicione uma observação opcional para esta atividade:</p>
              
              <input
                type="text"
                value={eventNoteInput}
                onChange={(e) => setEventNoteInput(e.target.value)}
                maxLength={80}
                placeholder="Ex. fezes normais, bebeu tudo, etc."
                className="w-full bg-[#313123] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-[#D4A373]"
                autoFocus
              />

              <div className="flex gap-2 justify-end pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveEventModal(null)}
                  className="px-4 py-2 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmEventLogging}
                  className="px-4 py-2 bg-[#D4A373] hover:bg-[#E2B384] text-[#424231] rounded-lg cursor-pointer font-bold"
                >
                  Confirmar Ocorrência
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pick pets selection state
  return (
    <div className="bg-white rounded-3xl border border-[#E9E9D8] shadow-sm p-6 sm:p-8 space-y-6 font-sans">
      <div className="border-b border-[#F5F5ED] pb-4">
        <h3 className="text-xl sm:text-2xl font-serif italic text-[#424231] tracking-tight flex items-center gap-2">
          🐾 Iniciar Atendimento
        </h3>
        <p className="text-xs sm:text-sm text-[#8C8C73] mt-1">
          Selecione o pet participante cadastrado para iniciar o cronômetro oficial do passeio.
        </p>
      </div>

      {/* Pet lists checkboxes */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-[#8C8C73] uppercase tracking-widest block font-sans">Pets Disponíveis</label>
        
        {pets.length === 0 ? (
          <div className="py-12 text-center text-[#8C8C73] border border-[#E9E9D8] bg-[#F9F8F3] rounded-2xl font-sans">
            Nenhum pet cadastrado no sistema ainda. Crie um Tutor e um Pet para poder passear!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {pets.map((pet) => {
              const matchesSelected = selectedPetIds.includes(pet.id);
              return (
                <div
                  key={pet.id}
                  onClick={() => handleTogglePet(pet.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${matchesSelected ? 'border-[#5A5A40] bg-[#E9EDC9]/25' : 'border-[#E9E9D8] bg-white hover:border-[#CCD5AE]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-[#E9EDC9] border border-[#CCD5AE]/40 font-black text-[#5A5A40] flex items-center justify-center uppercase select-none overflow-hidden shrink-0">
                      {pet.photo && pet.photo.startsWith('data:image') ? (
                        <img src={pet.photo} referrerPolicy="no-referrer" alt={pet.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <span>{pet.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-serif italic text-base text-[#424231] leading-none">{pet.name}</h4>
                      <p className="text-[10px] text-[#8C8C73] mt-1.5 font-medium">{pet.breed || 'SRD'} &bull; Porte {pet.size}</p>
                    </div>
                  </div>

                  <div className={`h-5.5 w-5.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${matchesSelected ? 'bg-[#5A5A40] border-[#5A5A40] text-white' : 'border-[#E9E9D8] bg-white'}`}>
                    {matchesSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="pt-4 border-t border-[#F5F5ED] flex items-center justify-between">
        <span className="text-xs text-[#8C8C73] font-semibold">
          {selectedPetIds.length} {selectedPetIds.length === 1 ? 'pet selecionado' : 'pets selecionados'}
        </span>
        <button
          onClick={handleStartWalk}
          disabled={selectedPetIds.length === 0}
          className="px-6 py-2.5 bg-[#424231] hover:bg-[#5A5A40] disabled:bg-[#E9E9D8] disabled:text-[#8C8C73] text-white rounded-full text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          Iniciar Atendimento Passeio
        </button>
      </div>
    </div>
  );
}
