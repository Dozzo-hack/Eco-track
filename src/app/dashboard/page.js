"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ResponsiveDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fluxRef = useRef(null);

  const [loadingData, setLoadingData] = useState(true);
  const [userData, setUserData] = useState({
    nom: "Abonné",
    points: 0,
    impact: 0,
    poids: "0kg",
    score: 100,
    abonnementStatut: "Inactif",
    joursRestants: 0
  });

  const [graphData, setGraphData] = useState([8, 8, 8, 8, 8, 8, 10]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [notifications] = useState([
    { id: 1, text: "🚚 Unité mobile en route vers votre secteur.", type: "info", time: "Récemment" },
    { id: 2, text: "🌟 Bienvenue sur votre espace Eco Track.", type: "success", time: "Maintenant" }
  ]);
  const [unreadCount, setUnreadCount] = useState(notifications.length);

  const adminMessages = [
    "🚀 Flash : Collecte exceptionnelle ce samedi à Akwa !",
    "🌱 Info : Vous contribuez à un Douala plus propre et écologique.",
    "🎁 Promo : Échangez vos points cumulés en cadeaux dans l'onglet Boutique.",
  ];

  useEffect(() => {
    async function fetchUserProfile() {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/user/profile");
          const result = await response.json();

          if (result.success && result.data) {
            const profile = result.data;
            
            // Calcul des jours d'abonnement restants
            let jours = 0;
            let statutCalcule = profile.abonnement?.statut || "Inactif";
            
            if (profile.abonnement?.dateFin) {
              const dateFin = new Date(profile.abonnement.dateFin);
              const dateAujourdhui = new Date();
              const diffTemps = dateFin.getTime() - dateAujourdhui.getTime();
              jours = Math.ceil(diffTemps / (1000 * 60 * 60 * 24));
              
              if (jours <= 0) {
                jours = 0;
                statutCalcule = "Inactif";
              }
            }

            const poidsAffiche = profile.poidsTotalNum !== undefined && profile.poidsTotalNum !== null
              ? `${profile.poidsTotalNum}kg` 
              : (profile.poidsTotal || "0kg");
          
            setUserData({
              nom: `${profile.prenom || ""} ${profile.nom || ""}`.trim() || "Abonné",
              points: profile.points ?? 0, 
              impact: profile.impact?.co2Evite ?? 0, 
              poids: poidsAffiche,
              score: profile.scoreQualite ?? 100,
              abonnementStatut: statutCalcule,
              joursRestants: jours
            });
          
            if (profile.impact?.poidsMensuel) {
              const mensuel = profile.impact.poidsMensuel;
              const clesMoisBdd = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul'];
              const nouveauxChiffres = clesMoisBdd.map(m => mensuel[m] || 0);
              const dataMaxisee = nouveauxChiffres.map(v => v === 0 ? 8 : Math.min(v * 4, 100));
              setGraphData(dataMaxisee);
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du profil :", error);
        } finally {
          setLoadingData(false);
        }
      }
    }
    fetchUserProfile();
  }, [session, status]);

  // Gestion du défilement automatique toutes les 5 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % adminMessages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [adminMessages.length]);

  const scrollToFlux = () => {
    fluxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (status === "loading" || (status === "authenticated" && loadingData)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 px-4">
        <div className="h-10 w-10 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono text-center">Synchronisation Eco Track...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/user/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 lg:pt-10 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden">
      
      {/* HEADER : Option 2 - Retour à la ligne intelligent sans débordement */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-4 flex items-start gap-3 shadow-sm min-w-0">
          <span className="bg-[#6200ee] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase shrink-0 mt-0.5">
            News
          </span>
          <div className="flex-1 min-w-0">
            {/* Les classes whitespace-normal et break-words forcent le texte long à passer en dessous proprement */}
            <p className="text-xs sm:text-sm font-bold text-gray-700 italic whitespace-normal break-words leading-relaxed">
              {adminMessages[currentMessageIndex]}
            </p>
          </div>
        </div>

        <button 
          onClick={scrollToFlux}
          className="relative h-12 w-full sm:w-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-500 shadow-sm active:scale-95 transition-all shrink-0"
        >
          <i className="fa-solid fa-bell text-lg"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-2 sm:-right-1 h-5 w-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* BANNER */}
      <section className="bg-[#6200ee] rounded-[30px] p-6 sm:p-8 md:p-14 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-full">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter leading-tight break-words">
            Bonjour, <br className="sm:hidden" /> {userData.nom} 👋
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="inline-block bg-white/15 backdrop-blur-lg px-3 py-1.5 rounded-xl border border-white/20 font-bold text-xs">
              🌱 {userData.impact}kg de CO2 évités
            </div>
            <div className={`inline-block px-3 py-1.5 rounded-xl font-black text-xs uppercase ${userData.joursRestants > 0 ? "bg-green-500/30 text-green-200" : "bg-red-500/30 text-red-200"}`}>
              {userData.joursRestants > 0 ? "Abonnement Actif" : "Compte Inactif / Expiré"}
            </div>
          </div>
        </div>
        <i className="fa-solid fa-recycle absolute -right-10 -bottom-10 text-white/10 text-[140px] sm:text-[240px] -rotate-12 pointer-events-none"></i>
      </section>

      {/* GRILLE DES CARTES STATS (2x2 sur mobile, 4 en ligne sur PC) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Poids trié" val={userData.poids} icon="fa-weight-hanging" color="bg-purple-100 text-purple-600" />
        <StatCard label="Points" val={userData.points} icon="fa-star" color="bg-amber-100 text-amber-600" />
        <StatCard 
          label="Validité Restante" 
          val={userData.joursRestants > 0 ? `${userData.joursRestants} J` : "Expiré"} 
          icon="fa-clock" 
          color={userData.joursRestants > 0 ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"} 
        />
        <StatCard label="Score qualité" val={`${userData.score}%`} icon="fa-check-double" color="bg-green-100 text-green-600" />
      </div>

      {/* GRAPH & FLUX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 md:p-8 rounded-[30px] shadow-sm border border-gray-50 overflow-hidden">
          <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-6">Performance Mensuelle</h3>
          <div className="h-48 flex items-end justify-between gap-1.5 sm:gap-4 border-b border-gray-100 pb-4 overflow-x-auto">
            {graphData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end min-w-[28px]">
                <div 
                  className={`w-full max-w-[35px] rounded-t-lg transition-all duration-500 ${i === new Date().getMonth() ? 'bg-[#6200ee]' : 'bg-[#6200ee]/10 group-hover:bg-[#6200ee]/30'}`}
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[9px] font-black text-gray-400 text-center">
                  {['Jan','Fev','Mar','Avr','Mai','Jui','Jul'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div ref={fluxRef} className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-[30px] shadow-sm border border-gray-50 flex flex-col scroll-mt-28">
          <h3 className="font-black text-gray-800 text-lg mb-6">Derniers Flux</h3>
          <div className="space-y-4 flex-1">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex gap-3 items-start">
                <div className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center bg-purple-100 text-[#6200ee]">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 leading-tight break-words">{n.text}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setUnreadCount(0)}
            className="mt-6 w-full py-3.5 rounded-xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shrink-0"
          >
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant Carte interne
function StatCard({ label, val, icon, color }) {
  return (
    <div className="bg-white p-3 sm:p-5 rounded-[22px] border border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 shadow-sm hover:translate-y-[-2px] transition-all min-w-0">
      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center text-md sm:text-xl shrink-0 ${color}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left w-full">
        <p className="text-md sm:text-xl font-black text-gray-900 leading-none truncate">{val}</p>
        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase mt-1 truncate tracking-tight">{label}</p>
      </div>
    </div>
  );
}