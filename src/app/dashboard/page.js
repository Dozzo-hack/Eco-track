"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react"; // <-- Importation essentielle pour NextAuth
import { useRouter } from "next/navigation";

export default function ResponsiveDashboard() {
  const { data: session, status } = useSession(); // <-- Récupération de la session active
  const router = useRouter();
  const fluxRef = useRef(null);

  // Données dynamiques initialisées avec des valeurs par défaut
  const [userData, setUserData] = useState({
    nom: "Utilisateur",
    points: 0,
    impact: 0,
    poids: "0kg",
    score: 100
  });

  const adminMessages = [
    "🚀 Flash : Collecte exceptionnelle ce samedi à Akwa !",
    "🌱 Info : Vous contribuez à un Douala plus propre et écologique.",
    "🎁 Promo : Échangez vos points cumulés en cadeaux dans l'onglet Boutique.",
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [notifications] = useState([
    { id: 1, text: "🚚 Unité mobile en route vers votre secteur.", type: "info", time: "Récemment" },
    { id: 2, text: "🌟 Bienvenue sur votre espace Eco Track.", type: "success", time: "Maintenant" }
  ]);
  const [unreadCount, setUnreadCount] = useState(notifications.length);

  // Synchronisation des données de l'utilisateur connecté
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUserData({
        nom: session.user.name || "Abonné",
        points: session.user.points || 450, // Valeurs simulées en attendant tes routes de collectes réelles
        impact: 15,
        poids: "32kg",
        score: 95
      });
    }
  }, [session, status]);

  // Gestion du défilement des messages flash
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % adminMessages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [adminMessages.length]);

  const scrollToFlux = () => {
    fluxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // 1. ÉCRAN DE CHARGEMENT PENDANT QUE NEXTAUTH VÉRIFIE LA SESSION
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Chiffrement de la session...</p>
      </div>
    );
  }

  // 2. SÉCURITÉ : REDIRECTION STRICTE SI AUCUNE SESSION N'EXISTE
  if (status === "unauthenticated") {
    router.push("/auth/user");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 lg:pt-10 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER : CAROUSEL & NOTIFICATIONS */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-4 flex items-center gap-3 shadow-sm overflow-hidden">
          <span className="bg-[#6200ee] text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase shrink-0">News</span>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-gray-700 truncate italic">
              {adminMessages[currentMessageIndex]}
            </p>
          </div>
          <div className="hidden xs:flex gap-1">
            {adminMessages.map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${i === currentMessageIndex ? 'bg-[#6200ee] w-3' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <button 
          onClick={scrollToFlux}
          className="relative h-14 w-14 md:h-12 md:w-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-500 shadow-sm active:scale-90 transition-all self-end md:self-center"
        >
          <i className="fa-solid fa-bell text-xl md:text-lg"></i>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-6 w-6 md:h-5 md:w-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* BANNER : NOM DYNAMIQUE REÇU DU BACKEND */}
      <section className="bg-[#6200ee] rounded-[40px] p-8 md:p-14 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
            Bonjour, <br className="md:hidden" /> {userData.nom} 👋
          </h2>
          <div className="inline-block bg-white/15 backdrop-blur-lg px-4 py-2 rounded-2xl border border-white/20 font-bold text-sm">
            🌱 +{userData.impact}% d'impact positif
          </div>
        </div>
        <i className="fa-solid fa-recycle absolute -right-10 -bottom-10 text-white/10 text-[180px] md:text-[240px] -rotate-12"></i>
      </section>

      {/* CARTES STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Poids trié" val={userData.poids} icon="fa-weight-hanging" color="bg-purple-100 text-purple-600" />
        <StatCard label="Points cumulés" val={userData.points} icon="fa-star" color="bg-amber-100 text-amber-600" />
        <StatCard label="Score qualité" val={`${userData.score}%`} icon="fa-check-double" color="bg-green-100 text-green-600" />
      </div>

      {/* GRAPH & FLUX D'ACTIVITÉ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-50 overflow-hidden">
          <h3 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-8">Performance Mensuelle</h3>
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 border-b border-gray-100 pb-4">
            {[45, 70, 50, 85, 60, 95, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                <div 
                  className={`w-full max-w-[40px] rounded-t-2xl transition-all duration-500 ${i === 5 ? 'bg-[#6200ee]' : 'bg-[#6200ee]/10 group-hover:bg-[#6200ee]/30'}`}
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[10px] font-black text-gray-400">{['J','F','M','A','M','J','J'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div ref={fluxRef} className="lg:col-span-4 bg-white p-6 md:p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col scroll-mt-28">
          <h3 className="font-black text-gray-800 text-lg mb-6">Derniers Flux</h3>
          <div className="space-y-4">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex gap-4">
                <div className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center ${n.type === 'urgent' ? 'bg-red-100 text-red-500' : 'bg-purple-100 text-[#6200ee]'}`}>
                  <i className={`fa-solid ${n.type === 'urgent' ? 'fa-truck' : 'fa-bell'}`}></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800 leading-tight">{n.text}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setUnreadCount(0)}
            className="mt-8 w-full py-4 rounded-2xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
          >
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant StatCard réutilisable interne
function StatCard({ label, val, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[35px] border border-gray-100 flex items-center gap-5 shadow-sm hover:translate-y-[-2px] transition-all">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none">{val}</p>
        <p className="text-[11px] font-black text-gray-400 uppercase mt-1 tracking-tight">{label}</p>
      </div>
    </div>
  );
}