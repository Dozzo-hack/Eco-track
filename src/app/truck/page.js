"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, TrendingUp, Gauge, Bell, MessageSquare, Loader2, RefreshCw, CheckCircle2, Inbox } from 'lucide-react';
import Link from 'next/link';

export default function TruckDashboard() {
  const [videurInfos, setVideurInfos] = useState(null);
  const [stats, setStats] = useState({ scannes: 0, total: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const messageEndRef = useRef(null);

  const chargerDonneesDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/truck/map-data");
      if (!res.ok) return;
      const json = await res.json();
      
      if (json.success) {
        setVideurInfos(json.videur);
        
        // Calcul dynamique : On compte tous les clients de la zone et ceux qui sont "Validé" ou "Terminé"
        const totalBacsZone = json.clients ? json.clients.length : 0;
        const bacsScannes = json.clients ? json.clients.filter(c => 
          c.status === 'Validé' || c.status === 'Terminé' || c.statutCollecte === 'Validé'
        ).length : 0;
        
        setStats({
          scannes: bacsScannes,
          total: totalBacsZone
        });

        // Lecture des vrais messages/assignations venant de l'API
        setNotifications(json.notifications || []);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard camion:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    chargerDonneesDashboard();
    
    // Auto-refresh toutes les 60 secondes pour capter les nouveaux messages admin
    const interval = setInterval(chargerDonneesDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  // Défilement automatique vers le bas pour voir le message le plus récent à l'arrivée de nouveaux messages
  useEffect(() => {
    if (notifications.length > 0 && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [notifications]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="text-orange-500 animate-spin" size={36} />
        <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Initialisation du terminal...</span>
      </div>
    );
  }

  // Calcul proportionnel : de 0% (aucun scan) à 100% (tous les bacs scannés)
  const pourcentageCapacite = stats.total > 0 
    ? Math.min(Math.round((stats.scannes / stats.total) * 100), 100) 
    : 0;

  // Changement de couleur si le camion est plein
  const capaciteCouleur = pourcentageCapacite === 100 ? "text-red-500" : "text-white";

  return (
    <div className="p-6 max-w-md mx-auto animate-in fade-in duration-700 font-sans pb-24 selection:bg-orange-500/10">
      
      {/* EN-TÊTE DYNAMIQUE */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase font-black text-orange-500 tracking-widest mb-1 flex items-center gap-2">
            Session Chauffeur
            {refreshing && <RefreshCw size={10} className="animate-spin text-orange-400" />}
          </p>
          <h2 className="text-3xl font-black text-slate-800 leading-tight capitalize">
            {videurInfos?.nom || "Chauffeur EcoTrack"}
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> 
            {videurInfos?.isSuperVideur ? "Opérationnel - TOUTES ZONES" : `Zone : ${videurInfos?.quartiers?.join(', ') || "Non assignée"}`}
          </p>
        </div>
        <button 
          onClick={chargerDonneesDashboard}
          disabled={refreshing}
          className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 relative active:scale-90 transition-transform cursor-pointer"
        >
          <Bell size={20} className={notifications.length > 0 ? "text-orange-500" : "text-slate-400"} />
          {notifications.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          )}
        </button>
      </div>

      {/* SECTION CENTRE DE MESSAGERIE SCROLLABLE */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-orange-500" />
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">Messages & Alertes</h3>
          </div>
          <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full shadow-sm">
            {notifications.length} DISPONIBLE(S)
          </span>
        </div>
        
        {/* Conteneur principal de discussion */}
        <div className="bg-slate-900 rounded-[30px] p-4 shadow-xl border border-slate-800 relative overflow-hidden">
          {notifications.length > 0 ? (
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              
              {notifications.map((notif, index) => {
                // Petite logique visuelle pour différencier les types de message
                const isPremiumMission = notif.title?.toLowerCase().includes('premium');
                const isUrgent = notif.title?.toLowerCase().includes('paie') || notif.title?.toLowerCase().includes('urgent');

                return (
                  <div 
                    key={notif.id || index} 
                    className={`p-3.5 rounded-[22px] transition-all duration-300 ${
                      isPremiumMission 
                        ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20' 
                        : isUrgent
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-slate-800/60 border border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <h4 className={`font-black text-xs ${isPremiumMission ? 'text-amber-400' : isUrgent ? 'text-red-400' : 'text-slate-200'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[8px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        {notif.time || "Récent"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {notif.text}
                    </p>
                  </div>
                );
              })}
              
              {/* Point de repère pour le scroll automatique */}
              <div ref={messageEndRef} />
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center text-center gap-2.5 my-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
                <Inbox size={18} className="text-slate-500" />
              </div>
              <p className="text-xs text-slate-400 font-bold">Aucune instruction de la centrale.</p>
            </div>
          )}
        </div>
      </div>

      {/* STATS DE TOURNÉE DYNAMIQUES */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* CARTE CAPACITÉ */}
        <div className="bg-slate-900 p-5 rounded-[30px] text-white flex flex-col justify-between h-36 shadow-lg relative overflow-hidden border border-slate-800">
          {/* Jauge visuelle d'arrière-plan */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-orange-500/20 transition-all duration-1000 ease-in-out"
            style={{ height: `${pourcentageCapacite}%` }}
          />
          <div className="relative z-10 flex items-center justify-between">
            <Gauge size={22} className="text-orange-500" />
            {pourcentageCapacite === 100 && <CheckCircle2 size={18} className="text-green-400" />}
          </div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacité Camion</p>
            <p className={`text-3xl font-black font-mono tracking-tighter ${capaciteCouleur}`}>
              {pourcentageCapacite}%
            </p>
          </div>
        </div>

        {/* CARTE BACS À COLLECTER */}
        <div className="bg-white p-5 rounded-[30px] border-2 border-slate-100 flex flex-col justify-between h-36 shadow-sm">
          <TrendingUp size={22} className={stats.scannes === stats.total && stats.total > 0 ? "text-green-500" : "text-blue-500"} />
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Progression</p>
            <p className="text-3xl font-black text-slate-800 font-mono tracking-tighter">
              {stats.scannes} <span className="text-lg text-slate-300 mx-1">/</span> {stats.total}
            </p>
          </div>
        </div>
      </div>

      {/* BOUTON D'ACTION PRINCIPAL */}
      <Link href="/truck/map" className="no-underline block">
        <button className="w-full bg-orange-500 text-white p-5 rounded-[35px] shadow-[0_10px_35px_rgba(249,115,22,0.25)] flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer border border-orange-400">
          <div className="text-left">
            <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Ouvrir le GPS</p>
            <p className="text-xl font-black leading-none mt-2 tracking-tight">DÉMARRER LA TOURNÉE</p>
          </div>
          <div className="bg-white text-orange-500 p-3.5 rounded-full shadow-inner flex items-center justify-center">
            <Play fill="currentColor" size={20} className="ml-0.5" />
          </div>
        </button>
      </Link>

    </div>
  );
}