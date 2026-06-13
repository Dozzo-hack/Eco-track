"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ActivitesPage() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gestion des styles et des icônes selon la nature de l'activité
  const getActivityMeta = (description, type, isPayment) => {
    if (isPayment) {
      return { icon: "fa-credit-card", bgColor: "bg-blue-50", iconColor: "text-blue-600", defaultPoids: null };
    }
    const desc = (description || "").toUpperCase();
    
    if (desc.includes("BAC") || desc.includes("COLLECTE")) {
      return { icon: "fa-truck", bgColor: "bg-purple-50", iconColor: "text-[#6200ee]", defaultPoids: "15kg" };
    }
    if (desc.includes("TRI") || desc.includes("BONUS")) {
      return { icon: "fa-leaf", bgColor: "bg-green-50", iconColor: "text-green-600", defaultPoids: "5kg" };
    }
    if (desc.includes("BOUTIQUE") || desc.includes("ÉCHANGE") || type === "Dépense") {
      return { icon: "fa-bag-shopping", bgColor: "bg-red-50", iconColor: "text-red-500", defaultPoids: null };
    }
    return { icon: "fa-star", bgColor: "bg-amber-50", iconColor: "text-amber-500", defaultPoids: null };
  };

  useEffect(() => {
    async function fetchActivities() {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/user/activities");
          const result = await res.json();
          if (result.success) {
            setActivities(result.data);
          }
        } catch (error) {
          console.error("Erreur lors du fetch des activités :", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchActivities();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">Chargement du registre...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-8 animate-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto px-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mon Historique</h1>
        <p className="text-gray-500 font-bold">Suivez vos transactions et vos actions écologiques.</p>
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-[35px] p-12 text-center border border-gray-100 shadow-sm">
          <div className="h-16 w-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-4">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <p className="text-gray-800 font-black uppercase text-sm">Aucune activité enregistrée</p>
          <p className="text-gray-400 text-xs font-bold mt-1">Vos paiements et collectes apparaîtront ici dès validation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            // Détection dynamique s'il s'agit d'un paiement financier
            const isPayment = act.montant !== undefined;
            const meta = getActivityMeta(act.description, act.type, isPayment);
            
            // On utilise la date de création de la transaction financière ou la date par défaut
            const rawDate = act.createdAt || act.date;
            const formattedDate = new Date(rawDate).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div key={act._id} className="bg-white p-4 sm:p-6 rounded-[28px] border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
                
                {/* BLOC GAUCHE : Icône + Libellé + Badge Statut */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-14 w-14 sm:h-16 sm:w-16 ${meta.bgColor} rounded-[20px] flex items-center justify-center ${meta.iconColor} text-xl sm:text-2xl shrink-0 shadow-inner`}>
                    <i className={`fa-solid ${meta.icon}`}></i>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-800 uppercase text-xs sm:text-sm tracking-tight truncate">
                      {isPayment ? `Abonnement ${act.typeAbonnement}` : (act.description || "Activité")}
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{formattedDate}</p>
                    
                    {/* Badge dynamique selon le statut ou le type de transaction */}
                    {isPayment ? (
                      <span className={`inline-block mt-2 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        act.statut === "Réussi" ? "bg-green-100 text-green-600" :
                        act.statut === "En attente" ? "bg-amber-100 text-amber-500 animate-pulse" :
                        act.statut === "Inactif" ? "bg-gray-100 text-gray-500" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {act.statut}
                      </span>
                    ) : (
                      <span className={`inline-block mt-2 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${act.type === "Gain" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                        {act.type === "Gain" ? "Validé" : "Débité"}
                      </span>
                    )}
                  </div>
                </div>

                {/* BLOC DROITE : Montant (FCFA / Points) + Meta-Données (Opérateur / Référence) */}
                <div className="text-left sm:text-right shrink-0 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                  <div>
                    {isPayment ? (
                      <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter">
                        {act.montant?.toLocaleString("fr-FR")} FCFA
                      </p>
                    ) : (
                      <p className={`text-xl sm:text-2xl font-black ${act.type === "Gain" ? "text-[#6200ee]" : "text-red-500"} tracking-tighter`}>
                        {act.type === "Gain" ? "+" : "-"}{act.points}
                      </p>
                    )}
                    
                    <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-tight mt-0.5">
                      {isPayment ? `Via ${act.operateur}` : (act.type === "Gain" ? "Points gagnés" : "Points dépensés")}
                    </p>
                  </div>

                  {/* ID Référence ou Données métriques secondaires */}
                  {isPayment ? (
                    <div className="text-[9px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded mt-1 sm:mt-1.5 border border-gray-100">
                      Ref: {act.reference}
                    </div>
                  ) : (
                    meta.defaultPoids && (
                      <div className="mt-1 flex items-center gap-1 text-green-500 font-bold text-xs">
                        <i className="fa-solid fa-weight-hanging text-[10px]"></i> {meta.defaultPoids}
                      </div>
                    )
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}