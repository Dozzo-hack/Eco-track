"use client";
import React, { useState, useEffect, use } from 'react';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import Link from 'next/link';
import {
  ArrowLeft, MapPin, Zap, Clock, CheckCircle, Navigation,
  AlertCircle, Maximize2, TrendingUp, Loader2, Send,
  PowerOff, Bell, AlertTriangle, RefreshCw, Trash2, Eye
} from 'lucide-react';

// Carte chargée dynamiquement pour éviter les erreurs SSR
const LiveTourMap = dynamic(() => import('@/components/Map/LiveTourMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-900 animate-pulse">
      <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">
        Initialisation GPS...
      </p>
    </div>
  )
});

export default function TruckDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const truckId = params.id;

  // ── STATES ──
  const [videur, setVideur] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [clients, setClients] = useState([]);
  const [driverPos, setDriverPos] = useState([4.0550, 9.7050]);
  const [loading, setLoading] = useState(true);
  const [actif, setActif] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  // Compteurs pour les bacs
  const [statsBacs, setStatsBacs] = useState({ total: 0, scanne: 0 });

  // ── CHARGEMENT DE TOUTES LES DONNÉES SYNCHRONISÉES ──
  const fetchAllData = async () => {
    try {
      setLoading(true);

      // 1. Données administratives du videur
      const resVideur = await fetch(`/api/admin/get-videur?id=${truckId}`);
      const dataVideur = await resVideur.json();

      if (dataVideur.success) {
        const v = dataVideur.data;
        setVideur(v);
        setActif(v.actif !== false);
        
        // Incidents provenant de la collection (avec photos éventuelles)
        setIncidents(v.incidentsActifs || []);

        // Position GPS initiale du chauffeur
        if (v.gpsLatitude && v.gpsLongitude) {
          setDriverPos([v.gpsLatitude, v.gpsLongitude]);
        }
      }

      // 2. Historique réel des Scans (Tiré depuis l'historique global de 7 jours du chauffeur)
      const resHistory = await fetch(`/api/truck/history?id=${truckId}`);
      const dataHistory = await resHistory.json();
      if (dataHistory.success) {
        setHistorique(dataHistory.activites || []);
      }

      // 3. Récupération des missions en temps réel (Clients de sa zone/quartier)
      const resMissions = await fetch(`/api/truck/missions?id=${truckId}`);
      const dataMissions = await resMissions.json();
      
      if (dataMissions.success && dataMissions.clients) {
        // Formater les clients pour la carte Leaflet
        const mappedClients = dataMissions.clients.map(c => ({
          id: c._id,
          nom: `${c.prenom} ${c.nom}`,
          // Si le client n'a pas de coordonnées valides, position par défaut proche
          pos: c.coordinates || [4.0550 + (Math.random() - 0.5) * 0.02, 9.7050 + (Math.random() - 0.5) * 0.02],
          status: c.statutCollecte === "Validé" ? "Vidé" : "En attente"
        }));
        
        setClients(mappedClients);

        // Calcul des compteurs réels de bacs
        const totalBacs = dataMissions.clients.length;
        const bacsScannes = dataMissions.clients.filter(c => c.statutCollecte === "Validé").length;
        setStatsBacs({ total: totalBacs, scanne: bacsScannes });
      }

      // 4. Instructions/Notifications envoyées
      const resNotifs = await fetch(`/api/admin/get-notifications?id=${truckId}`);
      const dataNotifs = await resNotifs.json();
      if (dataNotifs.success) {
        setNotifications(dataNotifs.data || []);
      }

    } catch (error) {
      console.error("Erreur globale lors du rapatriement des données :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [truckId]);

  // Écoute / Simulation de mouvements GPS en temps réel
  useEffect(() => {
    if (!videur || !actif) return;
    const interval = setInterval(() => {
      // Simulation micro-mouvement fluide ou récupération via flux SSE en production
      setDriverPos(prev => [prev[0] + (Math.random() - 0.5) * 0.0001, prev[1] + (Math.random() - 0.5) * 0.0001]);
    }, 4000);
    return () => clearInterval(interval);
  }, [videur, actif]);

  // ── CONFIRMER ET RÉSOUDRE UN INCIDENT ──
  const resolveIncident = async (incidentId) => {
    try {
      const res = await fetch('/api/admin/resolve-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId }),
      });

      if (res.ok) {
        setIncidents(prev => prev.filter(i => i._id !== incidentId));
        Swal.fire({
          title: 'Incident résolu',
          text: 'L\'axe routier ou le problème de collecte a été clôturé.',
          icon: 'success',
          background: '#0a0a0a',
          color: '#fff',
          confirmButtonColor: '#22c55e'
        });
        fetchAllData(); // Recharger les données pour synchroniser
      }
    } catch (err) {
      console.error("Erreur résolution incident :", err);
    }
  };

  // ── VISUALISER LA PHOTO DE L'INCIDENT EN GRAND ──
  const viewIncidentImage = (photoUrl, details) => {
    Swal.fire({
      title: '<span style="color:#fff; font-size:14px; font-weight:bold; text-transform:uppercase;">Preuve Incident</span>',
      html: `<div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 p-1">
               <img src="${photoUrl}" alt="Incident" style="width:100%; max-height:400px; object-fit:cover; border-radius:12px;" />
               <p style="color:#a1a1aa; font-size:12px; margin-top:12px; text-align:left;">${details || 'Aucun détail additionnel.'}</p>
             </div>`,
      background: '#0a0a0a',
      confirmButtonColor: '#22c55e',
      confirmButtonText: 'FERMER',
    });
  };

  // ── ENVOYER UNE NOTIFICATION ──
  const handleSendNotification = async () => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="color:#fff; font-weight:900;">ENVOYER UNE INSTRUCTION</span>',
      background: '#0a0a0a',
      confirmButtonColor: '#22c55e',
      showCancelButton: true,
      cancelButtonColor: '#333',
      confirmButtonText: 'ENVOYER',
      cancelButtonText: 'ANNULER',
      html: `
        <div style="text-align:left; display:flex; flex-direction:column; gap:10px; font-family:sans-serif;">
          <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Type</label>
          <select id="swal-type" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; height:45px; padding:0 10px;">
            <option value="info">ℹ️ Information</option>
            <option value="alerte">⚠️ Alerte</option>
            <option value="assignation">📍 Assignation</option>
          </select>

          <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Titre</label>
          <input id="swal-titre" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;"
            placeholder="ex: Nouvelle zone assignée">

          <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Message</label>
          <textarea id="swal-contenu" class="swal2-textarea" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; resize:none;"
            placeholder="Détails de l'instruction..."></textarea>
        </div>
      `,
      preConfirm: () => {
        const titre = document.getElementById('swal-titre').value.trim();
        const contenu = document.getElementById('swal-contenu').value.trim();
        const type = document.getElementById('swal-type').value;
        if (!titre || !contenu) {
          return Swal.showValidationMessage('Veuillez remplir tous les champs.');
        }
        return { titre, contenu, type };
      }
    });

    if (formValues) {
      setEnvoi(true);
      try {
        const res = await fetch('/api/admin/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idChauffeur: truckId, ...formValues }),
        });

        const data = await res.json();

        if (res.ok) {
          const resNotifs = await fetch(`/api/admin/get-notifications?id=${truckId}`);
          const dataNotifs = await resNotifs.json();
          if (dataNotifs.success) setNotifications(dataNotifs.data);

          Swal.fire({
            title: 'Envoyé !',
            text: 'Instruction transmise au terminal du chauffeur.',
            icon: 'success',
            background: '#0a0a0a',
            color: '#fff',
            confirmButtonColor: '#22c55e'
          });
        } else {
          Swal.fire({ title: 'Erreur', text: data.message, icon: 'error', background: '#0a0a0a', color: '#fff' });
        }
      } catch (err) {
        console.error("Erreur envoi notification:", err);
      } finally {
        setEnvoi(false);
      }
    }
  };

  // ── DÉSACTIVER / ACTIVER LE VIDEUR ──
  const handleToggleVideur = async () => {
    const action = actif ? "mettre au garage" : "réactiver";
    const confirmation = await Swal.fire({
      title: `Confirmer l'action`,
      text: `Voulez-vous ${action} ce chauffeur ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: actif ? '#ef4444' : '#22c55e',
      cancelButtonColor: '#333',
      confirmButtonText: `Oui, ${action}`,
      cancelButtonText: 'Annuler',
      background: '#0a0a0a',
      color: '#fff'
    });

    if (!confirmation.isConfirmed) return;

    try {
      const res = await fetch('/api/admin/toggle-videur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idChauffeur: truckId }),
      });

      const data = await res.json();

      if (res.ok) {
        setActif(data.actif);
        Swal.fire({
          title: data.actif ? 'Videur Remis en Service' : 'Chauffeur envoyé au garage',
          text: data.message,
          icon: 'success',
          background: '#0a0a0a',
          color: '#fff',
          confirmButtonColor: '#22c55e'
        });
      }
    } catch (err) {
      console.error("Erreur toggle videur:", err);
    }
  };

  const incidentLabels = {
    road: "🚧 Route Bloquée",
    bin: "🗑️ Bac Inaccessible",
    work: "🔧 Panne Technique",
    other: "⚠️ Autre Incident"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-green-500 animate-spin" size={48} />
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
          Synchronisation avec la flotte éco-track...
        </p>
      </div>
    );
  }

  if (!videur) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-white font-bold">Chauffeur introuvable dans la base.</p>
        <Link href="/admin/fleet" className="text-green-500 underline">Retour à la flotte</Link>
      </div>
    );
  }

  const nomComplet = `${videur.prenom || ""} ${videur.nom || ""}`.trim();
  
  // Progression calquée fidèlement sur le total de bacs à charger de ses missions réelles
  const progressionPct = statsBacs.total > 0 ? Math.min((statsBacs.scanne / statsBacs.total) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4 border-b border-zinc-900 pb-8">
        <div className="flex items-center gap-6">
          <Link href="/admin/fleet" className="p-4 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              {videur.idChauffeur || truckId} — {nomComplet}
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              Rôle : {videur.role || "Videur"} • Statut Base : <span className={actif ? "text-green-500" : "text-red-500"}>{actif ? "ACTIF" : "INACTIF (AU GARAGE)"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${
            actif
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${actif ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
            <span className="font-black text-[10px] uppercase">
              {actif ? "En Service Live" : "Au Garage / Inactif"}
            </span>
          </div>

          <button
            onClick={handleToggleVideur}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all ${
              actif
                ? 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white'
                : 'bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500 hover:text-black'
            }`}
          >
            <PowerOff size={14} />
            {actif ? "Mettre au Garage" : "Placer Actif"}
          </button>

          <button
            onClick={handleSendNotification}
            disabled={envoi}
            className="flex items-center gap-2 bg-green-500 text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-green-400 transition-all disabled:opacity-50"
          >
            <Send size={14} />
            Envoyer Instruction
          </button>

          <button
            onClick={fetchAllData}
            className="p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors"
            title="Rafraîchir les données"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── DASHBOARD GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

        {/* COLONNE GAUCHE : STATS & COMPTEURS DE BACS */}
        <div className="space-y-6">

          {/* CARD CARDINAL DES BACS TOTAL / SCANNÉS */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem]">
            <p className="text-zinc-500 text-[10px] font-black uppercase mb-4">Progression Réelle des Missions</p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-6xl font-black text-white">
                {statsBacs.scanne}
              </span>
              <span className="text-zinc-600 text-xl font-bold mb-2">
                / {statsBacs.total} Bacs
              </span>
            </div>
            
            {/* Barre de progression dynamique fonctionnelle */}
            <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-1000"
                style={{ width: `${progressionPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-zinc-400 text-[10px] font-bold">
                {progressionPct.toFixed(0)}% du secteur achevé
              </p>
              <span className="text-green-500 font-mono text-[10px] font-bold">
                +{statsBacs.scanne * 25} PTX Récoltés
              </span>
            </div>
          </div>

          {/* Temps & Batterie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
              <Clock className="text-orange-500 mb-2" size={18} />
              <p className="text-white font-black text-lg leading-none">
                {videur.statutActivite === "Actif" ? "07h 45m" : "00h 00m"}
              </p>
              <p className="text-[9px] text-zinc-500 uppercase mt-1">Temps de Route</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem]">
              <Zap className="text-yellow-500 mb-2" size={18} />
              <p className="text-white font-black text-lg leading-none">
                87%
              </p>
              <p className="text-[9px] text-zinc-500 uppercase mt-1">Batterie Appli</p>
            </div>
          </div>

          {/* Profil & Assignation Secteurs */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
              <TrendingUp className="text-green-500" size={18} />
              <p className="text-[10px] font-black uppercase tracking-widest">Fiche Technique Chauffeur</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[11px]">ID Unique</span>
                <span className="text-white font-mono font-bold text-xs">
                  {videur.idChauffeur || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[11px]">Secteur Actif</span>
                <span className="text-green-500 font-bold text-xs uppercase">
                  {videur.quartiers && videur.quartiers.length > 0 ? "Assigné (Multi-Zones)" : "Général"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[11px]">Dernière Activité</span>
                <span className="text-white font-bold text-xs">
                  {videur.updatedAt ? new Date(videur.updatedAt).toLocaleDateString('fr-FR') : "Aujourd'hui"}
                </span>
              </div>
            </div>
          </div>

          {/* CARD D'INCIDENTS COMPLÈTE AVEC GESTION DES IMAGES */}
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} />
                <p className="text-white text-[11px] font-black uppercase tracking-wider">
                  Incidents Signalés ({incidents.length})
                </p>
              </div>
            </div>

            {incidents.length === 0 ? (
              <p className="text-zinc-600 text-xs italic text-center py-4">Aucune entrave ou incident à signaler.</p>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div key={inc._id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-white text-xs font-bold block">
                          {incidentLabels[inc.type] || inc.type}
                        </span>
                        <span className="text-zinc-600 text-[9px]">Status: {inc.statut}</span>
                      </div>
                      
                      {/* Affichage du bouton de visualisation d'image s'il y a une pièce jointe photo */}
                      {inc.photo && (
                        <button
                          onClick={() => viewIncidentImage(inc.photo, inc.details)}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 text-green-500 rounded-xl transition-colors flex items-center gap-1 text-[9px] font-bold"
                          title="Voir la photo témoin"
                        >
                          <Eye size={12} /> PHOTO
                        </button>
                      )}
                    </div>

                    {inc.details && (
                      <p className="text-zinc-400 text-[11px] leading-snug bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/30">
                        {inc.details}
                      </p>
                    )}

                    <button
                      onClick={() => resolveIncident(inc._id)}
                      className="w-full bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black py-2 rounded-xl hover:bg-green-500 hover:text-black transition-all"
                    >
                      Clôturer & Archiver l'incident
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : CARTE DE TOURNÉE ET LOCALISATION DES USERS */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[3rem] h-[680px] overflow-hidden relative shadow-2xl">
          {/* Les clients proviennent de la route mission et s'affichent dynamiquement sur la Map */}
          <LiveTourMap driverPos={driverPos} clients={clients} />

          <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row justify-between items-start md:items-end z-[1000] gap-4">
            <div className="bg-black/95 backdrop-blur-xl p-5 rounded-3xl border border-zinc-800 shadow-2xl max-w-sm">
              <div className="flex items-center gap-3 text-green-500 mb-2">
                <Navigation size={14} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Réseau Camion Gps</span>
              </div>
              <p className="text-xs font-bold text-zinc-300">
                Chauffeur connecté : <span className="text-white uppercase">{nomComplet}</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">
                Affiche <span className="text-white font-bold">{clients.length} abonnés</span> actifs pour cette tournée aujourd'hui.
              </p>
            </div>

            <div className="bg-black/95 backdrop-blur-xl p-4 rounded-3xl border border-zinc-800">
              <div className="flex gap-4 text-[9px] font-black uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-zinc-400">Bac Validé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-zinc-400">En Attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-white">Position Chauffeur</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION BAS : HISTORIQUE DES SCANS RÉELS + INSTRUCTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* HISTORIQUE SYNCHRONISÉ DE L'APPLI CHAUFFEUR SUR 7 JOURS */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black italic uppercase tracking-tighter">
              Flux d'historique en temps réel (7j)
            </h2>
            <span className="bg-green-500/10 text-green-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase">
              {historique.length} Activités Enregistrées
            </span>
          </div>

          {historique.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-600 italic text-sm">Aucun scan ou événement synchronisé cette semaine.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {historique.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-5 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:bg-zinc-900/80 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      log.type === "incident" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                    }`}>
                      {log.type === "incident" ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{log.titre || "Collecte d'un Bac"}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        Secteur : {log.quartier} • <span className="text-zinc-600 font-mono">{log.heure}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-white font-mono font-black text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                    {log.valeur}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INSTRUCTIONS ET RAPPELS SÉCURISÉS */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black italic uppercase tracking-tighter">
              Console d'Instructions Chauffeur
            </h2>
            <button
              onClick={handleSendNotification}
              className="bg-green-500 text-black px-5 py-2 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-green-400 transition-all"
            >
              <Send size={12} /> Nouvelle Directive
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="text-zinc-700 mx-auto mb-3" size={32} />
              <p className="text-zinc-600 italic text-sm">Aucune instruction envoyée pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-zinc-900/30 border border-zinc-800/40 rounded-2xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full ${
                        notif.type === 'alerte'
                          ? 'bg-red-500/10 text-red-500'
                          : notif.type === 'assignation'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {notif.type?.toUpperCase() || "INFO"}
                      </span>
                      <p className="text-white text-xs font-black">{notif.titre}</p>
                    </div>
                    <span className="text-zinc-600 text-[9px] font-mono">
                      {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{notif.contenu}</p>
                  <div className="flex items-center gap-2 mt-3 border-t border-zinc-900 pt-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${notif.lue ? 'bg-zinc-600' : 'bg-green-500 animate-pulse'}`} />
                    <span className="text-[9px] text-zinc-500 font-bold">
                      {notif.lue ? "Validée/Lue par le terminal" : "En attente de lecture"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}