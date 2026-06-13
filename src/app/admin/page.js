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
  const [loading, setLoading] = useState(true);
  // État pour stocker les données de l'API
  const [statsData, setStatsData] = useState({
    clientsActifs: 0,
    camionsEnRoute: "0/10",
    collectes: 0,
    revenuMensuel: "0 FCFA"
  });

  const { data: session, status } = useSession();
  const router = useRouter();

  // 1. Gestion de la session et chargement des données
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth/admin");
      return;
    }

    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.replace("/auth/admin");
      return;
    }

    // Appel API pour récupérer les statistiques
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        if (data.success) {
          setStatsData(data.stats);
        }
      } catch (error) {
        console.error("Erreur de récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [status, session, router]);

  // Écran de chargement
  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <p className="text-green-400 text-xl font-bold animate-pulse">Connexion au centre de contrôle...</p>
      </div>
    );
  }

  // Configuration dynamique des statistiques
  const stats = [
    { label: "Clients Actifs", value: statsData.clientsActifs, icon: Users, color: "text-green-500", link: "/admin/users" },
    { label: "Camions en Route", value: statsData.camionsEnRoute, icon: Truck, color: "text-blue-500", link: "/admin/fleet" },
    { label: "Collectes ce jour", value: statsData.collectes, icon: Activity, color: "text-orange-500", link: "/admin/planning" },
    { label: "Revenu Mensuel", value: statsData.revenuMensuel, icon: DollarSign, color: "text-green-400", link: "/admin/finance" },
  ];

  const notifications = [
    { id: 1, type: "support", title: "Problème Paiement", desc: "L'utilisateur USR-94 ne parvient pas à valider son pack.", icon: <MessageSquare size={16} className="text-blue-400" />, link: "/admin/users/USR-94", time: "5 min" },
    { id: 2, type: "fleet", title: "Alerte Crevaison", desc: "Camion #04 immobilisé à Deido.", icon: <AlertTriangle size={16} className="text-red-500" />, link: "/admin/fleet", time: "12 min" },
  ];

  return (
    <div className="p-8 bg-black min-h-screen text-white animate-in fade-in duration-700 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter">CENTRE DE CONTRÔLE</h2>
          <p className="text-green-500 text-xs font-mono uppercase tracking-[0.2em]">
            Système EcoTrack v2.0 — Connecté en tant que {session?.user?.nom || "Admin"}
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
          <Link href={s.link} key={i} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[35px] hover:border-green-500/50 transition-all group">
            <s.icon className={`${s.color} mb-4 group-hover:scale-110 transition-transform`} size={32} />
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black italic mt-1">{s.value}</h3>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS & INCIDENTS */}
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
                  <span className="text-[10px] text-zinc-600 italic font-bold mt-1">Secteur opérationnel • Aujourd'hui</span>
                </div>
                <Link href="/admin/schedule" className="bg-zinc-900 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20 px-6 py-3 rounded-2xl hover:bg-green-500 hover:text-black transition-all">
                  Gérer
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[45px] p-10 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-xl font-black mb-8 italic uppercase tracking-tighter">Incidents Live</h3>
            <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem]">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1 italic underline">Alerte Critique</p>
              <p className="text-white text-sm font-black italic uppercase tracking-tight">CAMION #04 - PANNE</p>
              <p className="text-zinc-500 text-[9px] font-bold mt-2">Moteur en surchauffe</p>
            </div>
          </div>
          <Link href="/admin/reports" className="w-full bg-green-500 text-black font-black py-5 rounded-2xl mt-10 uppercase text-[10px] tracking-[0.2em] text-center hover:scale-[1.02] transition-transform">
            Générer Rapport Complet
          </Link>
        </div>
      </div>
    </div>
  );
}