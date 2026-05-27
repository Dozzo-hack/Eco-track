"use client";
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function UserCalendarPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReminders, setActiveReminders] = useState({});

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/schedule");
      const result = await response.json();
      if (response.ok && result.success) {
        setSchedules(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du calendrier:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
    const savedReminders = localStorage.getItem("eco_track_reminders");
    if (savedReminders) {
      setActiveReminders(JSON.parse(savedReminders));
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkRemindersInterval = setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const maintenant = new Date();

      schedules.forEach((schedule) => {
        if (activeReminders[schedule._id]) {
          const heureCollecte = new Date(schedule.datePrevue);
          const differenceMs = heureCollecte.getTime() - maintenant.getTime();
          const differenceMinutes = Math.ceil(differenceMs / (1000 * 60));

          if (differenceMinutes >= 10 && differenceMinutes <= 15) {
            new Notification("🚚 Passage EcoTrack imminent !", {
              body: `Le camion passera à ${schedule.quartiers} pour la collecte [${schedule.typeDechet}] d'ici 10 à 15 min.`,
              icon: "/favicon.ico"
            });
            toggleReminder(schedule._id, schedule.quartiers, true);
          }
        }
      });
    }, 60000);
    return () => clearInterval(checkRemindersInterval);
  }, [schedules, activeReminders]);

  const toggleReminder = (id, quartier, autoDisable = false) => {
    if (!("Notification" in window)) return;
    const updatedReminders = { ...activeReminders, [id]: !activeReminders[id] };
    if (autoDisable) updatedReminders[id] = false;

    setActiveReminders(updatedReminders);
    localStorage.setItem("eco_track_reminders", JSON.stringify(updatedReminders));

    if (!autoDisable && updatedReminders[id]) {
      Swal.fire({
        icon: 'success',
        title: 'Rappel programmé !',
        text: `Alerte active 10 à 15 minutes avant le passage à ${quartier}.`,
        background: '#121212',
        color: '#fff',
        confirmButtonColor: '#a855f7'
      });
    }
  };

  // 🔥 1. CORRECTION : AJOUT DU MOIS ET DU JOUR DE LA SEMAINE DÉTAILLÉ
  const getCardDateDetails = (dateStr) => {
    const dateObj = new Date(dateStr);
    
    // Obtenir le nom du mois en français (ex: "MAI", "JUIN")
    const nomMois = dateObj.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace('.', '');
    
    // Obtenir le jour de la semaine pour l'ajouter discrètement à côté de l'estimation de l'heure
    const jourSemaine = dateObj.toLocaleDateString("fr-FR", { weekday: "long" });

    return {
      nomMois, // Remplacera l'ancien "MARC", "LUND" par "MAI", "JUIN"
      numJour: dateObj.getDate(),
      jourSemaine: jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1) // "Mardi", "Vendredi"...
    };
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">Calendrier des Passages</h1>
        <p className="text-zinc-500 text-sm mt-1">Planning officiel organisé par l'administration EcoTrack.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
        <span className="text-amber-600 font-bold mt-0.5">⚠️</span>
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          <span className="font-bold">Note :</span> Seuls les administrateurs peuvent modifier ces dates. Si votre quartier n'est pas listé, veuillez contacter le support.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="text-purple-600 animate-spin" size={32} />
          <p className="text-zinc-400 text-xs font-mono tracking-wider uppercase">Synchronisation...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="border border-dashed border-zinc-300 rounded-[2rem] p-16 text-center text-zinc-400 italic text-sm bg-white">
          Aucun passage programmé.
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-w-4xl">
          {schedules.map((schedule, index) => {
            const dateDetails = getCardDateDetails(schedule.datePrevue);
            const isReminderOn = !!activeReminders[schedule._id];

            return (
              <div 
                key={schedule._id}
                className={`relative bg-white border rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:shadow-md ${
                  index === 0 ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-zinc-100'
                }`}
              >
                {index === 0 && (
                  <span className="absolute -top-3 right-8 bg-purple-600 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase shadow-sm">
                    Prochain Passage
                  </span>
                )}

                <div className="flex items-center gap-5 w-full sm:w-auto">
                  
                  {/* 🔥 2. CORRECTION DU BADGE : Affiche désormais le MOIS en haut */}
                  <div className="bg-purple-600 text-white w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-black select-none shrink-0 shadow-sm">
                    <span className="text-[10px] tracking-widest opacity-90">{dateDetails.nomMois}</span>
                    <span className="text-2xl mt-0.5">{dateDetails.numJour}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">{schedule.quartiers}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* 🔥 3. RAJOUT DU JOUR DE LA SEMAINE EN CLAIR (ex: "Jeudi • Est. Matinée") */}
                      <div className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                        📅 {dateDetails.jourSemaine} • ⏱️ Est. Matinée
                      </div>
                      
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        ♻️ {schedule.typeDechet}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleReminder(schedule._id, schedule.quartiers)}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isReminderOn 
                      ? 'bg-black text-white hover:bg-zinc-900' 
                      : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700'
                  }`}
                >
                  {isReminderOn ? (
                    <>Rappel Activé</>
                  ) : (
                    <>Activer le Rappel</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}