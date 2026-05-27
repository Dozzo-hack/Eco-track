"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2"; // Importation de SweetAlert2

const CarteUserSse = dynamic(() => import("@/components/CarteUserSse"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center font-bold bg-gray-50">CHARGEMENT DES INFRASTRUCTURES...</div>
});

export default function CarteLiveUser() {
  const [loadingAction, setLoadingAction] = useState(false);

  // ÉTAT DU TRACKING EN TEMPS RÉEL (Id de base TRUCK-01, écrasé dynamiquement par le flux)
  const [camion, setCamion] = useState({ id: "TRUCK-01", pos: [4.0511, 9.7679], vitesseMoyenne: 30 });
  const [monStatut, setMonStatut] = useState("En attente"); 
  const [mesCoordonnees, setMesCoordonnees] = useState(null); 
  const [currentUserId, setCurrentUserId] = useState(null);

  // 1. Récupération des données initiales
  useEffect(() => {
    async function chargerDonneesInitiales() {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        
        if (session?.user) {
          const userId = session.user.id || session.user._id;
          setCurrentUserId(userId.toString());

          const userRes = await fetch(`/api/user/profile?id=${userId}`);
          if (userRes.ok) {
            const jsonResponse = await userRes.json();
            
            if (jsonResponse.success && jsonResponse.data) {
              const userData = jsonResponse.data;
              if (userData.localisationCollecte) {
                setMonStatut(userData.localisationCollecte.statutEmplacement || "En attente");
                if (userData.localisationCollecte.coordinates && Array.isArray(userData.localisationCollecte.coordinates)) {
                  const coords = userData.localisationCollecte.coordinates;
                  setMesCoordonnees([coords[1], coords[0]]); // Transpose de Lng,Lat vers Lat,Lng
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Erreur d'initialisation utilisateur:", err);
      }
    }
    chargerDonneesInitiales();
  }, []);

  // 2. Connexion SSE ultra-tolérante (écoute brute + événements personnalisés)
  useEffect(() => {
    if (!currentUserId) return;

    const eventSource = new EventSource("/api/live-tracking");

    // Fonction commune de mise à jour du camion
    const traiterMouvementCamion = (data) => {
      if (data.currentPos && Array.isArray(data.currentPos)) {
        setCamion((prev) => ({
          ...prev,
          id: data.truckId || prev.id, // Rend l'ID dynamique (TRUCK-01 ou TRUCK-ALPHA automatiquement)
          pos: [Number(data.currentPos[0]), Number(data.currentPos[1])]
        }));
      }
    };

    // Canal Standard (data: {...})
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.streamType === "truck-move" || data.truckId) {
          traiterMouvementCamion(data);
        }

        if (data.streamType === "init-trucks" && data.trucks) {
          const premierTruckKey = Object.keys(data.trucks)[0];
          if (premierTruckKey && data.trucks[premierTruckKey]) {
            setCamion({
              id: premierTruckKey,
              pos: data.trucks[premierTruckKey].pos,
              vitesseMoyenne: 30
            });
          }
        }

        if (data.streamType === "collecte-update" && data.clientId === currentUserId) {
          setMonStatut("Validé");
          if (data.location && Array.isArray(data.location)) {
            setMesCoordonnees(data.location); 
          }
        }
      } catch (err) {
        console.error("Erreur flux direct SSE (onmessage):", err);
      }
    };

    // Canal Événementiel Spécifique (Au cas où ton backend fait res.write("event: truck-move\n"))
    eventSource.addEventListener("truck-move", (event) => {
      try {
        const data = JSON.parse(event.data);
        traiterMouvementCamion(data);
      } catch (err) {
        console.error("Erreur événement nommé truck-move:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [currentUserId]);

  // AJOUT DE SWEETALERT2 ICI
  const handleRequestLocationChange = async () => {
    const result = await Swal.fire({
      title: "Changer de localisation ?",
      text: "Voulez-vous réinitialiser votre point de collecte ? Notre chauffeur mettra à jour votre position GPS exacte lors de son prochain scan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a", // Couleur verte équivalente à ton bandeau
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, réinitialiser",
      cancelButtonText: "Annuler",
      customClass: {
        popup: "rounded-[35px]", // Pour correspondre au design arrondi d'Eco Track
        confirmButton: "rounded-2xl font-bold uppercase tracking-wider text-xs px-4 py-2",
        cancelButton: "rounded-2xl font-bold uppercase tracking-wider text-xs px-4 py-2"
      }
    });

    if (!result.isConfirmed) return;
    
    setLoadingAction(true);
    try {
      const res = await fetch("/api/user/request-location-update", { method: "POST" });
      if (res.ok) {
        setMonStatut("À modifier");
        Swal.fire({
          title: "Demande reçue !",
          text: "Déposez votre bac à votre nouvel emplacement, le chauffeur s'occupe du reste !",
          icon: "success",
          confirmButtonColor: "#2563eb", // Bleu pour matcher le nouvel état
          customClass: {
            popup: "rounded-[35px]"
          }
        });
      } else {
        Swal.fire({
          title: "Échec",
          text: "Erreur lors de la demande de réinitialisation.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          customClass: {
            popup: "rounded-[35px]"
          }
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Erreur technique",
        text: "Impossible de joindre le serveur.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: "rounded-[35px]"
        }
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const calculateETA = (targetPos) => {
    if (!targetPos || !camion.pos) return 0;
    const R = 6371; 
    const dLat = (targetPos[0] - camion.pos[0]) * Math.PI / 180;
    const dLon = (targetPos[1] - camion.pos[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(camion.pos[0] * Math.PI / 180) * Math.cos(targetPos[0] * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Évite d'afficher 0 si le camion est proche mais pas sur le point exact
    if (distance < 0.1) return 1; 
    return Math.round((distance / camion.vitesseMoyenne) * 60);
  };

  return (
    <div className="pt-6 pb-24 space-y-6 max-w-6xl mx-auto px-4 font-sans">
      
      {/* BANDEAUX DE STATUT */}
      {monStatut === "En attente" && (
        <div className="bg-orange-500 text-white p-6 rounded-[35px] shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <AlertTriangle size={32} className="shrink-0" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">📍 Emplacement non activé</h2>
              <p className="text-sm opacity-90">Votre position GPS exacte s'enregistrera automatiquement en BD dès que le chauffeur scannera votre QR Code pour la première fois.</p>
            </div>
          </div>
          <span className="bg-white/25 text-white border border-white/50 font-black text-xs px-4 py-2 rounded-full uppercase tracking-widest whitespace-nowrap">Premier passage requis</span>
        </div>
      )}

      {monStatut === "À modifier" && (
        <div className="bg-blue-500 text-white p-6 rounded-[35px] shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <RefreshCw size={32} className="animate-spin shrink-0" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">🔄 Recalcul d'emplacement en attente</h2>
              <p className="text-sm opacity-90">Vous avez demandé une mise à jour d'adresse. Laissez votre QR Code dehors, le système écrasera l'ancien GPS lors du prochain scan.</p>
            </div>
          </div>
        </div>
      )}

      {monStatut === "Validé" && (
        <div className="bg-green-600 text-white p-6 rounded-[35px] shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <CheckCircle2 size={32} className="shrink-0" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">✓ Domicile géo-référencé</h2>
              <p className="text-sm opacity-90">Votre point de collecte est ancré de manière sécurisée. Vous apparaissez sur la feuille de route du camion.</p>
            </div>
          </div>
          
          <button 
            onClick={handleRequestLocationChange}
            disabled={loadingAction}
            className="bg-white text-gray-900 hover:bg-gray-100 font-black text-xs px-5 py-3 rounded-2xl uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 shadow-md"
          >
            <MapPin size={14} className="text-red-500" />
            {loadingAction ? 'Traitement...' : 'Changer ma localisation'}
          </button>
        </div>
      )}

      {/* CARTOGRAPHIE & ETA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[550px] rounded-[45px] overflow-hidden border-8 border-white shadow-2xl relative z-10">
          <CarteUserSse 
            camionPos={camion.pos} 
            mesCoordonnees={mesCoordonnees} 
            monStatut={monStatut} 
          />
        </div>

        {/* COMPTEUR ETA LIVE */}
        <div className="bg-white p-6 rounded-[45px] border border-gray-100 shadow-xl flex flex-col justify-between text-center min-h-[300px]">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifiant Camion</p>
            <h3 className="text-xl font-black text-gray-800 font-mono mt-1 uppercase">{camion.id}</h3>
          </div>

          {mesCoordonnees && monStatut === "Validé" ? (
            <div className="bg-slate-900 text-white p-6 rounded-[35px] shadow-inner">
              <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Temps d'approche</p>
              <div className="flex items-end justify-center gap-1 mt-2">
                <span className="text-5xl font-black tracking-tighter leading-none">{calculateETA(mesCoordonnees)}</span>
                <span className="text-[10px] font-black uppercase mb-1 text-left">Min<br/>estimées</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 text-gray-400 p-6 rounded-[35px] text-xs font-bold border border-dashed border-gray-200">
              Calcul de l'itinéraire indisponible tant que le premier géo-ancrage n'est pas fait.
            </div>
          )}

          <div className="text-left border-t border-gray-100 pt-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Zone Assignée</p>
            <p className="text-sm font-bold text-gray-800">Akwa (Douala)</p>
          </div>
        </div>
      </div>
    </div>
  );
}