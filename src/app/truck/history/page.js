"use client";
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Star, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/truck/history');
        const data = await res.json();
        if (data.success) {
          setActivities(data.activites);
        }
      } catch (err) {
        console.error("Impossible de charger l'historique", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
        <p className="text-sm font-medium text-gray-500">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 animate-in fade-in duration-500">
      {/* 🗓️ Titre mis à jour pour correspondre aux 7 jours de l'API */}
      <h2 className="text-2xl font-black mb-6">Fil d'Activité de la Semaine</h2>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8 italic bg-white rounded-[30px] shadow-sm border border-gray-100">
            Aucune activité enregistrée ces 7 derniers jours.
          </p>
        ) : (
          activities.map((item) => {
            const isIncident = item.type === "incident";

            return (
              <div 
                key={item.id} 
                className={`bg-white p-5 rounded-[30px] shadow-sm border-l-8 flex justify-between items-center transition-all ${
                  isIncident ? 'border-orange-500' : 'border-green-500'
                }`}
              >
                {/* BLOC INFOS (GAUCHE) */}
                <div className="max-w-[70%]">
                  <h4 className="font-bold text-lg text-slate-800 truncate">{item.titre}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mt-1">
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock size={12}/> {item.heure}
                    </span>
                    <span className={`flex items-center gap-1 font-bold truncate max-w-[150px] ${
                      isIncident ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {isIncident ? (
                        <>
                          <AlertTriangle size={12}/> {item.quartier}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12}/> {item.quartier}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* BLOC BADGE STATE / POINTS (DROITE) 🟢/🟠 */}
                <div className={`${
                  isIncident ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                } px-3 py-2 rounded-2xl text-center min-w-[75px]`}>
                  <p className="text-[10px] font-black uppercase tracking-wider">
                    {item.valeur}
                  </p>
                  {!isIncident && (
                    <Star size={14} className="text-green-500 mx-auto mt-0.5" fill="currentColor" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}