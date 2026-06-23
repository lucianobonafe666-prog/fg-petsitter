/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, AlertCircle, Camera, Check, Clock, Edit2, MapPin, Plus, ShieldCheck, Droplet, Smile, MessageSquare, Trash, Sparkles, Footprints, ChevronUp, Copy, HelpCircle, Navigation } from 'lucide-react';
import { Pet, Walk, ActivityEvent, ActivityEventType } from '../types';
import MapComponent from './MapComponent';

interface ActiveWalkViewProps {
  pets: Pet[];
  onWalkFinished: (walk: Walk, activeWalkId?: string | null) => void;
  quickSelectedPetId?: string | null;
  onInitActiveWalk?: (walkDraft: Omit<Walk, 'id'>) => Promise<string>;
  onSyncActiveCoords?: (walkId: string, coords: { lat: number; lng: number }[], events: ActivityEvent[], photos: string[]) => Promise<void>;
}

// Haversine formula to compute distance in km between two GPS coordinates
function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

// Default simulated camera shots
const MOCK_PHOTOS = [
  { id: 'p1', name: 'No Gramado', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=400' },
  { id: 'p2', name: 'Bebendo Água', url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=400' },
  { id: 'p3', name: 'Correndo', url: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=400' },
  { id: 'p4', name: 'Descanso Sombra', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400' },
];

export default function ActiveWalkView({ 
  pets, 
  onWalkFinished, 
  quickSelectedPetId = null,
  onInitActiveWalk,
  onSyncActiveCoords
}: ActiveWalkViewProps) {
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

  // Tutor sharing tracking states
  const [onlineWalkId, setOnlineWalkId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharingLive, setIsSharingLive] = useState(false);

  // GPS & Tracking states
  const [trackingMode, setTrackingMode] = useState<'real' | 'simulated'>('real');
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Simulation metrics
  const [simulatedDistance, setSimulatedDistance] = useState(0); // km
  const [simulatedSpeed, setSimulatedSpeed] = useState(0); // km/h
  const [gpsPoints, setGpsPoints] = useState<{ x: number; y: number }[]>([]); // backward compatible reference

  // Event logger helper modal
  const [activeEventModal, setActiveEventModal] = useState<ActivityEventType | null>(null);
  const [eventNoteInput, setEventNoteInput] = useState('');

  // Finished summarization modal
  const [finishedWalk, setFinishedWalk] = useState<Walk | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Interval timers & Watch references
  const clockIntervalRef = useRef<any>(null);
  const simulationIntervalRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Auto handle selected pet from deep-link starting
  useEffect(() => {
    if (quickSelectedPetId && pets.some(p => p.id === quickSelectedPetId)) {
      setSelectedPetIds([quickSelectedPetId]);
    }
  }, [quickSelectedPetId, pets]);

  // Master tracking loop effect
  useEffect(() => {
    if (isActive) {
      // 1. Start general chronometer
      clockIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      if (trackingMode === 'real') {
        // --- REAL GPS TRACKING ---
        if (navigator.geolocation) {
          // Fire an initial geolocation check to speed up centering
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setRouteCoords([{ lat: latitude, lng: longitude }]);
              setGpsPoints([{ x: 50, y: 150 }]); // backwards compatible
            },
            (err) => {
              console.warn('Initial geolocation warning:', err);
            }
          );

          // Watch position continuously
          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              const { latitude, longitude, speed } = position.coords;
              
              setRouteCoords(prev => {
                if (prev.length > 0) {
                  const last = prev[prev.length - 1];
                  const d = getDistanceKM(last.lat, last.lng, latitude, longitude);
                  
                  // Filter tiny GPS drift jitter (only move if > 3 meters)
                  if (d < 0.003) return prev;

                  // Add to overall physical distance walked
                  setSimulatedDistance(prevDist => Number((prevDist + d).toFixed(2)));
                } else {
                  setSimulatedDistance(0);
                }

                if (speed !== null && speed !== undefined) {
                  setSimulatedSpeed(Math.max(1.8, speed * 3.6)); // km/h
                } else {
                  setSimulatedSpeed(3.5 + Math.random() * 1.5); // generic walking speed
                }

                // Append backwards compatible coordinate point simulation representation
                setGpsPoints(pts => {
                  if (pts.length === 0) return [{ x: 50, y: 150 }];
                  const lastPt = pts[pts.length - 1];
                  return [...pts, { x: lastPt.x + 15, y: lastPt.y + (Math.random() - 0.5) * 10 }];
                });

                return [...prev, { lat: latitude, lng: longitude }];
              });
              setGpsError(null);
            },
            (error) => {
              console.warn('Geolocation sensor error:', error);
              let msg = 'Erro ao adquirir sinal do GPS.';
              if (error.code === error.PERMISSION_DENIED) {
                msg = 'Permissão de GPS negada pelo navegador.';
              } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg = 'Sinal de satélite GPS indisponível.';
              } else if (error.code === error.TIMEOUT) {
                msg = 'Dispositivo demorou muito para responder GPS.';
              }
              setGpsError(msg);
              // Fallback guide standard behavior to notice simulated alternative
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
          watchIdRef.current = watchId;
        } else {
          setGpsError('Este navegador não suporta geolocalização.');
          setTrackingMode('simulated');
        }
      } else {
        // --- ORGANIC GPS ROUTE SIMULATION ---
        // Generates beautiful realistic walking trail in Parque do Ibirapuera, São Paulo
        let angle = Math.random() * Math.PI * 2;
        const startLat = -23.587413;
        const startLng = -46.657639;
        
        setRouteCoords([{ lat: startLat, lng: startLng }]);
        setGpsPoints([{ x: 50, y: 150 }]);
        setSimulatedSpeed(4.2);

        simulationIntervalRef.current = setInterval(() => {
          setSimulatedSpeed(3.8 + Math.random() * 1.2);
          
          setRouteCoords(prev => {
            const last = prev[prev.length - 1] || { lat: startLat, lng: startLng };
            angle += (Math.random() - 0.5) * 0.45; // subtle turning rhythm
            
            const displacement = 0.00010 + Math.random() * 0.00003; // ~10 to 13 meters offset
            const nextLat = last.lat + Math.cos(angle) * displacement;
            const nextLng = last.lng + Math.sin(angle) * displacement;
            
            const d = getDistanceKM(last.lat, last.lng, nextLat, nextLng);
            setSimulatedDistance(prevDist => Number((prevDist + d).toFixed(2)));

            setGpsPoints(pts => {
              const lastPt = pts[pts.length - 1] || { x: 50, y: 150 };
              return [...pts, { x: lastPt.x + 15, y: lastPt.y + (Math.random() - 0.5) * 10 }];
            });

            return [...prev, { lat: nextLat, lng: nextLng }];
          });
        }, 2000);
      }
    } else {
      // Cleanup all trackers
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, trackingMode]);

  // Periodic background Firestore sync when sharing is active
  useEffect(() => {
    if (isActive && onlineWalkId && onSyncActiveCoords) {
      const syncInterval = setInterval(() => {
        onSyncActiveCoords(onlineWalkId, routeCoords, events, photos);
      }, 10000); // Sync every 10 seconds
      return () => clearInterval(syncInterval);
    }
  }, [isActive, onlineWalkId, routeCoords, events, photos, onSyncActiveCoords]);

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
    setRouteCoords([]);
    setGpsError(null);
    setIsActive(true);
    setOnlineWalkId(null);
    setIsSharingLive(false);
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

    const selectedPetsList = pets.filter(p => selectedPetIds.includes(p.id));
    const petDetailsMapped = selectedPetsList.map(p => ({
      name: p.name,
      breed: p.breed,
      photo: p.photo
    }));

    const finalWalk: Walk = {
      id: onlineWalkId || 'walk_' + Math.random().toString(36).substr(2, 9),
      userId: pets[0]?.userId || 'user_default',
      petIds: selectedPetIds,
      petDetails: petDetailsMapped,
      startTime,
      endTime,
      durationMinutes: duration,
      notes: notes.trim() || 'Passeio realizado com sucesso.',
      photos,
      events,
      routeSimulated: routeCoords // real-world and simulated coordinates
    };

    // Save back to db
    onWalkFinished(finalWalk, onlineWalkId);
    setFinishedWalk(finalWalk);
    setIsActive(false);
    setIsSharingLive(false);
  };

  const handleShareTracking = async () => {
    if (!onInitActiveWalk) return;
    
    // If we already have configured an onlineWalkId, just copy its share URL
    if (onlineWalkId) {
      const shareUrl = `${window.location.origin}?sharedWalkId=${onlineWalkId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      return;
    }

    try {
      setIsSyncing(true);
      
      const selectedPetsList = pets.filter(p => selectedPetIds.includes(p.id));
      const petDetailsMapped = selectedPetsList.map(p => ({
        name: p.name,
        breed: p.breed,
        photo: p.photo
      }));

      const walkDraft: Omit<Walk, 'id'> = {
        userId: pets[0]?.userId || 'user_default',
        petIds: selectedPetIds,
        petDetails: petDetailsMapped,
        startTime: startTime || new Date().toISOString(),
        endTime: null,
        durationMinutes: 0,
        notes: '',
        photos: photos,
        events: events,
        routeSimulated: routeCoords
      };

      const walkId = await onInitActiveWalk(walkDraft);
      setOnlineWalkId(walkId);
      setIsSharingLive(true);
      
      const shareUrl = `${window.location.origin}?sharedWalkId=${walkId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Error starting live tracking share:', err);
    } finally {
      setIsSyncing(false);
    }
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

        {/* TUTOR REAL-TIME LINK SHARE */}
        <div className="bg-[#313123] border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="h-4 w-4 text-[#D4A373]" /> Compartilhar com o Tutor
              </h4>
              <p className="text-[10px] text-slate-300">Permita que o dono acompanhe o pet ao vivo pelo GPS sem precisar de login.</p>
            </div>
            {isSharingLive && (
              <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full text-[8px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                • Ativo
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleShareTracking}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSharingLive 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-[#D4A373] hover:bg-[#E2B384] text-[#424231]'
              }`}
            >
              {isSyncing ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-[#424231] border-t-transparent rounded-full animate-spin" />
                  Gerando Link...
                </>
              ) : copiedLink ? (
                <>
                  <Check className="h-4 w-4" /> Link Copiado! ✓
                </>
              ) : isSharingLive ? (
                <>
                  <Copy className="h-4 w-4" /> Copiar Link de Acompanhamento
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Ativar Rastreamento ao Vivo
                </>
              )}
            </button>

            {isSharingLive && (
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Olá! Já iniciei o passeio do seu pet. Você de onde estiver pode acompanhar o trajeto exato através do link do GPS em tempo real: ${window.location.origin}?sharedWalkId=${onlineWalkId}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                💬 Enviar WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* GPS Mode Selector and Status Warnings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-[#FEFAE0]/70 tracking-wider uppercase flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-[#E9EDC9]" /> Conexão do Rastreamento GPS
            </span>
            <div className="flex bg-[#313123] rounded-lg p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setTrackingMode('real')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  trackingMode === 'real'
                    ? 'bg-[#5A5A40] text-[#FEFAE0]'
                    : 'text-[#FEFAE0]/60 hover:text-white'
                }`}
              >
                📡 GPS Real
              </button>
              <button
                type="button"
                onClick={() => setTrackingMode('simulated')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  trackingMode === 'simulated'
                    ? 'bg-[#5A5A40] text-[#FEFAE0]'
                    : 'text-[#FEFAE0]/60 hover:text-white'
                }`}
              >
                🤖 Simulador
              </button>
            </div>
          </div>

          {gpsError && trackingMode === 'real' && (
            <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-yellow-300 text-xs text-left">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-yellow-400 mt-0.5" />
              <div>
                <span className="font-bold">Aviso de Sinal: </span>
                {gpsError} Autorize a permissão de localização do seu navegador ou mude para o modo <b>Simulador</b> para testar a rota em tempo real.
              </div>
            </div>
          )}
        </div>

        {/* Live coordinate map tracker path */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#313123]">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-[#424231]/90 border border-white/15 text-[9px] font-bold uppercase text-[#FEFAE0] px-2.5 py-1 rounded-md z-25 backdrop-blur-xs pointer-events-none shadow-sm">
            <span className={`h-2 w-2 rounded-full ${trackingMode === 'real' && !gpsError ? 'bg-emerald-400 animate-pulse' : 'bg-[#E9EDC9] animate-pulse'}`} />
            {trackingMode === 'real' ? 'Acompanhamento GPS (Satélite)' : 'Modo Demonstração (Simulado)'}
          </div>

          <MapComponent 
            coordinates={routeCoords} 
            heightClass="h-44 sm:h-52" 
            interactive={true} 
          />
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
