"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function VidangePage() {
  const { data: session, status } = useSession();
  const [userPlan, setUserPlan] = useState("FOYER ÉCO"); 
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    typeDechet: "Plastique",
    volume: "Petit (1-2 sacs)",
    dateSouhaitee: "",
    instructions: ""
  });

  // Nettoyage et forçage en majuscules pour correspondre à la base de données
  const currentPlanClean = userPlan.toUpperCase().trim();

  // 🔥 Correction : On compare avec "AUCUN" en majuscules pour bloquer l'accès aux comptes sans forfait
  const isEligible = currentPlanClean !== "FOYER ÉCO" && 
                     currentPlanClean !== "AUCUN" && 
                     currentPlanClean !== "IMMEUBLE";

  useEffect(() => {
    async function fetchUserPlan() {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/user/profile");
          const result = await response.json();
          
          // 🔥 Correction : On cible l'attribut .type issu de la collection MongoDB
          if (result.success && result.data?.abonnement) {
            setUserPlan(result.data.abonnement.type || "FOYER ÉCO");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du forfait :", error);
        } finally {
          setLoadingPlan(false);
        }
      }
    }
    fetchUserPlan();
  }, [status]);

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!isEligible) return;

    if (!formData.dateSouhaitee) {
      Swal.fire({ icon: 'warning', title: 'Attention', text: 'Veuillez sélectionner une date.', background: '#fff' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/vidange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Commande validée !',
          text: 'Votre demande de vidange personnalisée a été transmise avec succès à nos équipes de ramassage.',
          confirmButtonColor: '#6200ee'
        });
        setFormData({ ...formData, dateSouhaitee: "", instructions: "" });
        e.target.reset();
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur', text: result.message || 'Une erreur est survenue.' });
      }
    } catch (error) {
      console.error("Erreur soumission vidange:", error);
      Swal.fire({ icon: 'error', title: 'Erreur réseau', text: 'Impossible de joindre le serveur.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || loadingPlan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest font-mono">Vérification de vos privilèges...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Nouvelle Vidange</h1>
          <p className="text-gray-500 font-bold">Planifiez votre collecte à la demande en 2 clics.</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border ${isEligible ? 'bg-purple-100 text-[#6200ee] border-purple-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
          Forfait : {userPlan}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 ml-2">Type de déchets</label>
                <select 
                  disabled={!isEligible}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#6200ee]/20 disabled:opacity-50"
                  value={formData.typeDechet}
                  onChange={(e) => setFormData({...formData, typeDechet: e.target.value})}
                >
                  <option value="Plastique">Plastique</option>
                  <option value="Papier / Carton">Papier / Carton</option>
                  <option value="tous Venant">Métal</option>
                  <option value="Verre">Verre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 ml-2">Volume estimé</label>
                <select 
                  disabled={!isEligible}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#6200ee]/20 disabled:opacity-50"
                  value={formData.volume}
                  onChange={(e) => setFormData({...formData, volume: e.target.value})}
                >
                  <option value="Petit (1-2 sacs)">Petit (1-2 sacs)</option>
                  <option value="Moyen (3-5 sacs)">Moyen (3-5 sacs)</option>
                  <option value="Grand (Conteneur)">Grand (Conteneur)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 ml-2">Date de passage souhaitée</label>
              <input 
                type="date" 
                disabled={!isEligible}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#6200ee]/20 disabled:opacity-50"
                value={formData.dateSouhaitee}
                onChange={(e) => setFormData({...formData, dateSouhaitee: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 ml-2">Instructions pour le chauffeur</label>
              <textarea 
                disabled={!isEligible}
                placeholder="Ex: Le bac est derrière le portail noir ou au coin de la clôture..."
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none h-32 resize-none focus:ring-2 focus:ring-[#6200ee]/20 disabled:opacity-50"
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              ></textarea>
            </div>

            {isEligible ? (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 rounded-2xl bg-[#6200ee] text-white font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? "Traitement..." : "Confirmer la vidange"}
              </button>
            ) : (
              <div className="p-6 rounded-[30px] bg-amber-50 border-2 border-amber-200 flex flex-col items-center text-center space-y-4 animate-fade-in">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-lg">
                  <i className="fa-solid fa-lock"></i>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-amber-900 uppercase">Option non incluse dans votre formule</p>
                  <p className="text-xs text-amber-700 font-bold max-w-md">
                    Les collectes d'urgence personnalisées sur demande sont réservées aux membres Premium, Pro Standard et Pro Business.
                  </p>
                </div>
                <Link href="/dashboard/abonnement" className="px-8 py-3 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-wider transition-all hover:bg-amber-600 active:scale-95 shadow-md">
                  Changer de formule
                </Link>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[40px] bg-black p-8 text-white shadow-xl">
            <h3 className="font-black text-xl italic text-[#ffcc00] mb-4 underline decoration-2">Rappel Sécurité</h3>
            <ul className="space-y-4 text-xs font-bold opacity-80">
              <li className="flex gap-2">
                <span>•</span> 
                <span>Veuillez trier et séparer le verre et les métaux des autres déchets avant l'arrivée du camion.</span>
              </li>
              <li className="flex gap-2">
                <span>•</span> 
                <span>Le chauffeur affecté à votre secteur vous appellera environ 10 minutes avant son entrée dans votre rue.</span>
              </li>
              <li className="flex gap-2">
                <span>•</span> 
                <span>Assurez-vous que les accès de collecte soient dégagés pour un chargement rapide et sécurisé.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}