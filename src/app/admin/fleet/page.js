"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { 
  Truck, 
  UserPlus, 
  AlertTriangle, 
  Wrench, 
  ChevronRight, 
  MapPin, 
  ShieldCheck,
  Search,
  Loader2
} from 'lucide-react';

export default function AdminFleetPage() {
  const [fleet, setFleet] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // --- 1. CHARGEMENT DES DONNÉES DEPUIS MONGO DB ---
  const fetchFleet = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/get-videurs');
      const result = await response.json();

      if (response.ok && result.success) {
        // On adapte les données reçues de MongoDB pour ton super design
        const formattedData = result.data.map((videur) => ({
          id: videur.idChauffeur || videur._id,
          plaque: "AFFECTATION...", // Tu pourras lier cela à ton modèle Collecte/Camion plus tard
          chauffeur: `${videur.prenom} ${videur.nom.substring(0, 1)}.`,
          zone: videur.zone || "Non définie",
          capacite: 0, // Géré dynamiquement plus tard avec tes collectes
          statut: "DISPONIBLE",
          incident: null
        }));
        setFleet(formattedData);
      } else {
        console.error("Erreur lors de la récupération :", result.message);
      }
    } catch (error) {
      console.error("Erreur serveur récupération flotte:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // --- 2. FONCTION ENRÔLEMENT VIA BACKEND API ---
  const handleAddTruck = async () => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="color:#fff; font-family:sans-serif; font-weight:900; letter-spacing:-1px;">ENRÔLER UNITÉ MOBILE</span>',
      background: '#0a0a0a',
      confirmButtonColor: '#22c55e',
      showCancelButton: true,
      cancelButtonColor: '#333',
      confirmButtonText: 'ENREGISTRER',
      cancelButtonText: 'ANNULER',
      html: `
        <div style="text-align:left; display:flex; flex-direction:column; gap:10px; font-family:sans-serif;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <div>
              <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Nom</label>
              <input id="swal-nom" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:4px 0 0 0; width:100%;" placeholder="ex: Ndedi">
            </div>
            <div>
              <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Prénom</label>
              <input id="swal-prenom" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:4px 0 0 0; width:100%;" placeholder="ex: Patrice">
            </div>
          </div>

          <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">ID Chauffeur Unique</label>
          <input id="swal-idChauffeur" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;" placeholder="ex: VID-004">
          
          <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Zone d'Affectation</label>
          <input id="swal-zone" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;" placeholder="ex: Akwa, Bonapriso...">

          <label style="color:#666; font-size:10px; font-weight:bold; text-transform:uppercase;">Code PIN Terminal (Chiffres)</label>
          <input id="swal-codePin" type="password" maxlength="6" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;" placeholder="PIN secret (ex: 1234)">
        </div>
      `,
      preConfirm: () => {
        const nom = document.getElementById('swal-nom').value.trim();
        const prenom = document.getElementById('swal-prenom').value.trim();
        const idChauffeur = document.getElementById('swal-idChauffeur').value.trim();
        const zone = document.getElementById('swal-zone').value.trim();
        const codePin = document.getElementById('swal-codePin').value.trim();

        if (!nom || !prenom || !idChauffeur || !zone || !codePin) {
          return Swal.showValidationMessage('Veuillez remplir tous les champs.');
        }
        return { nom, prenom, idChauffeur, zone, codePin };
      }
    });

    if (formValues) {
      try {
        const response = await fetch('/api/admin/create-videur', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues),
        });

        const data = await response.json();

        if (!response.ok) {
          Swal.fire({ icon: 'error', title: 'Erreur', text: data.message, background: '#0a0a0a', color: '#fff' });
          return;
        }

        // Recharger proprement les données depuis MongoDB pour rafraîchir la liste sans doublons
        fetchFleet();
        
        Swal.fire({ 
          icon: 'success', 
          title: 'Unité Enrôlée !', 
          text: 'Le compte chauffeur a été créé en base de données.',
          background: '#0a0a0a', 
          color: '#fff' 
        });

      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Erreur Serveur', text: 'Impossible de joindre le backend.', background: '#0a0a0a', color: '#fff' });
      }
    }
  };

  // --- 3. FONCTION : RÉSOUDRE INCIDENT ---
  const resolveIncident = (id, e) => {
    e.preventDefault(); 
    setFleet(fleet.map(t => t.id === id ? { ...t, incident: null } : t));
    Swal.fire({ title: 'Alerte levée', icon: 'success', background: '#0a0a0a', color: '#fff' });
  };

  return (
    <div className="animate-in fade-in duration-700 min-h-screen bg-black p-4 md:p-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">Gestion Flotte</h2>
          <p className="text-zinc-500 font-medium">Surveillance des unités mobiles et des équipes de terrain en temps réel.</p>
        </div>
        <button 
          onClick={handleAddTruck}
          className="bg-green-500 text-black px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-3 hover:bg-green-400 transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)]"
        >
          <UserPlus size={20} /> ENRÔLER UN CAMION
        </button>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Unités Totales", val: fleet.length, color: "text-white" },
          { label: "En Service", val: fleet.filter(t => t.statut === "EN ROUTE").length, color: "text-green-500" },
          { label: "Au Garage", val: fleet.filter(t => t.statut === "MAINTENANCE").length, color: "text-orange-500" },
          { label: "Alertes", val: fleet.filter(t => t.incident).length, color: "text-red-500" },
        ].map((s, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] hover:border-zinc-700 transition-colors">
            <p className="text-[10px] uppercase font-black text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.val < 10 ? `0${s.val}` : s.val}</p>
          </div>
        ))}
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
        <input 
          type="text"
          placeholder="Rechercher par ID ou par chauffeur..."
          className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTE DES CAMIONS / CHAUFFEURS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="text-green-500 animate-spin" size={40} />
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Connexion à MongoDB sécurisée...</p>
        </div>
      ) : fleet.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-[2.5rem] p-20 text-center">
          <p className="text-zinc-600 font-medium italic">Aucune unité mobile enregistrée en base de données pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fleet
            .filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()) || t.chauffeur.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((truck) => (
            <div key={truck.id} className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group">
              
              {/* Unité & Code */}
              <div className="flex items-center gap-6 min-w-[220px]">
                <div className={`p-4 rounded-2xl ${truck.statut === 'MAINTENANCE' ? 'bg-zinc-800 text-zinc-600' : 'bg-green-500/10 text-green-500'}`}>
                  <Truck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic">{truck.id}</h3>
                  <p className="text-[10px] text-green-500 font-mono font-bold uppercase tracking-wider">{truck.plaque}</p>
                </div>
              </div>

              {/* Chauffeur & Zone */}
              <div className="flex gap-10 items-center min-w-[200px]">
                <div>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mb-1 tracking-widest">Chauffeur</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${truck.chauffeur.includes('Aucun') ? 'bg-zinc-700' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
                    <span className="text-sm font-bold text-zinc-300">{truck.chauffeur}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase mb-1 tracking-widest">Zone</p>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold">
                    <MapPin size={14} className="text-zinc-600" />
                    <span className="text-sm">{truck.zone}</span>
                  </div>
                </div>
              </div>

              {/* Capacité */}
              <div className="w-full md:w-48 my-4 md:my-0">
                <div className="flex justify-between mb-2 items-center">
                  <p className="text-[10px] text-zinc-600 font-bold uppercase">Remplissage</p>
                  <p className={`text-[10px] font-black ${truck.capacite > 80 ? 'text-red-500' : 'text-white'}`}>{truck.capacite}%</p>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${truck.capacite > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${truck.capacite}%` }}
                  />
                </div>
              </div>

              {/* Statut & Action Détails */}
              <div className="flex items-center gap-4">
                {truck.incident && (
                  <div 
                    onClick={(e) => resolveIncident(truck.id, e)}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black cursor-pointer animate-pulse"
                    title="Cliquer pour résoudre"
                  >
                    <AlertTriangle size={14} /> {truck.incident.toUpperCase()}
                  </div>
                )}
                
                <Link href={`/admin/fleet/${truck.id}`} className="flex items-center gap-3">
                   <span className={`hidden md:block text-[10px] font-black px-4 py-2 rounded-full border ${
                      truck.statut === 'EN ROUTE' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 'border-zinc-800 text-zinc-600'
                   }`}>
                     {truck.statut}
                   </span>
                   <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400 group-hover:text-black group-hover:bg-green-500 transition-all">
                      <ChevronRight size={20} />
                   </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER : MAINTENANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[40px] hover:border-orange-500/20 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <Wrench className="text-orange-500" size={20} />
            <h3 className="text-white font-black uppercase italic">Maintenances</h3>
          </div>
          <div className="bg-zinc-900/50 p-5 rounded-2xl border-l-4 border-orange-500">
             <p className="text-white text-xs font-bold italic uppercase">Révision des terminaux</p>
             <p className="text-zinc-600 text-[10px] mt-1">Système de synchronisation automatique nominal.</p>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[40px] hover:border-red-500/20 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-green-500" size={20} />
            <h3 className="text-white font-black uppercase italic">Alertes Critiques</h3>
          </div>
          <p className="text-zinc-600 text-xs italic">Aucune alerte majeure. Flux de données stable.</p>
        </div>
      </div>
    </div>
  );
}