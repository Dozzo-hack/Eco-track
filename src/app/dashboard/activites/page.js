"use client";
import { useState } from "react";

export default function ActivitesPage() {
  // Données de test (Backend Ready)
  const activites = [
    { id: 1, type: "Vidange", date: "12 Mai 2026", poids: "15kg", points: "+150", status: "Terminé", icon: "fa-truck" },
    { id: 2, type: "Bonus Parrainage", date: "10 Mai 2026", poids: "-", points: "+500", status: "Validé", icon: "fa-users" },
    { id: 3, type: "Vidange", date: "05 Mai 2026", poids: "8kg", points: "+80", status: "Terminé", icon: "fa-truck" },
  ];

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mon Historique</h1>
        <p className="text-gray-500 font-bold">Suivez chaque geste pour la planète.</p>
      </div>

      <div className="space-y-4">
        {activites.map((act) => (
          <div key={act.id} className="bg-white p-6 rounded-[35px] border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-gray-50 rounded-[22px] flex items-center justify-center text-[#6200ee] text-2xl shadow-inner">
                <i className={`fa-solid ${act.icon}`}></i>
              </div>
              <div>
                <h3 className="font-black text-gray-800 uppercase text-sm tracking-tight">{act.type}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{act.date}</p>
                <span className="inline-block mt-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-600 uppercase">
                  {act.status}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-black text-[#6200ee] tracking-tighter">{act.points}</p>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">Points gagnés</p>
              {act.poids !== "-" && (
                <div className="mt-1 flex items-center justify-end gap-1 text-green-500 font-bold text-xs">
                  <i className="fa-solid fa-weight-hanging text-[10px]"></i> {act.poids}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}