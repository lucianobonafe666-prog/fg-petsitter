/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

// Declare Leaflet global type
declare global {
  interface Window {
    L: any;
  }
}

interface MapComponentProps {
  coordinates: { lat: number; lng: number }[];
  heightClass?: string;
  interactive?: boolean;
}

export default function MapComponent({
  coordinates,
  heightClass = 'h-48 sm:h-56',
  interactive = true
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Auto-generate a unique container ID so multiple maps on the same page do not collide
  const [mapId] = useState(() => 'leaflet-map-' + Math.random().toString(36).substring(2, 9));

  // Dynamically load Leaflet assets
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Check if script or style already inserted
    let cssLink = document.querySelector('link[href*="leaflet.css"]');
    if (!cssLink) {
      cssLink = document.createElement('link');
      (cssLink as HTMLLinkElement).rel = 'stylesheet';
      (cssLink as HTMLLinkElement).href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);
    }

    let jsScript = document.querySelector('script[src*="leaflet.js"]');
    if (!jsScript) {
      jsScript = document.createElement('script');
      (jsScript as HTMLScriptElement).src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      (jsScript as HTMLScriptElement).async = true;
      document.head.appendChild(jsScript);
    }

    const checkInterval = setInterval(() => {
      if (window.L) {
        setLeafletLoaded(true);
        clearInterval(checkInterval);
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      if (!window.L) {
        setLoadError(true);
      }
    }, 8000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize and update Map Instance
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || loadError) return;

    const L = window.L;
    if (!L) return;

    // Center layout: default center if empty coordinates is a nice scenic area in RJ of SP
    const defaultCenter: [number, number] = [-23.5874, -46.6576]; // Parque do Ibirapuera
    const hasPoints = coordinates && coordinates.length > 0;
    const initialCenter = hasPoints ? [coordinates[0].lat, coordinates[0].lng] : defaultCenter;

    // Destroy prior instance if existing
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('Error during leaflet cleanup:', err);
      }
      mapInstanceRef.current = null;
      polylineRef.current = null;
      markersRef.current = [];
    }

    // Create the Leaflet Map
    try {
      const map = L.map(mapId, {
        zoomControl: interactive,
        attributionControl: false,
        scrollWheelZoom: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
      }).setView(initialCenter, hasPoints ? 15 : 13);

      mapInstanceRef.current = map;

      // Use a beautiful, minimalist, modern dark map tile layer to match the pet walker theme
      // CARTO DB Positron or Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map);

      // Force layout update next tick to resolve width/height constraints
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);

    } catch (e) {
      console.error('Failed to initialize Map:', e);
      return;
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn('Cleanup error:', err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, mapId, loadError, interactive]);

  // Synchronize coordinates, redraw lines and pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!leafletLoaded || !map) return;

    const L = window.L;
    if (!L) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!coordinates || coordinates.length === 0) return;

    const latLngs = coordinates.map(c => [c.lat, c.lng]);

    // Redraw polyline
    polylineRef.current = L.polyline(latLngs, {
      color: '#5A5A40',
      weight: 4,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Add START Pin with L.divIcon to prevent broken CDN image paths
    const startObj = coordinates[0];
    const startIcon = L.divIcon({
      className: 'custom-map-marker-start',
      html: `
        <div style="
          background-color: #2e7d32; 
          width: 12px; 
          height: 12px; 
          border-radius: 50%; 
          border: 2.5px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const startMarker = L.marker([startObj.lat, startObj.lng], { icon: startIcon })
      .bindPopup('<b>Início do Passeio</b>')
      .addTo(map);
    markersRef.current.push(startMarker);

    // Add CURRENT / END Pin with custom Pulse HTML
    if (coordinates.length > 1) {
      const currentObj = coordinates[coordinates.length - 1];
      const activeIcon = L.divIcon({
        className: 'custom-map-marker-current',
        html: `
          <div style="position: relative; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute; 
              width: 14px; 
              height: 14px; 
              background-color: #3b82f6; 
              border-radius: 50%; 
              opacity: 0.5;
              animation: map-ping-pulse 1.8s infinite ease-out;
            "></div>
            <div style="
              width: 10px; 
              height: 10px; 
              background-color: #1d4ed8; 
              border-radius: 50%; 
              border: 1.5px solid white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.4);
              position: relative;
              z-index: 10;
            "></div>
          </div>
          <style>
            @keyframes map-ping-pulse {
              0% { transform: scale(0.6); opacity: 0.8; }
              100% { transform: scale(2.4); opacity: 0; }
            }
          </style>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const currentMarker = L.marker([currentObj.lat, currentObj.lng], { icon: activeIcon })
        .bindPopup('<b>Posição Atual</b>')
        .addTo(map);
      markersRef.current.push(currentMarker);
    }

    // Adjust map viewport to cover all coords
    try {
      if (coordinates.length === 1) {
        map.setView([coordinates[0].lat, coordinates[0].lng], 16);
      } else {
        map.fitBounds(L.latLngBounds(latLngs), {
          padding: [25, 25],
          maxZoom: 16
        });
      }
    } catch (err) {
      console.warn('Could not fitBounds map:', err);
    }

  }, [coordinates, leafletLoaded]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#E9E9D8] bg-[#FAF9F6]">
      {!leafletLoaded && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 z-20 gap-2 p-4">
          <div className="w-6 h-6 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] text-[#8C8C73] uppercase tracking-wider font-bold">Carregando Mapa de Monitoramento...</p>
        </div>
      )}
      
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/90 z-20 gap-1.5 p-4 text-center">
          <span className="text-xl">🗺️</span>
          <p className="text-xs font-bold text-amber-900">Falha ao carregar Provedor de Mapas</p>
          <p className="text-[10px] text-amber-700 max-w-xs">Verifique sua conexão. O rastreamento de satélite continua gravando suas coordenadas mesmo offline.</p>
        </div>
      )}

      <div 
        ref={containerRef} 
        id={mapId} 
        className={`w-full ${heightClass} z-10`}
      />
    </div>
  );
}
