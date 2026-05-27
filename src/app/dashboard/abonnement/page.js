"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2"; // Intégration de SweetAlert2

export default function AbonnementPage() {
  const [nbAppartements, setNbAppartements] = useState("");
  const [totalImmeuble, setTotalImmeuble] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);

  // États pour le guichet de paiement
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [operateur, setOperateur] = useState("Orange Money");
  const [email, setEmail] = useState(""); // Requis par FedaPay pour l'envoi du reçu

  // Nouvelle grille tarifaire par défaut avec sécurité carburant incluse
  const [dbPrices, setDbPrices] = useState({
    eco: { price: 3000, desc: "Pour les petits foyers" },
    premium: { price: 5000, desc: "Idéal pour les grandes familles" },
    immeuble: { price: 2500, desc: "Prix dégressif par appartement (Min. 6)" },
    pro_standard: { price: 15000, desc: "Pour les boutiques et petites écoles" },
    pro_business: { price: 40000, desc: "Pour les hôtels et supermarchés" }
  });

  // Chargement de la grille depuis l'administration
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/admin/finance/pricing");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.pricing) {
            const pricingMap = {};
            data.pricing.forEach(p => {
              pricingMap[p.planId] = p;
            });
            setDbPrices(prev => ({ ...prev, ...pricingMap }));
          }
        }
      } catch (err) {
        console.error("Erreur d'actualisation de la grille tarifaire:", err);
      } finally {
        setLoadingPrices(false);
      }
    }
    fetchPricing();
  }, []);

  // Calcul dynamique du plan immeuble basé sur le nouveau tarif de 2 500 FCFA
  useEffect(() => {
    const val = parseInt(nbAppartements) || 0;
    setTotalImmeuble(val * dbPrices.immeuble.price);
  }, [nbAppartements, dbPrices.immeuble.price]);

  const openPaymentFlow = (planName, amount) => {
    // Règle d'or : Minimum 6 appartements pour amortir le trajet du camion
    if (planName === "Immeuble") {
      const appartementsCount = parseInt(nbAppartements) || 0;
      if (appartementsCount < 6) {
        Swal.fire({
          title: "Minimum requis",
          text: "La formule Immeuble nécessite un minimum de 6 appartements pour valider la rentabilité de la tournée.",
          icon: "info",
          confirmButtonColor: "#6200ee",
          customClass: { popup: "rounded-[35px]" }
        });
        return;
      }
    }
    setSelectedPlan({ name: planName, amount });
    setShowPayModal(true);
  };

  const handleFinalPayment = async () => {
    // Validation de l'email (Requis pour FedaPay)
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      Swal.fire({
        title: "Email requis",
        text: "Veuillez entrer une adresse email valide pour recevoir votre reçu de paiement.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        customClass: { popup: "rounded-[35px]" }
      });
      return;
    }

    // Validation du numéro si un mode mobile money est choisi
    if (operateur !== "Card" && (!phoneNumber || phoneNumber.trim().length < 8)) {
      Swal.fire({
        title: "Numéro invalide",
        text: "Veuillez entrer un numéro de téléphone valide pour initier le prélèvement mobile.",
        icon: "warning",
        confirmButtonColor: "#ef4444",
        customClass: { popup: "rounded-[35px]" }
      });
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);
      const response = await fetch("/api/finance/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: selectedPlan.name,
          amount: selectedPlan.amount,
          nombreAppartements: selectedPlan.name === "Immeuble" ? parseInt(nbAppartements) : 1,
          operateur: operateur,
          phoneNumber: operateur === "Card" ? "" : phoneNumber,
          email: email
        })
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Notification stylisée avant redirection FedaPay
        Swal.fire({
          title: "Redirection FedaPay...",
          text: "Nous vous connectons à la passerelle de paiement sécurisée.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: "rounded-[35px]" }
        });
        
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1500);
      } else {
        Swal.fire({
          title: "Échec de la transaction",
          text: data.message || "Vérifiez vos configurations API FedaPay.",
          icon: "error",
          confirmButtonColor: "#ef4444",
          customClass: { popup: "rounded-[35px]" }
        });
      }
    } catch (err) {
      console.error("Erreur réseau passerelle:", err);
      Swal.fire({
        title: "Erreur serveur",
        text: "Impossible de joindre le serveur de validation de paiement.",
        icon: "error",
        confirmButtonColor: "#ef4444",
        customClass: { popup: "rounded-[35px]" }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Grille tarifaire complète restructurée (Particuliers + Professionnels)
  const plans = [
    {
      name: "Foyer Éco",
      price: dbPrices.eco.price,
      desc: dbPrices.eco.desc,
      features: [
        { text: "1 bac / Semaine (Jour fixe)", check: true },
        { text: "Suivi Live du camion", check: true },
        { text: "Notifications SMS / Push", check: true },
        { text: "1 Collecte d'urgence incluse", check: false },
      ],
      type: "fixed",
      color: "bg-[#f8f0ff]",
      btnColor: "bg-[#6200ee]"
    },
    {
      name: "Foyer Premium",
      price: dbPrices.premium.price,
      desc: dbPrices.premium.desc,
      features: [
        { text: "2 bacs / Semaine (Haute fréquence)", check: true },
        { text: "Suivi Live + Notifications", check: true },
        { text: "1 Collecte d'urgence / mois incluse", check: true },
        { text: "Accès prioritaire récompenses", check: true },
      ],
      type: "fixed",
      color: "bg-purple-900 text-white",
      btnColor: "bg-emerald-500"
    },
    {
      name: "Immeuble",
      price: totalImmeuble,
      desc: dbPrices.immeuble.desc,
      features: [
        { text: "3 passages / Semaine", check: true },
        { text: "Bac collectif optimisé", check: true },
        { text: "Idéal pour syndics de copropriété", check: true },
      ],
      type: "input",
      color: "bg-white border-2 border-purple-200",
      btnColor: "bg-[#6200ee]"
    },
    {
      name: "Pro Standard",
      price: dbPrices.pro_standard.price,
      desc: dbPrices.pro_standard.desc,
      features: [
        { text: "2 grands bacs pros (120L)", check: true },
        { text: "2 collectes par semaine", check: true },
        { text: "Facturation certifiée entreprise", check: true },
      ],
      type: "fixed",
      color: "bg-zinc-50 border border-zinc-200",
      btnColor: "bg-zinc-900"
    },
    {
      name: "Pro Business",
      price: dbPrices.pro_business.price,
      desc: dbPrices.pro_business.desc,
      features: [
        { text: "Volume commercial supérieur", check: true },
        { text: "Collecte fréquente (3-4 fois / sem)", check: true },
        { text: "Passage heures creuses (Matinal/Tardif)", check: true },
      ],
      type: "fixed",
      color: "bg-zinc-50 border border-zinc-200",
      btnColor: "bg-zinc-900"
    }
  ];

  if (loadingPrices) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#6200ee] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold tracking-tight animate-pulse">Sincronisation de l'écosystème financier...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-10 min-h-screen animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
      
      {/* En-tête de la page */}
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter">Choisissez votre Abonnement</h1>
        <p className="text-gray-500 font-bold mt-2">Des tarifications équilibrées adaptées à la réalité opérationnelle d'Eco Track.</p>
      </div>

      {/* Cartes d'Abonnement en grille adaptative */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {plans.map((plan, index) => (
          <div key={index} className={`rounded-[35px] p-8 flex flex-col shadow-sm transition-all hover:shadow-2xl ${plan.color}`}>
            
            <div className="text-center mb-8">
               <h2 className="text-2xl font-black tracking-tight uppercase">{plan.name}</h2>
               <p className={`text-xs font-bold mt-2 ${plan.color.includes('text-white') ? 'text-purple-200' : 'text-gray-500'}`}>{plan.desc}</p>
            </div>

            <div className="flex-1">
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-xs">
                    <span className={f.check ? "text-emerald-500 text-lg" : "text-red-500 text-lg"}>
                      {f.check ? "✓" : "✕"}
                    </span>
                    <span className={plan.color.includes('text-white') ? 'text-zinc-100' : 'text-gray-700'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {plan.type === "input" && (
                <div className="space-y-4 mb-8 text-center border-t border-dashed pt-4 border-purple-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Nombre d'appartements :</p>
                  <input 
                    type="number" 
                    placeholder="Min : 6"
                    min="6"
                    disabled={isProcessing}
                    value={nbAppartements}
                    onChange={(e) => setNbAppartements(e.target.value)}
                    className="w-full max-w-[150px] border border-gray-300 rounded-xl py-2 px-4 text-center font-black text-gray-800 outline-none focus:border-[#6200ee] shadow-inner"
                  />
                  <p className="text-[#6200ee] font-black text-lg">Total : {plan.price.toLocaleString()} FCFA</p>
                </div>
              )}
            </div>

            <div className="mt-auto text-center">
              {plan.type === "fixed" && (
                <div className="mb-6">
                  <span className={`text-3xl font-black ${plan.color.includes('text-white') ? 'text-emerald-400' : 'text-[#6200ee]'}`}>{plan.price.toLocaleString()} FCFA</span>
                  <span className={`font-bold ml-1 text-xs ${plan.color.includes('text-white') ? 'text-purple-200' : 'text-gray-400'}`}>/ mois</span>
                </div>
              )}
              
              <button 
                onClick={() => openPaymentFlow(plan.name, plan.price)}
                disabled={isProcessing || (plan.type === "input" && plan.price <= 0)}
                className={`w-full py-4 rounded-2xl text-white font-black uppercase text-xs tracking-widest shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none ${plan.btnColor}`}
              >
                Souscrire
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mention Information Client - FedaPay */}
      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-3xl shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-emerald-600 text-xl font-bold">🔒</span>
          <div>
            <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Paiement Sécurisé Multi-Réseaux via FedaPay</p>
            <p className="text-xs font-bold text-emerald-700 leading-relaxed mt-0.5">
              Tous nos abonnements sont traités de manière sécurisée. Vous pouvez payer par **Mobile Money (MTN, Orange, Moov, Wave)** ou par **Carte Bancaire**. Aucun frais caché ne sera appliqué sur votre reçu final.
            </p>
          </div>
        </div>
      </div>

      {/* --- BOX DIALOGUE SÉCURISÉ (MODAL NUMÉRO, EMAIL & OPTIONS DE PAIEMENT FEDAPAY) --- */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[35px] p-8 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-emerald-500"></div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">Guichet Multi-Paiement</h3>
            <p className="text-xs text-gray-500 font-bold mb-6 uppercase tracking-wider">Formule {selectedPlan?.name} • {selectedPlan?.amount.toLocaleString()} FCFA net</p>

            <div className="space-y-5">
              
              {/* Entrée Email requise par FedaPay */}
              <div>
                <label className="block text-xs font-black uppercase text-zinc-400 mb-2">Adresse Email (Pour votre reçu)</label>
                <input 
                  type="email"
                  placeholder="Ex: client@ecotrack.cm"
                  disabled={isProcessing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl py-3 px-4 font-bold outline-none focus:border-[#6200ee] text-sm transition-all shadow-inner"
                />
              </div>

              {/* Sélection exhaustive des réseaux FedaPay */}
              <div>
                <label className="block text-xs font-black uppercase text-zinc-400 mb-2.5">1. Choisissez votre mode de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setOperateur("Orange Money")}
                    className={`p-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${operateur === "Orange Money" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-700 hover:bg-zinc-50"}`}
                  >
                    🍊 Orange
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOperateur("MTN MoMo")}
                    className={`p-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${operateur === "MTN MoMo" ? "border-yellow-500 bg-yellow-50 text-yellow-700" : "border-gray-200 text-gray-700 hover:bg-zinc-50"}`}
                  >
                    💛 MTN MoMo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOperateur("Wave")}
                    className={`p-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${operateur === "Wave" ? "border-sky-500 bg-sky-50 text-sky-600" : "border-gray-200 text-gray-700 hover:bg-zinc-50"}`}
                  >
                    🌊 Wave
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOperateur("Card")}
                    className={`p-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${operateur === "Card" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-700 hover:bg-zinc-50"}`}
                  >
                    💳 Carte/Visa
                  </button>
                </div>
              </div>

              {/* Numéro de téléphone masqué si paiement par Carte */}
              {operateur !== "Card" && (
                <div>
                  <label className="block text-xs font-black uppercase text-zinc-400 mb-2">2. Numéro de téléphone de prélèvement</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">+237</span>
                    <input 
                      type="tel"
                      placeholder="Ex: 6xxxxxxx"
                      maxLength={9}
                      disabled={isProcessing}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full border-2 border-gray-200 rounded-xl py-2.5 pl-16 pr-4 font-black tracking-widest outline-none focus:border-[#6200ee] text-base transition-all shadow-inner"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowPayModal(false)}
                  className="w-1/2 py-3.5 rounded-xl bg-zinc-100 text-zinc-600 font-black uppercase text-xs tracking-wider transition-all active:scale-95 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={handleFinalPayment}
                  disabled={isProcessing || (!phoneNumber && operateur !== "Card") || !email}
                  className="w-1/2 py-3.5 rounded-xl bg-emerald-500 text-white font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? "Liaison FedaPay..." : `Payer`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}