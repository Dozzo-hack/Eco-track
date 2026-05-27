"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Navigation, Clock, RotateCcw, MapPin, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';

import 'leaflet/dist/leaflet.css';

// COMPOSANT CARTE
const MapContainerComponent = ({ truckPos, clients, roadPath }) => {
  const { MapContainer, TileLayer, Marker, Popup, Polyline } = require('react-leaflet');
  const L = require('leaflet');

  const truckIcon = L.divIcon({
    className: 'truck-marker',
    html: `<div style="background-color:#f97316; width:40px; height:40px; border-radius:50%; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; font-size:20px;">🚚</div>`,
    iconSize: [40, 40], iconAnchor: [20, 20],
  });

  const clientIcon = (status, role) => L.divIcon({
    className: 'client-marker',
    html: `<div style="background-color:${status === 'Terminé' ? '#22c55e' : role === 'PRO' ? '#8b5cf6' : '#3b82f6'}; width:30px; height:30px; border-radius:50%; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.2); display:flex; align-items:center; justify-content:center; color:white; font-weight:900; font-size:10px;">${role === 'PRO' ? 'PRO' : 'BAS'}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  });

  return (
    <MapContainer center={truckPos} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
      
      {roadPath.length > 1 && (
        <Polyline positions={roadPath} pathOptions={{ color: '#f97316', weight: 4, opacity: 0.6, dashArray: '10, 15' }} />
      )}
      
      <Marker position={truckPos} icon={truckIcon}>
        <Popup>Votre Camion (En déplacement live)</Popup>
      </Marker>

      {clients.map((c, i) => (
        <Marker key={i} position={c.pos} icon={clientIcon(c.status, c.type)}>
          <Popup>
            <div className="font-sans text-xs">
              <b className="text-sm block">{c.name}</b>
              <span className="text-slate-500 font-bold uppercase text-[9px] block mt-0.5">Quartier : {c.quartier}</span>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded-full font-black text-[9px] text-white ${c.status === 'Terminé' ? 'bg-green-500' : 'bg-amber-500'}`}>
                {c.status === 'Terminé' ? 'VIDÉ' : 'À VIDER'}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

const MapNoSSR = dynamic(() => Promise.resolve(MapContainerComponent), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex flex-col items-center justify-center gap-2">
      <Navigation className="text-slate-300 animate-bounce" size={40} />
      <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Initialisation GPS...</span>
    </div>
  )
});

export default function MapPage() {
  const [loading, setLoading] = useState(false);
  const [truckPos, setTruckPos] = useState([4.0511, 9.7679]); 
  const [videurInfos, setVideurInfos] = useState(null);
  const [clients, setClients] = useState([]);

  // Fonction de synchronisation avec notre API sécurisée
  const rafraichirDonneesDonnees = useCallback(async () => {
    try {
      const res = await fetch("/api/truck/map-data");
      if (!res.ok) return;
      const json = await res.json();
      
      if (json.success) {
        setVideurInfos(json.videur);
        setClients(json.clients);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des données de la carte:", err);
    }
  }, []);

  useEffect(() => {
    rafraichirDonneesDonnees();
  }, [rafraichirDonneesDonnees]);

  // 📡 GEOLOCALISATION ET CANAL SSE LIVE
  useEffect(() => {
    if (!navigator.geolocation || !videurInfos) return;

    const diffuserGpsSse = async (lat, lng) => {
      try {
        await fetch("/api/live-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            streamType: "truck-move",
            truckId: videurInfos.isSuperVideur ? "SUPER-TRUCK" : `TRUCK-${videurInfos.nom.toUpperCase().replace(/\s+/g, '-')}`,
            planningId: "TOURNEE-LIVE",
            currentPos: [lat, lng]
          })
        });
      } catch (err) {
        console.error(err);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setTruckPos([latitude, longitude]);
        diffuserGpsSse(latitude, longitude);
      },
      (error) => console.error("Erreur capteur GPS:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    const eventSource = new EventSource("/api/live-tracking");
    eventSource.addEventListener("collecte-update", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.actionType === "SCAN_BAC") {
          setClients((prev) => prev.map((c) => c.id === data.clientId ? { ...c, status: "Terminé" } : c));
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      eventSource.close();
    };
  }, [videurInfos]);

  const handleRefresh = async () => {
    setLoading(true);
    await rafraichirDonneesDonnees();
    setLoading(false);
  };

  const roadPath = [truckPos, ...clients.filter(c => c.status !== "Terminé").map(c => c.pos)];
  const prochainPoint = clients.find(c => c.status !== "Terminé") || { name: "Tournée Clôturée", quartier: "-" };

  if (!videurInfos) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 font-sans font-bold text-sm text-slate-500 uppercase tracking-wider animate-pulse">
        Vérification et synchronisation du profil...
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto animate-in fade-in duration-700 font-sans">
      
      {/* BANDEAU EN-TÊTE PRO SYNCHRONISÉ */}
      <div className={`mb-4 p-4 rounded-[25px] text-white flex items-center justify-between shadow-lg transition-all ${videurInfos.isSuperVideur ? 'bg-gradient-to-r from-purple-700 to-indigo-900' : 'bg-gradient-to-r from-orange-500 to-amber-600'}`}>
        <div>
          <p className="text-[9px] uppercase font-black opacity-75 tracking-wider">Session Chauffeur</p>
          <h2 className="text-md font-black">{videurInfos.nom}</h2>
        </div>
        <div className="bg-white/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
          {videurInfos.isSuperVideur ? <ShieldAlert size={12} /> : null}
          {videurInfos.isSuperVideur ? 'SUPER VIDEUR' : `ZONE : ${videurInfos.quartiers.join(', ')}`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-[30px] border border-white shadow-sm flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600"><Clock size={20} /></div>
          <div>
            <p className="text-[8px] uppercase font-black text-slate-400">Bacs Restants</p>
            <p className="text-sm font-black text-slate-800 font-mono">
              {clients.filter(c => c.status !== 'Terminé').length} / {clients.length}
            </p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-[30px] border border-white shadow-sm flex items-center gap-3">
          <div className="bg-green-500/10 p-2 rounded-xl text-green-600"><Navigation size={20} /></div>
          <div>
            <p className="text-[8px] uppercase font-black text-slate-400">Flux Réseau</p>
            <p className="text-xs font-black text-green-500 tracking-wider">SSE EN DIRECT</p>
          </div>
        </div>
      </div>

      <button 
        onClick={handleRefresh}
        disabled={loading}
        className={`w-full mb-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl
          ${loading ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 text-white active:scale-95 shadow-blue-100'}`}
      >
        <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Recherche des bacs en cours...' : 'Rafraîchir & Synchroniser'}
      </button>

      <div className="relative h-[530px] rounded-[45px] overflow-hidden border-4 border-white shadow-2xl bg-slate-50">
        <MapNoSSR truckPos={truckPos} clients={clients} roadPath={roadPath} />
        
        {/* Next Stop UI */}
        <div className="absolute bottom-6 left-6 right-6 z-[1000] bg-slate-900/95 backdrop-blur-md p-5 rounded-[30px] flex items-center gap-4 border border-white/10">
          <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-0.5">Prochain Point ({prochainPoint.quartier})</p>
            <p className="text-sm font-bold text-white leading-tight truncate max-w-[170px]">{prochainPoint.name}</p>
          </div>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
        </div>
      </div>
    </div>
  );
}