"use client";
import React, { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import { 
  ArrowLeft, 
  MapPin, 
  Zap, 
  Clock, 
  CheckCircle, 
  Navigation, 
  AlertCircle, 
  Maximize2,
  TrendingUp,
  Fuel
} from 'lucide-react';
import Link from 'next/link';

// Chargement dynamique de la carte pour éviter les erreurs de serveur (SSR)
const LiveTourMap = dynamic(() => import('@/components/Map/LiveTourMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-900 animate-pulse">
      <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Initialisation GPS...</p>
    </div>
  )
});

// --- BASE DE DONNÉES DE SIMULATION (DYNAMIQUE PAR ID) ---
const FLEET_DATABASE = {
  "TRK-01": {
    plaque: "LT-882-CI",
    chauffeur: "Patrice N.",
    scans: 28,
    totalBacs: 45,
    batterie: 85,
    vitesse: "24 km/h",
    tempsRoute: "03h 42m",
    gpsInit: [4.0550, 9.7050], // Akwa
    historique: [
      { t: "11:42", loc: "Rue Joss", status: "Succès", idBin: "AK-092" },
      { t: "11:38", loc: "Carrefour Douala Bar", status: "Succès", idBin: "AK-091" },
      { t: "11:30", loc: "Station Total Akwa", status: "Inaccessible", idBin: "AK-088" },
    ],
    clients: [
      { id: 1, nom: "Moussa T.", pos: [4.0510, 9.7015], status: "Vidé" },
      { id: 2, nom: "Supermarché K", pos: [4.0530, 9.7030], status: "Vidé" },
      { id: 3, nom: "Résidence A1", pos: [4.0560, 9.7060], status: "À faire" },
    ]
  },
  "TRK-02": {
    plaque: "LT-104-AB",
    chauffeur: "Ibrahim N.",
    scans: 12,
    totalBacs: 35,
    batterie: 42,
    vitesse: "18 km/h",
    tempsRoute: "01h 15m",
    gpsInit: [4.0600, 9.7100], // Deido
    historique: [
      { t: "09:15", loc: "Marché Deido", status: "Succès", idBin: "DE-001" },
      { t: "09:30", loc: "École Publique", status: "Succès", idBin: "DE-002" },
    ],
    clients: [
      { id: 1, nom: "Pharmacie Deido", pos: [4.0610, 9.7110], status: "Vidé" },
      { id: 2, nom: "Boulangerie B", pos: [4.0630, 9.7130], status: "À faire" },
    ]
  }
};

export default function TruckDetailPage({ params: paramsPromise }) {
  // Correction Next.js 15 : On déballe le Promise params
  const params = use(paramsPromise);
  const truckId = params.id;

  // Récupération des données selon l'ID (ou fallback si ID inexistant)
  const data = FLEET_DATABASE[truckId] || FLEET_DATABASE["TRK-01"];

  const [driverPos, setDriverPos] = useState(data.gpsInit);

  // Simulation de mouvement GPS lent
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverPos(prev => [prev[0] + 0.00005, prev[1] + 0.00005]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFullScreenMap = () => {
    Swal.fire({
      title: 'VUE ÉTENDUE',
      text: 'Le mode plein écran interactif sera lié au backend prochainement.',
      background: '#0a0a0a',
      color: '#fff',
      confirmButtonColor: '#22c55e'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4 border-b border-zinc-900 pb-8">
        <div className="flex items-center gap-6">
          <Link href="/admin/fleet" className="p-4 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              TRK-UNIT : {data.plaque}
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Terminal actif • Chauffeur : {data.chauffeur}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-6 py-3 rounded-2xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
          <span className="text-green-500 font-black text-[10px] uppercase">Live War-Room</span>
        </div>
      </div>

      {/* --- DASHBOARD GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* COLONNE GAUCHE : STATS TEMPS RÉEL */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem]">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-4">Progression Collecte</p>
            <div className="flex items-end gap-2 mb-6">
              <span className="text-6xl font-black text-white">{data.scans}</span>
              <span className="text-zinc-600 text-xl font-bold mb-2">/ {data.totalBacs}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${(data.scans / data.totalBacs) * 100}%` }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
              <Clock className="text-orange-500 mb-2" size={18} />
              <p className="text-white font-black text-lg leading-none">{data.tempsRoute}</p>
              <p className="text-[9px] text-zinc-500 uppercase mt-1">En service</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
              <Zap className="text-yellow-500 mb-2" size={18} />
              <p className="text-white font-black text-lg leading-none">{data.batterie}%</p>
              <p className="text-[9px] text-zinc-500 uppercase mt-1">Batterie Terminal</p>
            </div>
          </div>

          {/* NOUVEAU : STATS DE PERFORMANCE */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <TrendingUp className="text-green-500" size={18} />
              <p className="text-[10px] font-black uppercase tracking-widest">Performance Unité</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[11px]">Consommation</span>
                <span className="text-white font-bold text-xs uppercase">Optimale</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[11px]">Vitesse Moyenne</span>
                <span className="text-white font-bold text-xs uppercase">{data.vitesse}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTRE & DROITE : LA CARTE INTERACTIVE */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3rem] h-[550px] overflow-hidden relative shadow-2xl">
          <LiveTourMap driverPos={driverPos} clients={data.clients} />
          
          {/* Overlay Contrôles */}
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-[1000]">
            <div className="bg-black/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-800 shadow-2xl">
              <div className="flex items-center gap-3 text-green-500 mb-2">
                <Navigation size={14} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Signal GPS Excellent</span>
              </div>
              <p className="text-xs font-bold text-zinc-400">Position : <span className="text-white uppercase">{data.id === "TRK-01" ? "Akwa" : "Deido"}</span></p>
            </div>

            <button 
              onClick={handleFullScreenMap}
              className="bg-white text-black p-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform shadow-2xl"
            >
              <Maximize2 size={16} />
              <span className="font-black text-[10px] uppercase">Agrandir la Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- SECTION HISTORIQUE BAS DE PAGE --- */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[3.5rem] p-8 md:p-12 shadow-inner">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Journal des Scans en temps réel</h2>
          <div className="flex gap-2">
            <span className="bg-green-500/10 text-green-500 px-4 py-2 rounded-xl text-[9px] font-black">SYSTÈME NOMINAL</span>
          </div>
        </div>

        <div className="space-y-4">
          {data.historique.map((log, idx) => (
            <div key={idx} className="flex items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800/40 rounded-3xl hover:bg-zinc-900/60 transition-all group">
              <div className="flex items-center gap-8">
                <span className="text-zinc-600 font-mono text-[10px] font-bold">{log.t}</span>
                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle size={18} className={log.status === 'Succès' ? 'text-green-500' : 'text-red-500'} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{log.loc}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">BIN-ID : {log.idBin}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-[9px] font-black px-4 py-2 rounded-full border ${
                  log.status === 'Succès' ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'
                }`}>
                  {log.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}