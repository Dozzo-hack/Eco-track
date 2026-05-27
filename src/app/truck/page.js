"use client";
import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Gauge, Bell, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function TruckDashboard() {
  const [videurInfos, setVideurInfos] = useState(null);
  const [stats, setStats] = useState({ restants: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const notifications = [
    { id: 1, title: "Route Barrée", text: "Travaux sur l'avenue Deido, passez par le tunnel.", time: "Il y a 5 min", type: "alert" },
    { id: 2, title: "Nouveau Client", text: "Moussa Traoré (Premium) ajouté à votre liste.", time: "Il y a 1h", type: "info" }
  ];

  useEffect(() => {
    async function chargerDonneesDashboard() {
      try {
        const res = await fetch("/api/truck/map-data");
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.success) {
          setVideurInfos(json.videur);
          
          // Calcul dynamique des objectifs basé sur les vrais users en BD
          const totalBacsZone = json.clients ? json.clients.length : 0;
          const bacsVides = json.clients ? json.clients.filter(c => c.status === 'Terminé').length : 0;
          
          setStats({
            restants: bacsVides,
            total: totalBacsZone
          });
        }
      } catch (err) {
        console.error("Erreur chargement dashboard camion:", err);
      } finally {
        setLoading(false);
      }
    }

    chargerDonneesDashboard();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-2">
        <Loader2 className="text-orange-500 animate-spin" size={32} />
        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Connexion au terminal...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto animate-in fade-in duration-700 font-sans">
      
      {/* EN-TÊTE DYNAMIQUE AVEC LES INFOS DE MONGODB */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <p className="text-[10px] uppercase font-black text-orange-500 tracking-wider mb-1">Session Chauffeur</p>
          <h2 className="text-3xl font-black text-slate-800 leading-tight">
            {videurInfos?.nom || "Videur EcoTrack"}
          </h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 
            {videurInfos?.isSuperVideur ? "Opérationnel - TOUTES ZONES" : `Zone : ${videurInfos?.quartiers?.join(', ')}`}
          </p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 relative">
          <Bell size={20} className="text-slate-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </div>
      </div>

      {/* SECTION NOTIFICATIONS / MESSAGES DE L'ADMIN */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-orange-500" />
          <h3 className="font-black text-xs uppercase tracking-wider text-slate-700">Messages de l'Admin</h3>
        </div>
        <div className="space-y-3">
          {notifications.map(notif => (
            <div key={notif.id} className="bg-white p-4 rounded-[25px] border-l-4 border-orange-500 shadow-sm">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm text-slate-800">{notif.title}</h4>
                <span className="text-[10px] text-gray-400 font-medium">{notif.time}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{notif.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* STATS DE TOURNÉE DYNAMIQUES (CAPACITÉ ET OBJECTIF REEL) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900 p-5 rounded-[35px] text-white flex flex-col justify-between h-32 shadow-lg">
          <Gauge size={20} className="text-orange-500" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Capacité Camion</p>
            <p className="text-2xl font-black font-mono">
              {stats.total > 0 ? Math.min(Math.round((stats.restants / stats.total) * 100), 100) : 0}%
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[35px] border border-slate-100 flex flex-col justify-between h-32 shadow-sm">
          <TrendingUp size={20} className="text-blue-500" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bacs à Collecter</p>
            <p className="text-2xl font-black text-slate-800 font-mono">
              {stats.restants} / {stats.total}
            </p>
          </div>
        </div>
      </div>

      {/* BOUTON D'ACTION VERS LA CARTE LIVE */}
      <Link href="/truck/map" className="no-underline">
        <button className="w-full bg-orange-500 text-white p-6 rounded-[35px] shadow-xl shadow-orange-100 flex items-center justify-between active:scale-95 transition-all cursor-pointer">
          <div className="text-left">
            <p className="text-xs font-black opacity-80 uppercase tracking-wider">Ouvrir le GPS</p>
            <p className="text-xl font-black leading-none mt-1">VOIR MA TOURNÉE</p>
          </div>
          <div className="bg-white text-orange-500 p-4 rounded-3xl shadow-inner">
            <Play fill="currentColor" size={24} />
          </div>
        </button>
      </Link>
    </div>
  );
}

