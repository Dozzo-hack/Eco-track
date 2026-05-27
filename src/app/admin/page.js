"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users, Truck, Calendar, DollarSign, Activity,
  Bell, MessageSquare, AlertTriangle, UserPlus, X, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const [showNotifs, setShowNotifs] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // On attend que le status soit définitif avant d'agir
    if (status === "loading") return;

    // Pas connecté → retour au login
    if (status === "unauthenticated") {
      router.replace("/auth/admin");
      return;
    }

    // Connecté mais pas admin → retour au login
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.replace("/auth/admin");
    }
  }, [status, session]);

  // Pendant la vérification de session → écran de chargement
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-green-400 text-xl font-bold animate-pulse">Chargement...</p>
      </div>
    );
  }

  // Pas de session → rien à afficher
  if (!session) return null;

  const stats = [
    { label: "Clients Actifs", value: "1,240", icon: Users, color: "text-green-500", link: "/admin/users" },
    { label: "Camions en Route", value: "8/10", icon: Truck, color: "text-blue-500", link: "/admin/fleet" },
    { label: "Collectes ce jour", value: "342", icon: Activity, color: "text-orange-500", link: "/admin/planning" },
    { label: "Revenu Mensuel", value: "2.4M FCFA", icon: DollarSign, color: "text-green-400", link: "/admin/finance" },
  ];

  const notifications = [
    {
      id: 1,
      type: "support",
      title: "Problème Paiement",
      desc: "L'utilisateur USR-94 ne parvient pas à valider son pack.",
      icon: <MessageSquare size={16} className="text-blue-400" />,
      link: "/admin/users/USR-94",
      time: "5 min"
    },
    {
      id: 2,
      type: "fleet",
      title: "Alerte Crevaison",
      desc: "Camion #04 immobilisé à Deido. Signalé par Patrice N.",
      icon: <AlertTriangle size={16} className="text-red-500" />,
      link: "/admin/fleet",
      time: "12 min"
    },
    {
      id: 3,
      type: "users",
      title: "5 Nouveaux Clients",
      desc: "Inscriptions récentes dans la zone de Bonapriso.",
      icon: <UserPlus size={16} className="text-green-500" />,
      link: "/admin/users",
      time: "1h"
    }
  ];

  return (
    <div className="p-8 bg-black min-h-screen text-white animate-in fade-in duration-700 relative">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter">CENTRE DE CONTRÔLE</h2>
          <p className="text-green-500 text-xs font-mono uppercase tracking-[0.2em]">
            Système EcoTrack v2.0 — Connecté en tant que {session.user.nom}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className={`p-4 rounded-2xl border transition-all ${showNotifs ? 'bg-green-500 border-green-500 text-black' : 'bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800'}`}
            >
              <Bell size={22} className={showNotifs ? "" : "animate-pulse"} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-black"></span>
            </button>

            {showNotifs && (
              <div className="absolute top-20 right-0 w-80 bg-zinc-950 border border-zinc-800 rounded-[35px] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-5">
                <div className="p-6 border-b border-zinc-900 flex justify-between items-center">
                  <h4 className="font-black italic uppercase text-xs">Centre d'alertes</h4>
                  <button onClick={() => setShowNotifs(false)}>
                    <X size={16} className="text-zinc-500" />
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setShowNotifs(false)}
                      className="flex gap-4 p-5 hover:bg-zinc-900 border-b border-zinc-900/50 transition-colors group"
                    >
                      <div className="mt-1">{n.icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[11px] font-black uppercase text-white tracking-tight">{n.title}</p>
                          <span className="text-[8px] font-bold text-zinc-600">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{n.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-zinc-800 group-hover:text-green-500 self-center" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 hidden md:block">
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Status Système</p>
            <p className="text-sm font-bold text-green-400 italic">OPTIMAL</p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {stats.map((s, i) => (
          <Link
            href={s.link}
            key={i}
            className="bg-zinc-900 border border-zinc-800 p-8 rounded-[35px] hover:border-green-500/50 transition-all group"
          >
            <s.icon className={`${s.color} mb-4 group-hover:scale-110 transition-transform`} size={32} />
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black italic mt-1">{s.value}</h3>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-[45px] p-10">
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 italic uppercase tracking-tighter">
            <Calendar className="text-green-500" /> Programmation Récente
          </h3>
          <div className="space-y-4">
            {["Akwa - Zone A", "Deido - Secteur 4", "Bonapriso"].map((zone, i) => (
              <div key={i} className="flex justify-between items-center p-6 bg-black rounded-3xl border border-zinc-800 hover:border-zinc-700 transition-all group">
                <div className="flex flex-col">
                  <span className="font-black uppercase text-sm tracking-tight">{zone}</span>
                  <span className="text-[10px] text-zinc-600 italic font-bold mt-1">Secteur opérationnel • 12/05/2026</span>
                </div>
                <Link
                  href="/admin/schedule"
                  className="bg-zinc-900 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20 px-6 py-3 rounded-2xl hover:bg-green-500 hover:text-black transition-all"
                >
                  Gérer l'itinéraire
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[45px] p-10 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-xl font-black mb-8 italic uppercase tracking-tighter">Incidents Live</h3>
            <div className="space-y-4">
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle size={40} className="text-red-500" />
                </div>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1 italic underline">Alerte Critique</p>
                <p className="text-white text-sm font-black italic uppercase tracking-tight">CAMION #04 - PANNE</p>
                <p className="text-zinc-500 text-[9px] font-bold mt-2">Moteur en surchauffe • Patrice N.</p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/reports"
            className="w-full bg-green-500 text-black font-black py-5 rounded-2xl mt-10 uppercase text-[10px] tracking-[0.2em] text-center hover:scale-[1.02] transition-transform"
          >
            Générer Rapport Complet
          </Link>
        </div>
      </div>
    </div>
  );
}