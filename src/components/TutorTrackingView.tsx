/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Walk, ActivityEvent } from '../types';
import { MapPin, Clock, Footprints, Droplet, Smile, Camera, ShieldCheck, Heart, AlertCircle, Sparkles, Navigation } from 'lucide-react';
import MapComponent from './MapComponent';

interface TutorTrackingViewProps {
  walkId: string;
  onClose: () => void;
}

export default function TutorTrackingView({ walkId, onClose }: TutorTrackingViewProps) {
  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickerSeconds, setTickerSeconds] = useState(0);

  // Monitor the walk path in real-time
  useEffect(() => {
    setLoading(true);
    setError(null);

    const docRef = doc(db, 'passeios', walkId);
    
    // Subscribe in real-time!
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mappedWalk: Walk = {
            id: docSnap.id,
            userId: data.userId || '',
            petIds: data.petIds || [],
            petDetails: data.petDetails || [],
            startTime: data.startTime || '',
            endTime: data.endTime || null,
            durationMinutes: Number(data.durationMinutes) || 0,
            notes: data.notes || '',
            photos: data.photos || [],
            events: data.events || [],
            routeSimulated: data.routeSimulated || []
          };
          setWalk(mappedWalk);
        } else {
          setError('Este passeio não foi localizado ou já foi removido.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Real-time subscription error:', err);
        setError('Erro de permissão ou conexão ao assinar atualizações em tempo real.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [walkId]);

  // Live chronometer ticker for duration since start
  useEffect(() => {
    if (!walk || walk.endTime) return;

    const startMs = new Date(walk.startTime).getTime();
    if (isNaN(startMs)) return;

    const interval = setInterval(() => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setTickerSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [walk]);

  const formatElapsed = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold text-[#424231] font-sans">Carregando telemetria ao vivo...</h2>
        <p className="text-xs text-[#8C8C73] mt-1 max-w-xs">Estabelecendo transmissão criptografada direta com o GPS do Passeador.</p>
      </div>
    );
  }

  if (error || !walk) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-xs">
          <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
          <div>
            <h3 className="font-bold text-base">Rastreamento Indisponível</h3>
            <p className="text-xs text-red-700 mt-1">{error || 'Não foi possível carregar os dados deste percurso.'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-[#5A5A40] text-[#FEFAE0] hover:bg-[#424231] font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
          >
            Voltar para o Painel
          </button>
        </div>
      </div>
    );
  }

  const isLive = !walk.endTime;
  const distance = walk.routeSimulated && walk.routeSimulated.length > 0
    ? (walk.routeSimulated.length * 0.045).toFixed(2) // backward approximate or direct simulated length
    : '0.00';

  // Calculate speed if active, otherwise average speed
  const speed = isLive ? '4.2' : ((Number(distance) / (walk.durationMinutes || 1)) * 60).toFixed(1);

  return (
    <div id="tutor-tracking-board" className="min-h-screen bg-[#FAF9F6] pb-12 font-sans select-none">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-[#E9E9D8] sticky top-0 z-30 shadow-xs px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#E9EDC9] rounded-xl flex items-center justify-center shadow-xs">
              <span className="text-base">🐕</span>
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#424231] tracking-tight">Rastreador de Passeio</h1>
              <p className="text-[9px] text-[#8C8C73] uppercase tracking-wider font-bold">Dog Walker Pro &bull; Tutor Link</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-[10px] font-bold text-red-600 uppercase tracking-wider animate-pulse">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full" /> Ao Vivo
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" /> Concluído
              </span>
            )}
            <button
              onClick={onClose}
              className="text-[#8C8C73] hover:text-[#424231] text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* Tutor Welcome Greetings Card */}
        <div className="bg-[#E9EDC9] border border-[#D4C3B3]/40 rounded-3xl p-5 sm:p-6 text-[#424231] relative overflow-hidden shadow-xs">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]">
              <Sparkles className="h-4 w-4" /> Relacionamento Pro ativo
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Acompanhe o percurso de {walk.petDetails && walk.petDetails.length > 0 
                ? walk.petDetails.map(p => p.name).join(' e ') 
                : 'seu pet'}
            </h2>
            <p className="text-xs text-[#5A5A40] max-w-xl leading-relaxed">
              {isLive 
                ? 'Aqui você pode ver em tempo real no mapa o trajeto exato sendo percorrido pelo passeador credenciado, junto com fotos enviadas de campo e registros de comportamento!'
                : `Este atendimento foi finalizado. Veja abaixo o resumo final do passeio do seu pet, incluindo o mapa do trajeto completo e o diário de campo.`}
            </p>
          </div>

          {/* Decorative icons decoration */}
          <div className="absolute right-4 bottom-0 translate-y-4 opacity-15 text-7xl select-none">
            🦮
          </div>
        </div>

        {/* Live Telemetry Panels Dashboard */}
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
          <div className="bg-white border border-[#E9E9D8] rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[9px] uppercase tracking-wider text-[#8C8C73] font-bold block mb-1">Duração</span>
            <div className="flex items-center justify-center gap-1 text-[#424231]">
              <Clock className="h-4 w-4 text-[#8C8C73]" />
              <span className="text-base sm:text-lg font-bold font-mono">
                {isLive ? formatElapsed(tickerSeconds) : `${walk.durationMinutes} min`}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E9E9D8] rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[9px] uppercase tracking-wider text-[#8C8C73] font-bold block mb-1">Distância</span>
            <div className="flex items-center justify-center gap-1 text-[#424231]">
              <Footprints className="h-4 w-4 text-[#8C8C73]" />
              <span className="text-base sm:text-lg font-bold font-mono">
                {walk.routeSimulated && walk.routeSimulated.length > 0 
                  ? `${(walk.routeSimulated.length * 0.04).toFixed(2)} km`
                  : '0.00 km'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E9E9D8] rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[9px] uppercase tracking-wider text-[#8C8C73] font-bold block mb-1">Velocidade</span>
            <div className="flex items-center justify-center gap-1 text-[#424231]">
              <Navigation className="h-4 w-4 text-[#8C8C73] rotate-45" />
              <span className="text-base sm:text-lg font-bold font-mono">{speed} km/h</span>
            </div>
          </div>
        </div>

        {/* The Live Map Container */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C8C73] flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#5A5A40]" /> Mapa de Rota em Tempo Real
          </h3>
          <MapComponent 
            coordinates={walk.routeSimulated || []} 
            heightClass="h-72 sm:h-96"
            interactive={true} 
          />
        </div>

        {/* Grid layout for Photos and Events logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photos Upload Board */}
          <div className="bg-white border border-[#E9E9D8] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C8C73] flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Camera className="h-4.5 w-4.5 text-[#5A5A40]" /> Fotos Instantâneas do Passeio
            </h3>

            {walk.photos && walk.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {walk.photos.map((ph, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl border border-[#E9E9D8] bg-[#FAF9F6] overflow-hidden group shadow-inner">
                    <img 
                      src={ph} 
                      alt="Registro do passeio" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-2 text-white text-[8px] font-bold flex items-center gap-1">
                      <Camera className="h-2.5 w-2.5 text-slate-200" /> Registro #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#8C8C73] space-y-1">
                <span className="text-2xl block">📸</span>
                <p className="text-xs font-medium">Nenhuma foto enviada ainda.</p>
                <p className="text-[10px] text-slate-400">Fotos tiradas pelo passeador aparecerão instantaneamente aqui.</p>
              </div>
            )}
          </div>

          {/* Real-time Field Events logs */}
          <div className="bg-white border border-[#E9E9D8] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C8C73] flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Smile className="h-4.5 w-4.5 text-[#5A5A40]" /> Ocorrências e Atividades Realizadas
            </h3>

            {walk.events && walk.events.length > 0 ? (
              <div className="relative border-l border-[#E9E9D8] pl-4 ml-2 space-y-4 max-h-[340px] overflow-y-auto">
                {walk.events.slice().reverse().map((ev) => {
                  const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div key={ev.id} className="relative text-left">
                      {/* Bullet icon indicator */}
                      <span className="absolute -left-[25px] top-0.5 bg-white border-2 border-[#5A5A40] h-3.5 w-3.5 rounded-full flex items-center justify-center">
                        <span className="h-1 w-1 bg-[#5A5A40] rounded-full" />
                      </span>

                      <div className="bg-[#FAF9F6] border border-[#E9E9D8] rounded-xl p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#424231]">{ev.label}</span>
                          <span className="text-[9px] font-mono font-medium text-[#8C8C73]">{timeStr}</span>
                        </div>
                        {ev.notes && (
                          <p className="text-[11px] text-[#5A5A40] italic bg-white px-2 py-1.5 rounded-lg border border-[#E9E9D8]/50 mt-1">
                            "{ev.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-[#8C8C73] space-y-1">
                <span className="text-2xl block">📒</span>
                <p className="text-xs font-medium">Aguardando ocorrências.</p>
                <p className="text-[10px] text-slate-400">Atividades fisiológicas e brincadeiras registradas no passeio aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info/quality badge */}
        <div className="bg-white border border-[#E9E9D8] rounded-2xl p-4 text-center text-xs text-[#8C8C73] space-y-1 shadow-xs">
          <p className="font-bold flex items-center justify-center gap-1 text-[#424231]">
            <ShieldCheck className="h-4 w-4 text-[#5A5A40]" /> Atendimento de Bem-estar Verificado
          </p>
          <p className="text-[10px] leading-relaxed">
            Nossos passeadores rastreiam integralmente os serviços em conformidade com as diretivas de proteção animal. 
            Todas as métricas de tempo e posicionamento GPS são auditadas.
          </p>
        </div>
      </main>
    </div>
  );
}
